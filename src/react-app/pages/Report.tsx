import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/utils/auth";
import { useNavigate } from "react-router";
import { AlertTriangle, MapPin, Send, CheckCircle } from "lucide-react";
import Header from "@/react-app/components/Header";
import { ScanType } from "@/shared/types";

export default function Report() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: "general",
    title: "",
    description: "",
    scan_id: "",
    severity: "medium",
  });
  const [location, setLocation] = useState<{ lat: number; lng: number; city?: string } | null>(null);
  const [recentScans, setRecentScans] = useState<ScanType[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanType | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          let city = 'Unknown location';
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
            );
            if (response.ok) {
              const data = await response.json();
              city = data.city || data.locality || data.principalSubdivision || 'Unknown location';
            }
          } catch (error) {
            console.log('Failed to get city name:', error);
          }
          
          setLocation({ lat, lng, city });
        },
        (error) => {
          console.log("Location access denied:", error);
        }
      );
    }

    // Fetch recent scans for reference
    fetchRecentScans();
  }, [user, navigate]);

  const fetchRecentScans = async () => {
    try {
      const response = await fetch("/api/scans");
      if (response.ok) {
        const scans = await response.json();
        setRecentScans(scans.slice(0, 5)); // Get recent 5 scans
      }
    } catch (error) {
      console.error("Failed to fetch scans:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      return;
    }

    setLoading(true);

    try {
      const reportData = {
        type: formData.type,
        title: formData.title,
        description: formData.description,
        scan_id: formData.scan_id ? parseInt(formData.scan_id) : undefined,
        location_lat: location?.lat,
        location_lng: location?.lng,
        severity: formData.severity,
      };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        alert("Failed to submit report. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "bg-green-100 text-green-700 border-green-300";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "high": return "bg-orange-100 text-orange-700 border-orange-300";
      case "critical": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  if (!user) return null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Report Submitted" />
        <div className="px-4 -mt-4 relative z-10">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h2>
              <p className="text-gray-600 mb-4">
                Thank you for your report. Our team will review it and take appropriate action.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to home...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Submit Report" />

      <div className="px-4 -mt-4 relative z-10">
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Report an Issue</h2>
                <p className="text-sm text-gray-600">Help us improve GrapeX</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Report Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="general">General Issue</option>
                  <option value="disease_outbreak">Disease Outbreak</option>
                  <option value="false_detection">False Detection</option>
                  <option value="app_issue">App Technical Issue</option>
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Severity Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["low", "medium", "high", "critical"].map((severity) => (
                    <button
                      key={severity}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, severity }))}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        formData.severity === severity
                          ? getSeverityColor(severity)
                          : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide detailed information about the issue..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              {/* Related Scan (optional) */}
              {recentScans.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Related Scan (Optional)
                  </label>
                  <select
                    value={formData.scan_id}
                    onChange={(e) => {
                      const scanId = e.target.value;
                      const scan = recentScans.find(s => s.id.toString() === scanId);
                      setFormData(prev => ({ ...prev, scan_id: scanId }));
                      setSelectedScan(scan || null);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a recent scan (optional)</option>
                    {recentScans.map((scan) => (
                      <option key={scan.id} value={scan.id}>
                        {scan.disease_detected || "Unknown"} - {new Date(scan.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  
                  {/* Display selected scan image */}
                  {selectedScan && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center space-x-4">
                        <img
                          src={selectedScan.image_url}
                          alt="Selected scan"
                          className="w-20 h-20 rounded-lg object-cover border border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              selectedScan.disease_detected === 'Healthy' 
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : selectedScan.disease_detected === 'Black Rot'
                                ? 'bg-red-100 text-red-700 border-red-300'
                                : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                            }`}>
                              {selectedScan.disease_detected || "Unknown"}
                            </span>
                            {selectedScan.confidence_score && (
                              <span className="text-xs text-gray-600">
                                {(selectedScan.confidence_score * 100).toFixed(1)}% confident
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Scanned: {new Date(selectedScan.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {selectedScan.location_lat && selectedScan.location_lng && (
                            <p className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>Location: {selectedScan.location_lat.toFixed(6)}, {selectedScan.location_lng.toFixed(6)}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedScan.recommendations && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                          <h5 className="text-xs font-semibold text-gray-900 mb-1">Previous Recommendations:</h5>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {selectedScan.recommendations.length > 200 
                              ? `${selectedScan.recommendations.substring(0, 200)}...` 
                              : selectedScan.recommendations}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Location */}
              {location && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 p-3 bg-gray-50 rounded-xl">
                  <MapPin className="w-4 h-4" />
                  <span>Location: {location.city}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.description.trim()}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Guidelines */}
          <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
            <h3 className="font-bold text-gray-900 mb-2">Reporting Guidelines</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Be specific and detailed in your description</li>
              <li>• Include steps to reproduce if it's a technical issue</li>
              <li>• For disease outbreaks, mention the affected area size</li>
              <li>• Screenshots or additional photos can be helpful</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
