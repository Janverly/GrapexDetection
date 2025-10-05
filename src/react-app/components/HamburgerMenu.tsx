import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/utils/auth";
import { Menu, X, Home, Camera, History, Shield, LogOut, User } from "lucide-react";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
    setIsOpen(false);
  };

  const isAdmin = user && (user.email.includes("admin") || user.email === "admin@grapexdetection.com" || user.email === "dpride07@gmail.com" || user.email === "grapix2024@gmail.com");

  // Redirect admin users to admin panel only
  if (isAdmin && window.location.pathname !== "/admin") {
    navigate("/admin");
    return null;
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="p-2 bg-white/20 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Panel */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <img
                src="/assets/grapex-logo.svg"
                alt="GrapeX Logo"
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">GrapeX</h2>
                <p className="text-sm text-gray-600">Disease Detection</p>
              </div>
            </div>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="mb-8 p-4 bg-gradient-to-r from-green-50 to-purple-50 rounded-xl border border-green-100">
              <div className="flex items-center space-x-3">
                {user.google_user_data.picture ? (
                  <img
                    src={user.google_user_data.picture}
                    alt="Profile"
                    className="w-12 h-12 rounded-full border-2 border-white"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-white bg-gradient-to-r from-green-400 to-purple-400 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user.google_user_data.given_name?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user.google_user_data.given_name || user.email.split('@')[0]}
                  </h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  {isAdmin && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 mt-1">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-2">
            <button
              onClick={() => handleNavigation("/")}
              className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Home</div>
                <div className="text-sm text-gray-600">Dashboard & overview</div>
              </div>
            </button>

            <button
              onClick={() => handleNavigation("/scanner")}
              className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Scanner</div>
                <div className="text-sm text-gray-600">Detect grape diseases</div>
              </div>
            </button>

            <button
              onClick={() => handleNavigation("/history")}
              className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <History className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">History</div>
                <div className="text-sm text-gray-600">View past scans</div>
              </div>
            </button>

            <button
              onClick={() => handleNavigation("/profile")}
              className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Profile</div>
                <div className="text-sm text-gray-600">Account & stats</div>
              </div>
            </button>

            
          </nav>

          {/* Sign Out */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-left text-red-600"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="font-semibold">Sign Out</div>
                <div className="text-sm text-red-500">Logout from account</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
