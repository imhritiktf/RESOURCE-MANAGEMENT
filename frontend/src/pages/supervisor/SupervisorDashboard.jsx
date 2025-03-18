import DashboardLayout from "../../components/DashboardLayout";

export default function SupervisorDashboard() {
  return (
    <DashboardLayout role="supervisor">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Supervisor Dashboard</h1>
        {/* Add Supervisor-specific components here */}
      </div>
    </DashboardLayout>
  );
}
