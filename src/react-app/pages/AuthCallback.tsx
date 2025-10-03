import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const user: any = await exchangeCodeForSessionToken();
        // Check if user is admin and redirect appropriately
        if (user && (user.email && (user.email.includes("admin") || user.email === "admin@grapexdetection.com" || user.email === "dpride07@gmail.com" || user.email === "grapix2024@gmail.com"))) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Authentication failed:", error);
        navigate("/");
      }
    };
    handleAuth();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin mb-4">
          <Loader2 className="w-12 h-12 text-green-600 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Signing you in...
        </h2>
        <p className="text-gray-600">Please wait while we complete the authentication process.</p>
      </div>
    </div>
  );
}
