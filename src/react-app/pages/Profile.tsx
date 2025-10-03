import { useState, useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import { Mail, Calendar, Activity, Camera, History, Shield, LogOut, Settings, Edit3 } from "lucide-react";
import Header from "@/react-app/components/Header";
import { ScanType } from "@/shared/types";

interface UserStats {
  totalScans: number;
  healthyScans: number;
  diseaseScans: number;
  healthyPercentage: number;
  firstScanDate: string | null;
  lastScanDate: string | null;
  mostCommonDisease: string | null;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentScans, setRecentScans] = useState<ScanType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/scans");
      if (response.ok) {
        const scans: ScanType[] = await response.json();
        
        const totalScans = scans.length;
        const healthyScans = scans.filter(scan => scan.disease_detected === "Healthy").length;
        const diseaseScans = totalScans - healthyScans;
        const healthyPercentage = totalScans > 0 ? Math.round((healthyScans / totalScans) * 100) : 0;
        
        const sortedScans = scans.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const firstScanDate = sortedScans.length > 0 ? sortedScans[0].created_at : null;
        const lastScanDate = sortedScans.length > 0 ? sortedScans[sortedScans.length - 1].created_at : null;
        
        // Find most common disease (excluding healthy)
        const diseaseCount: { [key: string]: number } = {};
        scans.forEach(scan => {
          if (scan.disease_detected && scan.disease_detected !== "Healthy") {
            diseaseCount[scan.disease_detected] = (diseaseCount[scan.disease_detected] || 0) + 1;
          }
        });
        
        const mostCommonDisease = Object.keys(diseaseCount).length > 0 
          ? Object.keys(diseaseCount).reduce((a, b) => diseaseCount[a] > diseaseCount[b] ? a : b)
          : null;

        setStats({
          totalScans,
          healthyScans,
          diseaseScans,
          healthyPercentage,
          firstScanDate,
          lastScanDate,
          mostCommonDisease,
        });

        setRecentScans(scans.slice(0, 3)); // Get last 3 scans
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getJoinDate = () => {
    if (stats?.firstScanDate) {
      return formatDate(stats.firstScanDate);
    }
    return "Recently joined";
  };

  const isAdmin = user && (user.email.includes("admin") || user.email === "admin@grapexdetection.com" || user.email === "dpride07@gmail.com" || user.email === "grapix2024@gmail.com");

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Profile" />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Profile" showProfile={false} />

      <div className="px-4 -mt-4 relative z-10">
        <div className="max-w-md mx-auto space-y-6">
          {/* User Info Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-4 mb-4">
              {user.google_user_data.picture ? (
                <img
                  src={user.google_user_data.picture}
                  alt="Profile"
                  className="w-20 h-20 rounded-full border-4 border-green-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-green-100 bg-gradient-to-r from-green-400 to-purple-400 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {user.google_user_data.given_name?.[0] || user.email[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {user.google_user_data.given_name && user.google_user_data.family_name
                    ? `${user.google_user_data.given_name} ${user.google_user_data.family_name}`
                    : user.google_user_data.given_name || user.email.split('@')[0]}
                </h2>
                <div className="flex items-center space-x-2 text-gray-600 mt-1">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 mt-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Joined {getJoinDate()}</span>
                </div>
                {isAdmin && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 mt-2">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <Activity className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Your Statistics</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">{stats?.totalScans || 0}</div>
                <div className="text-sm text-gray-600">Total Scans</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{stats?.healthyPercentage || 0}%</div>
                <div className="text-sm text-gray-600">Healthy Rate</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <div className="text-2xl font-bold text-red-600">{stats?.diseaseScans || 0}</div>
                <div className="text-sm text-gray-600">Issues Found</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-2xl font-bold text-purple-600">
                  {stats?.lastScanDate ? formatDate(stats.lastScanDate).split(',')[0].split(' ').slice(0, 2).join(' ') : 'None'}
                </div>
                <div className="text-sm text-gray-600">Last Scan</div>
              </div>
            </div>

            {stats?.mostCommonDisease && (
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h4 className="font-semibold text-gray-900 mb-1">Most Detected Issue</h4>
                <p className="text-sm text-yellow-700">{stats.mostCommonDisease}</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {recentScans.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <History className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-bold text-gray-900">Recent Scans</h3>
                </div>
                <button
                  onClick={() => navigate("/history")}
                  className="text-sm text-green-600 font-medium hover:text-green-700"
                >
                  View All
                </button>
              </div>
              
              <div className="space-y-3">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={scan.image_url}
                      alt="Scan"
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {scan.disease_detected || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(scan.created_at)}
                      </div>
                    </div>
                    {scan.confidence_score && (
                      <div className="text-xs text-gray-500">
                        {(scan.confidence_score * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/scanner")}
                className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 text-sm">New Scan</div>
                  <div className="text-xs text-gray-600">Take photo</div>
                </div>
              </button>

              <button
                onClick={() => navigate("/history")}
                className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 text-sm">History</div>
                  <div className="text-xs text-gray-600">View scans</div>
                </div>
              </button>

              <button
                onClick={() => navigate("/report")}
                className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900 text-sm">Report</div>
                  <div className="text-xs text-gray-600">Submit issue</div>
                </div>
              </button>

              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 text-sm">Admin</div>
                    <div className="text-xs text-gray-600">Manage app</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Account Management */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Account</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">App Version</div>
                    <div className="text-sm text-gray-600">GrapeX v1.0.0</div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors text-red-600"
              >
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Sign Out</div>
                  <div className="text-sm text-red-500">Logout from account</div>
                </div>
              </button>
            </div>
          </div>

          {/* Getting Started Guide (if no scans) */}
          {(stats?.totalScans || 0) === 0 && (
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Welcome to GrapeX!</h3>
              <p className="text-green-100 text-sm leading-relaxed mb-4">
                Start by taking your first scan to monitor your vineyard's health. Our AI will help identify any diseases and provide recommendations.
              </p>
              <button
                onClick={() => navigate("/scanner")}
                className="bg-white text-green-600 py-2 px-4 rounded-lg font-semibold text-sm"
              >
                Take First Scan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
