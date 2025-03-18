import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function TrusteeDashboard() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-6 h-[100vh] overflow-auto">
          <Outlet /> {/* This ensures child components (like UserManagement) render properly */}
        </div>
      </div>
    </div>
  );
}
