import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast"; // Import Toaster for toast notifications
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import TrusteeDashboard from "./pages/trustee/TrusteeDashboard";
import UserManagement from "./pages/trustee/UserManagement";
import RequestManagement from "./pages/trustee/RequestManagement";
import ResourceManagement from "./pages/trustee/ResourceManagement";
import LogsAnalytics from "./pages/trustee/LogsAnalytics";
import ResourceUsageAnalytics from "./pages/trustee/ResourceUsageAnalytics";
import SuspiciousActivityLogs from "./pages/trustee/SuspiciousActivityLogs";
import RequestHistory from "./pages/trustee/RequestHistory";
import SLABreach from "./pages/trustee/SLABreachedRequests";

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    return <Navigate to={`/${user.role}-dashboard`} />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Toaster position="bottom-left" /> {/* Add Toaster component for displaying toast notifications */}
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Faculty Dashboard */}
        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute role="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        {/* Supervisor Dashboard */}
        <Route
          path="/supervisor-dashboard"
          element={
            <ProtectedRoute role="supervisor">
              <SupervisorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Trustee Dashboard with Sidebar & Navbar */}
        <Route
  path="/trustee-dashboard/*"
  element={
    <ProtectedRoute role="trustee">
      <TrusteeDashboard />
    </ProtectedRoute>
  }
>
  <Route index element={<Navigate to="users" />} />
  <Route path="users" element={<UserManagement />} />
  <Route path="requests" element={<RequestManagement />} />
  <Route path="resources" element={<ResourceManagement />} />

  {/* Logs & Analytics Nested Routes */}
  <Route path="logs" element={<LogsAnalytics />}>
    <Route index element={<Navigate to="resource-usage" />} />
    <Route path="resource-usage" element={<ResourceUsageAnalytics />} />
    <Route path="suspicious-activities" element={<SuspiciousActivityLogs />} />
    <Route path="request-history" element={<RequestHistory />} />
    <Route path="sla-breached" element={<SLABreach />} />
  </Route>
</Route>

        {/* Redirect Unknown Routes */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}