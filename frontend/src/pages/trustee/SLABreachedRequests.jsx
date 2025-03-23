import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const token = localStorage.getItem("token");

// Fetch SLA breach data
const fetchSLABreach = async ({ organization, startDate, endDate }) => {
  const response = await axios.get("http://localhost:5000/api/requests/sla-breached", {
    headers: { Authorization: `Bearer ${token}` },
    params: { organization, startDate, endDate },
  });
  return response.data;
};

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {/* Skeleton for Filters */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-gray-200 h-10 rounded-md"></div>
      <div className="bg-gray-200 h-10 rounded-md"></div>
      <div className="bg-gray-200 h-10 rounded-md"></div>
    </div>

    {/* Skeleton for Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-gray-200 h-24 rounded-lg"></div>
      <div className="bg-gray-200 h-24 rounded-lg"></div>
      <div className="bg-gray-200 h-24 rounded-lg"></div>
    </div>

    {/* Skeleton for SLA Breach Logs */}
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="bg-gray-200 h-8 w-1/3 mb-4 rounded-md"></div>
      <div className="space-y-2">
        <div className="bg-gray-200 h-6 w-full rounded-md"></div>
        <div className="bg-gray-200 h-6 w-full rounded-md"></div>
        <div className="bg-gray-200 h-6 w-full rounded-md"></div>
        <div className="bg-gray-200 h-6 w-full rounded-md"></div>
      </div>
    </div>

    {/* Skeleton for SLA Breach Trends */}
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="bg-gray-200 h-8 w-1/3 mb-4 rounded-md"></div>
      <div className="bg-gray-200 h-64 rounded-md"></div>
    </div>
  </div>
);

const SLABreach = () => {
  const [filters, setFilters] = useState({ organization: "CSC", startDate: "", endDate: "" });

  // Fetch SLA breach data
  const {
    data: slaBreachData,
    isLoading: isBreachLoading,
    isError: isBreachError,
    refetch,
  } = useQuery({
    queryKey: ["slaBreach", filters],
    queryFn: () => fetchSLABreach(filters),
  });

  if (isBreachLoading) return <LoadingSkeleton />;
  if (isBreachError) return <div className="text-center py-8 text-red-500">Error fetching data</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">SLA Breach Analytics</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          value={filters.organization}
          onChange={(e) => setFilters({ ...filters, organization: e.target.value })}
          className="p-2 border border-gray-300 rounded-md"
        >
          <option value="CSC">CSC</option>
          <option value="GHP">GHP</option>
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="p-2 border border-gray-300 rounded-md"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="p-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow-md text-white">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>📊</span> Total Breaches
          </h3>
          <p className="text-2xl font-bold mt-2">{(slaBreachData?.pendingBreaches?.length || 0) + (slaBreachData?.resolvedBreaches?.length || 0)}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow-md text-white">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>✅</span> Resolved Breaches
          </h3>
          <p className="text-2xl font-bold mt-2">{slaBreachData?.resolvedBreaches?.length || 0}</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg shadow-md text-white">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>⚠️</span> Pending Breaches
          </h3>
          <p className="text-2xl font-bold mt-2">{slaBreachData?.pendingBreaches?.length || 0}</p>
        </div>
      </div>

      {/* Pending Breaches Table */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Pending SLA Breaches</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-lg">
            <thead className="text-white sticky top-0">
              <tr className="bg-yellow-600">
                <th className="p-2">Request ID</th>
                <th className="p-2">Faculty</th>
                <th className="p-2">Resource</th>
                <th className="p-2">SLA Time (mins)</th>
                <th className="p-2">Breached At</th>
                <th className="p-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {slaBreachData?.pendingBreaches?.map((log, index) => (
                <tr key={log.requestId} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}>
                  <td className="p-2">{log.requestId}</td>
                  <td className="p-2">{log.facultyName}</td>
                  <td className="p-2">{log.resourceName}</td>
                  <td className="p-2">{log.slaTime}</td>
                  <td className="p-2">{new Date(log.breachedAt).toLocaleString()}</td>
                  <td className="p-2">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolved Breaches Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Resolved SLA Breaches</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-lg">
            <thead className="text-white sticky top-0">
              <tr className="bg-green-600">
                <th className="p-2">Request ID</th>
                <th className="p-2">Faculty</th>
                <th className="p-2">Resource</th>
                <th className="p-2">SLA Time (mins)</th>
                <th className="p-2">Breached At</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Resolved At</th>
              </tr>
            </thead>
            <tbody>
              {slaBreachData?.resolvedBreaches?.map((log, index) => (
                <tr key={log.requestId} className={`bg-green-50 hover:bg-green-100`}>
                  <td className="p-2">{log.requestId}</td>
                  <td className="p-2">{log.facultyName}</td>
                  <td className="p-2">{log.resourceName}</td>
                  <td className="p-2">{log.slaTime}</td>
                  <td className="p-2">{new Date(log.breachedAt).toLocaleString()}</td>
                  <td className="p-2">{log.reason}</td>
                  <td className="p-2">{new Date(log.resolvedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLA Breach Trends */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">SLA Breach Trends</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={slaBreachData?.trends || []}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#ef4444" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SLABreach;