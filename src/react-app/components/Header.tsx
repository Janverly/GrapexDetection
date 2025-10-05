import { useAuth } from "@/react-app/utils/auth";
import { useNavigate } from "react-router";
import { User } from "lucide-react";
import HamburgerMenu from "./HamburgerMenu";

interface HeaderProps {
  title: string;
  showProfile?: boolean;
}

export default function Header({ title, showProfile = true }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-gradient-to-r from-green-600 via-green-700 to-purple-600 text-white px-4 py-6 pb-8">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          <HamburgerMenu />
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <img 
              src="https://mocha-cdn.com/01999a54-b558-71fe-9ed3-c8aaf7516305/grapex-logo-5YsULcDk.jpeg" 
              alt="GrapeX Logo" 
              className="w-6 h-6 rounded-md object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {user && showProfile && (
              <p className="text-green-100 text-sm">Welcome, {user.google_user_data.given_name || user.email}</p>
            )}
          </div>
        </div>
        {user && showProfile && user.google_user_data.picture && (
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full border-2 border-white/30 hover:border-white/50 transition-colors"
          >
            <img
              src={user.google_user_data.picture}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          </button>
        )}
        {user && showProfile && !user.google_user_data.picture && (
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <User className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
