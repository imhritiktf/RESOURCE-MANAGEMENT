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
    <div className="w-64 bg-primary text-white h-screen p-5 shadow-lg flex flex-col">
      <h1 className="text-xl font-bold mb-6 capitalize text-center">
        {user?.role} Panel
      </h1>
      <ul className="space-y-3">
        {links.map(({ path, label, icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-md transition-all ${
                  isActive
                    ? "bg-white text-primary font-semibold"
                    : "hover:bg-white hover:text-primary text-white"
                }`
              }
            >
              {icon} <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
