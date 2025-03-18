import { useAuth } from "../context/AuthContext";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      {/* Left Side: Logo */}
      <h1 className="text-xl font-bold text-primary">Resource Management</h1>

      {/* Right Side: User Info & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FaUserCircle className="text-2xl text-gray-600" />
          <span className="font-medium text-gray-700">{user?.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-orange-600 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
