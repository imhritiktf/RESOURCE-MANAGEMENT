import { Outlet, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext"; // Import useAuth instead of AuthContext

export default function FacultyPage() {
  const { user } = useAuth(); // Use useAuth to get user
  const navigate = useNavigate();

  // Store the previous user ID in local state to detect changes
  const [prevUserId, setPrevUserId] = useState(null);

  useEffect(() => {
    // Check if user exists and has an ID
    if (!user) {
      // If no user (e.g., logged out), redirect to login
      navigate("/login");
      return;
    }

    const currentUserId = user.id || user._id; // Adjust based on your user object structure

    // If user ID changed (new login), refresh the page or reset state
    if (prevUserId && prevUserId !== currentUserId) {
      console.log("User changed, refreshing page...");
      window.location.reload(); // Hard refresh to clear stale data
    }

    // Update prevUserId for the next check
    setPrevUserId(currentUserId);
  }, [user, prevUserId, navigate]);

  return (
    <DashboardLayout>
      <Outlet /> {/* This will render the nested faculty components */}
    </DashboardLayout>
  );
}