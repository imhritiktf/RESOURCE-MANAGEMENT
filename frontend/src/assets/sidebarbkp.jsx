import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUsers, FaClipboardList, FaCogs, FaChartBar, FaChevronDown, FaChevronUp } from "react-icons/fa"; // Importing icons
import { useState } from "react"; // For handling dropdown state

export default function Sidebar() {
  const { user } = useAuth();
  const [isLogsOpen, setIsLogsOpen] = useState(false); // State to toggle logs dropdown

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
      {
        path: "#", // Use "#" for dropdown parent
        label: "Logs & Analytics",
        icon: <FaChartBar />,
        subLinks: [
          { path: "/trustee-dashboard/logs/resource-usage", label: "Resource Usage Analytics" },
          { path: "/trustee-dashboard/logs/suspicious-activities", label: "Suspicious Activity Logs" },
          { path: "/trustee-dashboard/logs/request-history", label: "Request History" },
          { path: "/trustee-dashboard/logs/sla-breached", label: "SLA Breached Requests" },
        ],
      },
    ],
  };

  const links = navLinks[user?.role] || [];

  return (
    <div className="w-64 bg-primary text-white h-screen p-5 shadow-lg flex flex-col">
      <h1 className="text-xl font-bold mb-6 capitalize text-center">
        {user?.role} Panel
      </h1>
      <ul className="space-y-3">
        {links.map(({ path, label, icon, subLinks }) => (
          <li key={path}>
            {subLinks ? (
              // Dropdown for Logs & Analytics
              <div>
                <button
                  onClick={() => setIsLogsOpen(!isLogsOpen)}
                  className="flex items-center gap-3 px-4 py-2 rounded-md transition-all w-full hover:bg-white hover:text-primary text-white"
                >
                  {icon} <span>{label}</span>
                  {isLogsOpen ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {isLogsOpen && (
                  <ul className="pl-8 mt-2 space-y-2">
                    {subLinks.map((subLink) => (
                      <li key={subLink.path}>
                        <NavLink
                          to={subLink.path}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2 rounded-md transition-all ${
                              isActive
                                ? "bg-white text-primary font-semibold"
                                : "hover:bg-white hover:text-primary text-white"
                            }`
                          }
                        >
                          <span>{subLink.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              // Regular link
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
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}