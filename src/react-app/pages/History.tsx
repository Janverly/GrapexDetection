import { useState, useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import { Calendar, MapPin, TrendingUp, AlertTriangle } from "lucide-react";

const LocationDisplay = ({ lat, lng }: { lat: number; lng: number }) => {
  const [city, setCity] = useState<string>('Unknown location');

  useEffect(() => {
    const getCity = async () => {
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        if (response.ok) {
          const data = await response.json();
          setCity(data.city || data.locality || data.principalSubdivision || 'Unknown location');
        }
      } catch (error) {
        console.log('Failed to get city name:', error);
      }
    };
    
    getCity();
  }, [lat, lng]);

  return (
    <div className="flex items-center space-x-2">
      <MapPin className="w-4 h-4" />
      <span>{city}</span>
    </div>
  );
};
import Header from "@/react-app/components/Header";
import { ScanType } from "@/shared/types";

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchScans();
  }, [user, navigate]);

  const fetchScans = async () => {
    try {
      const response = await fetch("/api/scans");
      if (response.ok) {
        const data = await response.json();
        setScans(data);
      }
    } catch (error) {
      console.error("Failed to fetch scans:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSeverityColor = (disease: string | null) => {
    if (!disease || disease === "Healthy") return "text-green-600 bg-green-50 border-green-200";
    if (disease === "Black Rot") return "text-red-600 bg-red-50 border-red-200";
    if (disease === "Black Measle") return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getStats = () => {
    const totalScans = scans.length;
    const healthyScans = scans.filter(scan => scan.disease_detected === "Healthy").length;
    const diseaseScans = totalScans - healthyScans;
    const recentScans = scans.filter(scan => {
      const scanDate = new Date(scan.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return scanDate > weekAgo;
    }).length;

    return { totalScans, healthyScans, diseaseScans, recentScans };
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Scan History" />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
        
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Scan History" />

      <div className="px-4 -mt-4 relative z-10">
        <div className="max-w-md mx-auto space-y-6">
          {/* Statistics */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">{stats.totalScans}</div>
                <div className="text-sm text-gray-600">Total Scans</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{stats.healthyScans}</div>
                <div className="text-sm text-gray-600">Healthy</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl">
                <div className="text-2xl font-bold text-red-600">{stats.diseaseScans}</div>
                <div className="text-sm text-gray-600">Diseases Found</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-purple-600">{stats.recentScans}</div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
            </div>
          </div>

          {/* Scan List */}
          <div className="space-y-4">
            {scans.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scans Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start scanning grape leaves to track your vineyard's health over time.
                </p>
                <button
                  onClick={() => navigate("/scanner")}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl font-semibold"
                >
                  Start Scanning
                </button>
              </div>
            ) : (
              scans.map((scan) => (
                <div key={scan.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={scan.image_url}
                        alt="Scanned leaf"
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                      />
                      <div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(scan.disease_detected)}`}>
                          {scan.disease_detected || "Unknown"}
                        </div>
                        {scan.confidence_score && (
                          <div className="text-sm text-gray-600 mt-1">
                            {(scan.confidence_score * 100).toFixed(1)}% confident
                          </div>
                        )}
                      </div>
                    </div>
                    {scan.disease_detected && scan.disease_detected !== "Healthy" && (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(scan.created_at)}</span>
                    </div>
                    {scan.location_lat && scan.location_lng && (
                      <LocationDisplay lat={scan.location_lat} lng={scan.location_lng} />
                    )}
                  </div>

                  {scan.recommendations && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {scan.recommendations.length > 150 
                          ? `${scan.recommendations.substring(0, 150)}...` 
                          : scan.recommendations}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {scans.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-white rounded-2xl p-6 border border-green-100">
              <h3 className="font-bold text-gray-900 mb-2">Keep Monitoring</h3>
              <p className="text-sm text-gray-700 mb-4">
                Regular scanning helps catch diseases early and maintain vineyard health.
              </p>
              <button
                onClick={() => navigate("/scanner")}
                className="bg-green-600 text-white py-2 px-4 rounded-lg font-semibold text-sm"
              >
                Scan Another Leaf
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
