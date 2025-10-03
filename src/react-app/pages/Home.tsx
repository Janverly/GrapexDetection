import { useState, useEffect, useRef } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import { Camera, Upload, History, AlertTriangle, Leaf, RotateCcw, Cloud, Droplets, Wind, Activity, User } from "lucide-react";
import HamburgerMenu from "@/react-app/components/HamburgerMenu";



interface VineyardStats {
  totalScans: number;
  healthyScans: number;
  diseaseScans: number;
  healthyPercentage: number;
}

export default function Home() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<VineyardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/scans");
      if (response.ok) {
        const scans = await response.json();
        const totalScans = scans.length;
        const healthyScans = scans.filter((scan: any) => scan.disease_detected === "Healthy").length;
        const diseaseScans = totalScans - healthyScans;
        const healthyPercentage = totalScans > 0 ? Math.round((healthyScans / totalScans) * 100) : 0;

        setStats({
          totalScans,
          healthyScans,
          diseaseScans,
          healthyPercentage,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        // Store the uploaded image in localStorage to pass to scanner
        localStorage.setItem('uploadedImage', imageUrl);
        localStorage.setItem('imageSource', 'upload');
        navigate('/scanner');
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-green-400 flex items-center justify-center">
        <div className="animate-spin">
          <img 
            src="https://mocha-cdn.com/01999a54-b558-71fe-9ed3-c8aaf7516305/grapex-logo-5YsULcDk.jpeg" 
            alt="Loading" 
            className="w-12 h-12 rounded-lg object-cover"
          />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const detectableDiseases = [
    { name: "Black Rot", icon: "🍇", severity: "High" },
    { name: "Black Measle", icon: "🔴", severity: "Medium" },
    { name: "Healthy Leaves", icon: "🍃", severity: "None" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Hamburger Menu */}
      <div className="bg-gradient-to-r from-purple-400 via-purple-500 to-green-400 text-white px-4 pt-12 pb-8">
        <div className="max-w-md mx-auto">
          {/* Top navigation bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <HamburgerMenu />
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <img 
                  src="https://mocha-cdn.com/01999a54-b558-71fe-9ed3-c8aaf7516305/grapex-logo-5YsULcDk.jpeg" 
                  alt="GrapeX Logo" 
                  className="w-6 h-6 rounded-md object-cover"
                />
              </div>
            </div>
            {user && user.google_user_data.picture && (
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
            {user && !user.google_user_data.picture && (
              <button
                onClick={() => navigate("/profile")}
                className="w-10 h-10 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <User className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="text-center mb-6">
            {/* Logo */}
            <div className="mb-6">
              <img 
                src="https://mocha-cdn.com/01999a54-b558-71fe-9ed3-c8aaf7516305/grapex-logo-5YsULcDk.jpeg" 
                alt="GrapeX Logo" 
                className="w-20 h-20 mx-auto rounded-2xl object-cover shadow-lg border-4 border-white/20"
              />
            </div>
            <p className="text-purple-100 mb-2">Welcome to</p>
            <h1 className="text-3xl font-bold mb-2">GrapeX</h1>
            <p className="text-purple-100 text-sm">AI-powered grape disease detection 🍇</p>
            {user && (
              <p className="text-purple-100 text-sm mt-2">Hello, {user.google_user_data.given_name || user.email.split('@')[0]}!</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Weather Widget */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">La Union Weather</h3>
                <p className="text-sm text-gray-600 mb-3">Patchy rain nearby</p>
                <div className="text-3xl font-bold text-gray-900">26°C</div>
              </div>
              <div className="text-right">
                <Cloud className="w-12 h-12 text-orange-400 mb-2 ml-auto" />
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span>79%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Wind className="w-4 h-4 text-gray-500" />
                    <span>15 km/h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex justify-between">
              <button
                onClick={() => navigate("/scanner")}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Scan</span>
              </button>

              <button
                onClick={triggerFileUpload}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Upload</span>
              </button>

              <button
                onClick={() => navigate("/history")}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <History className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">History</span>
              </button>

              <button
                onClick={() => navigate("/report")}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Report</span>
              </button>
            </div>
          </div>

          {/* Vineyard Health */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <Activity className="w-5 h-5 text-purple-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Your Vineyard Health</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {/* Healthy Percentage */}
              <div className="bg-green-500 rounded-2xl p-4 text-white text-center">
                <Leaf className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold mb-1">{stats?.healthyPercentage || 0}%</div>
                <div className="text-sm font-medium mb-1">Healthy</div>
                <div className="text-xs text-green-100">Very Good</div>
              </div>

              {/* Total Scans */}
              <div className="bg-blue-500 rounded-2xl p-4 text-white text-center">
                <RotateCcw className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold mb-1">{stats?.totalScans || 0}</div>
                <div className="text-sm font-medium mb-1">Total Scans</div>
                <div className="text-xs text-blue-100">All time</div>
              </div>

              {/* Disease Reports */}
              <div className="bg-red-500 rounded-2xl p-4 text-white text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold mb-1">{stats?.diseaseScans || 0}</div>
                <div className="text-sm font-medium mb-1">Disease</div>
                <div className="text-xs text-red-100">Reports</div>
              </div>
            </div>
          </div>

          {/* Detectable Diseases */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Detectable Diseases</h2>
            <p className="text-gray-600 text-sm mb-4">
              GrapeX can accurately identify grape leaves and detect the following conditions:
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {detectableDiseases.map((disease, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{disease.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{disease.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        disease.severity === 'High' ? 'bg-red-100 text-red-700' :
                        disease.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {disease.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-green-50 rounded-xl border border-purple-100">
              <h4 className="font-semibold text-gray-900 mb-2">Enhanced Accuracy</h4>
              <p className="text-sm text-gray-700">
                Our improved AI model first verifies grape leaf identification, then provides accurate disease classification with high confidence scores.
              </p>
            </div>
          </div>

          {/* Get Started Tip */}
          {(stats?.totalScans || 0) === 0 && (
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Ready to Start?</h3>
              <p className="text-green-100 text-sm leading-relaxed mb-4">
                Take your first scan to begin monitoring your vineyard's health. Position the camera over a grape leaf and tap the capture button.
              </p>
              <button
                onClick={() => navigate("/scanner")}
                className="bg-white text-green-600 py-2 px-4 rounded-lg font-semibold text-sm"
              >
                Start First Scan
              </button>
            </div>
          )}
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
