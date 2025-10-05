import { useAuth } from "@/react-app/utils/auth";
import { LogOut, Shield } from "lucide-react";

interface AdminHeaderProps {
  title: string;
}

export default function AdminHeader({ title }: AdminHeaderProps) {
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <header className="bg-gradient-to-r from-purple-600 via-purple-700 to-red-600 text-white px-4 py-6 pb-8">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <img 
                  src="/assets/grapex-logo.svg" 
                  alt="GrapeX Logo" 
                  className="w-6 h-6 rounded-md object-cover"
                />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold">{title}</h1>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </div>
            </div>
            {user && (
              <p className="text-purple-100 text-sm">Admin: {user.google_user_data.given_name || user.email}</p>
            )}
          </div>
        </div>
        
        <button
          onClick={handleSignOut}
          className="p-2 bg-white/20 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 text-white" />
        </button>
      </div>
    </header>
  );
}
