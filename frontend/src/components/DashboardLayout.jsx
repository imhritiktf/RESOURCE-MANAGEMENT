import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar"; 
import Navbar from "./Navbar";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar /> 
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-6 h-[100vh] overflow-auto">
          <Outlet /> {/* This will render the nested dashboard pages */}
        </div>
      </div>
    </div>
  );
}
