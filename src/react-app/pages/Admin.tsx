import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/utils/auth";
import { useNavigate } from "react-router";
import { Users, BarChart3, Calendar, AlertTriangle, User, Shield, MapIcon, Filter, MessageSquare } from "lucide-react";
import AdminHeader from "@/react-app/components/AdminHeader";
import DiseaseMap from "@/react-app/components/DiseaseMap";
import RiskMetrics from "@/react-app/components/RiskMetrics";
import { AdminStats, ScanType, UserStats, ReportType } from "@/shared/types";

interface UserStatsWithReports extends UserStats {
  total_reports: number;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allScans, setAllScans] = useState<ScanType[]>([]);
  const [users, setUsers] = useState<UserStatsWithReports[]>([]);
  const [reports, setReports] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "map" | "users" | "reports">("dashboard");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Admin check - either contains "admin" or is the default admin account
    if (!user.email.includes("admin") && user.email !== "admin@grapexdetection.com" && user.email !== "dpride07@gmail.com" && user.email !== "grapix2024@gmail.com") {
      navigate("/");
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [statsResponse, scansResponse, usersResponse, reportsResponse] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/scans"),
        fetch("/api/admin/users"),
        fetch("/api/admin/reports"),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (scansResponse.ok) {
        const scansData = await scansResponse.json();
        setAllScans(scansData);
      }

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData);

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          // Add report counts to each user
          const usersWithReports = usersData.map((userStat: UserStats) => ({
            ...userStat,
            total_reports: reportsData.filter((report: ReportType) => report.user_id === userStat.user_id).length
          }));
          setUsers(usersWithReports);
        }
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
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

  if (!user || (!user.email.includes("admin") && user.email !== "admin@grapexdetection.com" && user.email !== "dpride07@gmail.com" && user.email !== "grapix2024@gmail.com")) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader title="Admin Panel" />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Admin Panel" />

      <div className="px-4 -mt-4 relative z-10">
        <div className="max-w-md mx-auto space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl p-2 shadow-sm">
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`py-2 px-2 rounded-xl font-semibold text-xs transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 hover:text-purple-600"
                }`}
              >
                <BarChart3 className="w-4 h-4 mx-auto mb-1" />
                <div>Dashboard</div>
              </button>
              <button
                onClick={() => setActiveTab("map")}
                className={`py-2 px-2 rounded-xl font-semibold text-xs transition-colors ${
                  activeTab === "map"
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 hover:text-purple-600"
                }`}
              >
                <MapIcon className="w-4 h-4 mx-auto mb-1" />
                <div>Disease Map</div>
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`py-2 px-2 rounded-xl font-semibold text-xs transition-colors ${
                  activeTab === "users"
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 hover:text-purple-600"
                }`}
              >
                <Users className="w-4 h-4 mx-auto mb-1" />
                <div>Users</div>
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`py-2 px-2 rounded-xl font-semibold text-xs transition-colors ${
                  activeTab === "reports"
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 hover:text-purple-600"
                }`}
              >
                <MessageSquare className="w-4 h-4 mx-auto mb-1" />
                <div>Reports</div>
              </button>
            </div>
          </div>

          {activeTab === "dashboard" && stats && (
            <>
              {/* Risk Metrics */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Regional Risk Assessment</h2>
                <RiskMetrics scans={allScans} />
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Overview</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{stats.totalScans}</div>
                    <div className="text-sm text-gray-600">Total Scans</div>
                  </div>
                </div>
              </div>

              {/* Disease Distribution */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Disease Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(stats.diseaseDistribution)
                    .filter(([disease]) => ['Healthy', 'Black Rot', 'Black Measle'].includes(disease))
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .map(([disease, count]) => (
                    <div key={disease} className="flex items-center justify-between">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(disease)}`}>
                        {disease}
                      </div>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                  {Object.keys(stats.diseaseDistribution).filter(disease => ['Healthy', 'Black Rot', 'Black Measle'].includes(disease)).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p>No disease data available yet</p>
                    </div>
                  )}
                </div>
              </div>

              
            </>
          )}

          {activeTab === "map" && (
            <>
              {/* Map Controls */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Disease Distribution Map</h2>
                  <Filter className="w-5 h-5 text-gray-600" />
                </div>
                
                {/* Filters */}
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Severity</h3>
                    <div className="flex space-x-2">
                      {['all', 'high', 'medium', 'low'].map((severity) => (
                        <button
                          key={severity}
                          onClick={() => setSelectedSeverity(severity)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            selectedSeverity === severity
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {severity.charAt(0).toUpperCase() + severity.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Status</h3>
                    <div className="flex space-x-2">
                      {['all', 'active', 'pending', 'resolved'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setSelectedStatus(status)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            selectedStatus === status
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Risk Legend */}
                <div className="flex justify-center space-x-6 mb-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">High Risk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600">Medium</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Low</span>
                  </div>
                </div>
              </div>

              {/* Disease Map */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <DiseaseMap 
                  scans={allScans} 
                  selectedSeverity={selectedSeverity}
                  selectedStatus={selectedStatus}
                />
              </div>

              {/* Map Statistics */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Regional Summary</h3>
                <RiskMetrics scans={allScans} />
              </div>
            </>
          )}

          {activeTab === "reports" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-2">User Reports</h2>
                <p className="text-gray-600 text-sm mb-4">
                  View and manage user-submitted reports and issues
                </p>
                <div className="flex space-x-4 text-sm">
                  <div className="text-gray-500">
                    Total: {reports.length} reports
                  </div>
                  <div className="text-red-500">
                    Pending: {reports.filter(r => r.status === 'pending').length}
                  </div>
                  <div className="text-yellow-500">
                    Investigating: {reports.filter(r => r.status === 'investigating').length}
                  </div>
                </div>
              </div>

              {reports.map((report) => (
                <div key={report.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{report.title}</h3>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          report.severity === "critical" ? "bg-red-100 text-red-700" :
                          report.severity === "high" ? "bg-orange-100 text-orange-700" :
                          report.severity === "medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {report.severity}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span>Type: {report.type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>User: {report.user_id.substring(0, 8)}...</span>
                        <span>•</span>
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                      <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                        {report.description}
                      </p>
                      {report.scan_id && (
                        <div className="text-xs text-gray-500 mb-3">
                          Related to scan ID: {report.scan_id}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      report.status === "pending" ? "bg-gray-100 text-gray-700" :
                      report.status === "investigating" ? "bg-blue-100 text-blue-700" :
                      report.status === "resolved" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </div>
                    
                    <div className="flex space-x-2">
                      {report.status === "pending" && (
                        <button
                          onClick={async () => {
                            try {
                              await fetch(`/api/admin/reports/${report.id}/status`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "investigating" }),
                              });
                              fetchData(); // Refresh data
                            } catch (error) {
                              console.error("Failed to update report:", error);
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                        >
                          Investigate
                        </button>
                      )}
                      {(report.status === "pending" || report.status === "investigating") && (
                        <button
                          onClick={async () => {
                            try {
                              await fetch(`/api/admin/reports/${report.id}/status`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: "resolved" }),
                              });
                              fetchData(); // Refresh data
                            } catch (error) {
                              console.error("Failed to update report:", error);
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {reports.length === 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Yet</h3>
                  <p className="text-gray-600">
                    No users have submitted any reports yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-2">User Management</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Manage platform users and view their activity
                </p>
                <div className="text-sm text-gray-500">
                  Total active users: {users.length}
                </div>
              </div>

              {users.map((userStat) => (
                <div key={userStat.user_id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {userStat.user_id.substring(0, 12)}...
                        </h3>
                        <p className="text-sm text-gray-600">
                          User ID: {userStat.user_id}
                        </p>
                        {(userStat.user_id.includes("admin") || userStat.user_id === "admin@grapexdetection.com" || userStat.user_id === "dpride07@gmail.com" || userStat.user_id === "grapix2024@gmail.com") && (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 mt-1">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{userStat.total_scans}</div>
                      <div className="text-xs text-gray-500">Total Scans</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <div className="text-sm font-bold text-blue-600">{userStat.total_scans}</div>
                      <div className="text-xs text-gray-600">Scans</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <div className="text-sm font-bold text-red-600">{userStat.disease_scans}</div>
                      <div className="text-xs text-gray-600">Diseases</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <div className="text-sm font-bold text-green-600">
                        {userStat.total_scans - userStat.disease_scans}
                      </div>
                      <div className="text-xs text-gray-600">Healthy</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded-lg">
                      <div className="text-sm font-bold text-purple-600">{userStat.total_reports}</div>
                      <div className="text-xs text-gray-600">Reports</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>First Scan: {formatDate(userStat.first_scan)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>Last Activity: {formatDate(userStat.last_scan)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Detection Rate: {((userStat.disease_scans / userStat.total_scans) * 100).toFixed(1)}% • Reports: {userStat.total_reports}
                    </div>
                    {userStat.disease_scans > userStat.total_scans * 0.5 && (
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs">High disease rate</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Yet</h3>
                  <p className="text-gray-600">
                    No users have signed up and performed scans yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      </div>
  );
}
