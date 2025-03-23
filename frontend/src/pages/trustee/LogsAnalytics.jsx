import { Outlet } from "react-router-dom";

export default function LogsAnalytics() {
  return (
    <div>
      <Outlet /> 
      {/* Render nested routes here */}
    </div>
  );
}