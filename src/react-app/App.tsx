import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/react-app/utils/auth";
import HomePage from "@/react-app/pages/Home";
import LoginPage from "@/react-app/pages/Login";
import ScannerPage from "@/react-app/pages/Scanner";
import HistoryPage from "@/react-app/pages/History";
import AdminPage from "@/react-app/pages/Admin";
import ReportPage from "@/react-app/pages/Report";
import ProfilePage from "@/react-app/pages/Profile";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
