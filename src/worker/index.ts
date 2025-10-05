import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
// Implement Google OAuth flow directly instead of using the @getmocha users-service
import { getCookie, setCookie } from "hono/cookie";

// Worker globals (help TypeScript in this environment)
declare const fetch: any;
declare const URLSearchParams: any;

// Minimal Env type for Cloudflare bindings used in this worker
interface Env {
  DB: any;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_OAUTH_REDIRECT_URI: string;
}

const GOOGLE_SESSION_TOKEN_COOKIE_NAME = "gx_session_token";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
};

// Build the Google OAuth2 authorization URL
function buildGoogleOAuthRedirectUrl(env: Env) {
  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = env.GOOGLE_OAUTH_REDIRECT_URI; // should be provided in environment
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "consent",
    access_type: "offline",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange authorization code for tokens at Google's token endpoint
async function exchangeCodeForTokens(code: string, env: Env) {
  const tokenUrl = "https://oauth2.googleapis.com/token";
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }

  return res.json();
}

// Verify ID token by calling Google's tokeninfo endpoint and return user info
async function verifyIdToken(idToken: string) {
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  // tokeninfo returns fields like email, sub (user id), name, picture
  return data;
}

// Hono middleware that verifies the session cookie (ID token) and attaches user
const authMiddleware = async (c: any, next: any) => {
  const token = getCookie(c, GOOGLE_SESSION_TOKEN_COOKIE_NAME);
  if (!token || typeof token !== "string") {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const user = await verifyIdToken(token);
    if (!user || !user.email) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", {
      id: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });

    return await next();
  } catch (err) {
    return c.json({ error: "Unauthorized" }, 401);
  }
};
import { CreateScanSchema, CreateReportSchema } from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Auth routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  try {
    const redirectUrl = buildGoogleOAuthRedirectUrl(c.env as unknown as Env);
    return c.json({ redirectUrl }, 200);
  } catch (err: any) {
    return c.json({ error: err.message || String(err) }, 500);
  }
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  try {
    const tokens = await exchangeCodeForTokens(body.code, c.env as unknown as Env);

    // tokens should include id_token which is a JWT containing user info
    const idToken = tokens.id_token;
    const accessToken = tokens.access_token;
    if (!idToken) {
      return c.json({ error: "No id_token received from Google" }, 500);
    }

    // Optionally verify ID token server-side now
    const user = await verifyIdToken(idToken);
    if (!user) return c.json({ error: "Invalid id_token" }, 401);

    // Store id_token for authentication and access_token to allow optional revocation
    setCookie(c, GOOGLE_SESSION_TOKEN_COOKIE_NAME, idToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 60 * 24 * 60 * 60, // 60 days
    });

    if (accessToken) {
      setCookie(c, `${GOOGLE_SESSION_TOKEN_COOKIE_NAME}_access`, accessToken, {
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: true,
        maxAge: 60 * 24 * 60 * 60,
      });
    }

    return c.json({ success: true }, 200);
  } catch (err: any) {
    return c.json({ error: err.message || String(err) }, 500);
  }
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json((c as any).get("user"));
});

app.get('/api/logout', async (c) => {
  // Try to revoke the access token (if present) then clear cookies
  const accessToken = getCookie(c, `${GOOGLE_SESSION_TOKEN_COOKIE_NAME}_access`);
  if (accessToken && typeof accessToken === 'string') {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, {
        method: 'POST',
        headers: { 'Content-type': 'application/x-www-form-urlencoded' },
      });
    } catch (e) {
      // ignore revocation errors
    }
  }

  setCookie(c, GOOGLE_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  setCookie(c, `${GOOGLE_SESSION_TOKEN_COOKIE_NAME}_access`, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Diseases endpoints
app.get("/api/diseases", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM diseases ORDER BY name"
  ).all();

  return c.json(results);
});

app.get("/api/admin/reports", authMiddleware, async (c) => {
  const user = (c as any).get("user") as AuthUser | undefined;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  if (!user.email.includes("admin") && user.email !== "admin@grapexdetection.com" && user.email !== "dpride07@gmail.com" && user.email !== "grapix2024@gmail.com") {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM reports ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

app.put("/api/admin/reports/:id/status", authMiddleware, async (c) => {
  const user = (c as any).get("user") as AuthUser | undefined;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  if (!user.email.includes("admin") && user.email !== "admin@grapexdetection.com" && user.email !== "dpride07@gmail.com" && user.email !== "grapix2024@gmail.com") {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const reportId = c.req.param("id");
  const body = await c.req.json();
  
  if (!body.status || !["pending", "investigating", "resolved", "dismissed"].includes(body.status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  const { success } = await c.env.DB.prepare(
    "UPDATE reports SET status = ?, updated_at = datetime('now') WHERE id = ?"
  )
    .bind(body.status, reportId)
    .run();

  if (!success) {
    return c.json({ error: "Failed to update report" }, 500);
  }

  return c.json({ success: true });
});

// Scans endpoints
app.get("/api/scans", authMiddleware, async (c) => {
  const user = (c as any).get("user") as AuthUser | undefined;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM scans WHERE user_id = ? ORDER BY created_at DESC"
  )
    .bind(user.id)
    .all();

  return c.json(results);
});

app.post("/api/scans", authMiddleware, zValidator("json", CreateScanSchema), async (c) => {
  const user = (c as any).get("user") as AuthUser | undefined;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const body = c.req.valid("json");

  const { success } = await c.env.DB.prepare(
    `INSERT INTO scans (user_id, image_url, disease_detected, confidence_score, recommendations, location_lat, location_lng, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  )
    .bind(
      user.id,
      body.image_url,
      body.disease_detected || null,
      body.confidence_score || null,
      body.recommendations || null,
      body.location_lat || null,
      body.location_lng || null
    )
    .run();

  if (!success) {
    return c.json({ error: "Failed to create scan" }, 500);
  }

  return c.json({ success: true }, 201);
});

// Reports endpoints
app.get("/api/reports", authMiddleware, async (c) => {
  const user = (c as any).get("user") as AuthUser | undefined;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC"
  )
    .bind(user.id)
    .all();

  return c.json(results);
});

app.post("/api/reports", authMiddleware, zValidator("json", CreateReportSchema), async (c) => {
  const user = (c as any).get("user") as AuthUser | undefined;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const body = c.req.valid("json");

  const { success } = await c.env.DB.prepare(
    `INSERT INTO reports (user_id, type, title, description, scan_id, location_lat, location_lng, severity, status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`
  )
    .bind(
      user.id,
      body.type,
      body.title,
      body.description,
      body.scan_id || null,
      body.location_lat || null,
      body.location_lng || null,
      body.severity
    )
    .run();

  if (!success) {
    return c.json({ error: "Failed to create report" }, 500);
  }

  return c.json({ success: true }, 201);
});

// Admin endpoints
app.get("/api/admin/users", authMiddleware, async (c) => {
  const user = (c as any).get("user") as AuthUser | undefined;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  if (!user.email.includes("admin") && user.email !== "admin@grapexdetection.com" && user.email !== "dpride07@gmail.com" && user.email !== "grapix2024@gmail.com") {
    return c.json({ error: "Unauthorized" }, 403);
  }

  // Get user statistics from scans table since we don't have direct user access
  const { results: userStats } = await c.env.DB.prepare(`
    SELECT 
      user_id,
      COUNT(*) as total_scans,
      COUNT(CASE WHEN disease_detected != 'Healthy' AND disease_detected IS NOT NULL THEN 1 END) as disease_scans,
      MIN(created_at) as first_scan,
      MAX(created_at) as last_scan
    FROM scans 
    GROUP BY user_id 
    ORDER BY last_scan DESC
  `).all();

  return c.json(userStats);
});

app.get("/api/admin/stats", authMiddleware, async (c) => {
  const user = (c as any).get("user") as AuthUser | undefined;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  // Simple admin check - you might want to add a proper role system
  if (!user.email.includes("admin") && user.email !== "admin@grapexdetection.com" && user.email !== "dpride07@gmail.com" && user.email !== "grapix2024@gmail.com") {
    return c.json({ error: "Unauthorized" }, 403);
  }

  // Get total users count
  const { totalUsers } = await c.env.DB.prepare(
    "SELECT COUNT(DISTINCT user_id) as totalUsers FROM scans"
  ).first() as { totalUsers: number };

  // Get total scans count
  const { totalScans } = await c.env.DB.prepare(
    "SELECT COUNT(*) as totalScans FROM scans"
  ).first() as { totalScans: number };

  // Get recent scans
  const { results: recentScans } = await c.env.DB.prepare(
    "SELECT * FROM scans ORDER BY created_at DESC LIMIT 10"
  ).all();

  // Get disease distribution - only include diseases from our model
  const validDiseases = ['Healthy', 'Black Rot', 'Black Measle'];
  const { results: diseaseStats } = await c.env.DB.prepare(
    "SELECT disease_detected, COUNT(*) as count FROM scans WHERE disease_detected IS NOT NULL AND disease_detected IN ('Healthy', 'Black Rot', 'Black Measle') GROUP BY disease_detected"
  ).all();

  const diseaseDistribution = diseaseStats.reduce((acc: { [key: string]: number }, stat: any) => {
    acc[stat.disease_detected] = stat.count;
    return acc;
  }, {});

  // Ensure all valid diseases are present with 0 count if no data
  validDiseases.forEach(disease => {
    if (!(disease in diseaseDistribution)) {
      diseaseDistribution[disease] = 0;
    }
  });

  return c.json({
    totalUsers: totalUsers || 0,
    totalScans: totalScans || 0,
    recentScans,
    diseaseDistribution,
  });
});

app.get("/api/admin/scans", authMiddleware, async (c) => {
  const user = (c as any).get("user") as AuthUser | undefined;
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  if (!user.email.includes("admin") && user.email !== "admin@grapexdetection.com" && user.email !== "dpride07@gmail.com" && user.email !== "grapix2024@gmail.com") {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM scans ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

export default app;
