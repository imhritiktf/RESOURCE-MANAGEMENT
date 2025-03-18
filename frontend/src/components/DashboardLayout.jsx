import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar"; 
import Navbar from "./Navbar";

export default function DashboardLayout({ title }) {
  return (
    <div className="flex h-screen">
      <Sidebar /> 
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">{title}</h1>
          <Outlet /> {/* This will render the nested dashboard pages */}
        </div>
      </div>
    </div>
  );
}
