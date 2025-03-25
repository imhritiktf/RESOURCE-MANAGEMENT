import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import FacultyPage from "./pages/faculty/FacultyPage";
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import TrusteeDashboard from "./pages/trustee/TrusteeDashboard";
import UserManagement from "./pages/trustee/UserManagement";
import RequestManagement from "./pages/trustee/RequestManagement";
import ResourceManagement from "./pages/trustee/ResourceManagement";
import LogsAnalytics from "./pages/trustee/LogsAnalytics";
import ResourceUsageAnalytics from "./pages/trustee/ResourceUsageAnalytics";
import SuspiciousActivityLogs from "./pages/trustee/SuspiciousActivityLogs";
import SLABreach from "./pages/trustee/SLABreachedRequests";
import FacultyDashboard from "./components/faculty/FacultyDashboard";
import NewRequestForm from "./components/faculty/NewRequestForm";
import RequestList from "./components/faculty/RequestList";
import RequestHistory from "./pages/trustee/RequestHistory";

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  console.log("ProtectedRoute - User:", user);
  console.log("ProtectedRoute - Required Role:", role);

  if (!user) {
    console.log("Redirecting to login: No user found");
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    console.log(`Redirecting to ${user.role}-dashboard: Role mismatch`);
    return <Navigate to={`/${user.role}-dashboard`} />;
  }

  return children;
}

export default function App() {
  const { user } = useAuth(); // Get user from context

  return (
    <Router>
      <Toaster position="bottom-left" />
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Faculty Dashboard */}
        <Route
          path="/faculty-dashboard/*"
          element={
            <ProtectedRoute role="faculty">
              <FacultyPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<FacultyDashboard />} />
          <Route path="new-request" element={<NewRequestForm />} />
          <Route path="requests" element={<RequestList />} />
          <Route
            path="booking-history"
            element={<RequestHistory userRole={user?.role} userId={user?.id} />}
          />
        </Route>

        {/* Supervisor Dashboard */}
        <Route
          path="/supervisor-dashboard"
          element={
            <ProtectedRoute role="supervisor">
              {/* Assuming SupervisorDashboard wraps RequestHistory */}
              <SupervisorDashboard>
                <RequestHistory userRole={user?.role} userId={user?.id} />
              </SupervisorDashboard>
            </ProtectedRoute>
          }
        />

        {/* Trustee Dashboard */}
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
          <Route path="logs" element={<LogsAnalytics />}>
            <Route index element={<Navigate to="resource-usage" />} />
            <Route path="resource-usage" element={<ResourceUsageAnalytics />} />
            <Route path="suspicious-activities" element={<SuspiciousActivityLogs />} />
            <Route
              path="request-history"
              element={<RequestHistory userRole={user?.role} userId={user?._id} />}
            />
            <Route path="sla-breached" element={<SLABreach />} />
          </Route>
        </Route>

        {/* Redirect Unknown Routes */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}