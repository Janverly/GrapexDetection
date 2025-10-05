import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  user: any | null;
  isPending: boolean;
  redirectToLogin: () => Promise<void>;
  exchangeCodeForSessionToken: () => Promise<any>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isPending: true,
  redirectToLogin: async () => {},
  exchangeCodeForSessionToken: async () => null,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isPending, setIsPending] = useState(true);
  // navigate not needed here but kept available via hook consumers

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          if (mounted) setUser(data);
        }
      } catch (e) {
        // silent
      } finally {
        if (mounted) setIsPending(false);
      }
    })();

    return () => { mounted = false };
  }, []);

  const redirectToLogin = async () => {
    const res = await fetch('/api/oauth/google/redirect_url');
    if (!res.ok) throw new Error('Failed to get redirect URL');
    const data = await res.json();
    window.location.href = data.redirectUrl;
  };

  const exchangeCodeForSessionToken = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) throw new Error('No code in query');

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) throw new Error('Failed to exchange code');
    // After successful exchange, fetch user
    const me = await (await fetch('/api/users/me')).json();
    setUser(me);
    return me;
  };

  const logout = async () => {
    try {
      await fetch('/api/logout');
    } catch (e) {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isPending, redirectToLogin, exchangeCodeForSessionToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthProvider;
