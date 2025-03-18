import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUsers, FaClipboardList, FaCogs, FaChartBar } from "react-icons/fa"; // Importing icons

export default function Sidebar() {
  const { user } = useAuth();

  const navLinks = {
    faculty: [
      { path: "/faculty-dashboard/requests", label: "My Requests", icon: <FaClipboardList /> },
      { path: "/faculty-dashboard/history", label: "Request History", icon: <FaChartBar /> },
    ],
    supervisor: [
      { path: "/supervisor-dashboard/pending", label: "Pending Approvals", icon: <FaClipboardList /> },
      { path: "/supervisor-dashboard/history", label: "Approval History", icon: <FaChartBar /> },
    ],
    trustee: [
      { path: "/trustee-dashboard/users", label: "User Management", icon: <FaUsers /> },
      { path: "/trustee-dashboard/requests", label: "Request Management", icon: <FaClipboardList /> },
      { path: "/trustee-dashboard/resources", label: "Resource Management", icon: <FaCogs /> },
      { path: "/trustee-dashboard/logs", label: "Logs & Analytics", icon: <FaChartBar /> },
    ],
  };

  const links = navLinks[user?.role] || [];

  return (
    <div className="w-64 bg-primary text-white h-screen p-5 shadow-xl flex flex-col">
      {/* User Panel Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold capitalize  ">
          {user?.role} Panel
        </h1>
        <p className="text-sm text-gray-200 mt-1">Welcome, {user?.name}</p>
      </div>

      {/* Navigation Links */}
      <ul className="space-y-2 flex-1">
        {links.map(({ path, label, icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-white text-primary font-semibold shadow-md"
                    : "hover:bg-white hover:text-primary text-gray-200"
                }`
              }
            >
              <span className="text-lg">{icon}</span>
              <span className="text-sm">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Footer (Optional) */}
      <div className="text-center text-sm text-gray-300 mt-6">
        <p>© 2025 Chandrabhan Sharma</p>
      </div>
    </div>
  );
}