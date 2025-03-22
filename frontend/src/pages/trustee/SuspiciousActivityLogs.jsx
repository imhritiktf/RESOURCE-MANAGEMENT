import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Chart from "chart.js/auto";
import { FaExclamationTriangle, FaClock } from "react-icons/fa";

const token = localStorage.getItem("token");

  // Fetch suspicious activity logs
const fetchSuspiciousActivityLogs = async () => {
  const response = await axios.get("http://localhost:5000/api/requests/suspicious-activities", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const SuspiciousActivityLogs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const chartRef = useRef(null); // Ref for the chart canvas

  // Fetch suspicious activity logs
  const {
    data: suspiciousLogs,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["suspiciousLogs"],
    queryFn: fetchSuspiciousActivityLogs,
  });

  // Filter logs based on search query and type
  const filteredLogs = suspiciousLogs?.filter((log) => {
    const matchesSearchQuery =
      log.resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.approvedBy.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTypeFilter = filterType === "all" || log.suspiciousActivity.some((activity) => activity.type === filterType);

    return matchesSearchQuery && matchesTypeFilter;
  });

  // Render Chart.js bar chart
  useEffect(() => {
    if (!filteredLogs || chartRef.current === null) return;

    // Prepare data for the chart
    const types = ["tooFast", "tooLate", "anomaly"];
    const counts = types.map((type) =>
      filteredLogs.filter((log) => log.suspiciousActivity.some((activity) => activity.type === type)).length
    );

    // Create the chart
    const ctx = chartRef.current.getContext("2d");
    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: types,
        datasets: [
          {
            label: "Suspicious Activity Count",
            data: counts,
            backgroundColor: ["#FFA500", "#FF4500", "#1E90FF"], // Custom colors
            borderColor: ["#FFA500", "#FF4500", "#1E90FF"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Count",
            },
          },
          x: {
            title: {
              display: true,
              text: "Activity Type",
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: "Suspicious Activity Distribution",
          },
        },
      },
    });

    // Cleanup function to destroy the chart when the component unmounts
    return () => chart.destroy();
  }, [filteredLogs]);

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (isError) return <div className="text-center py-8 text-red-500">Error fetching suspicious activity logs</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Suspicious Activity Logs</h1>

      {/* Filters and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by resource or approved by"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Types</option>
          <option value="tooFast">Too Fast</option>
          <option value="tooLate">Too Late</option>
          <option value="anomaly">Anomaly</option>
        </select>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Suspicious Activity Distribution</h2>
        <canvas ref={chartRef}></canvas>
      </div>

      {/* Logs Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gradient-to-r from-[#ef7f1a] to-[#ffa64d] text-white sticky top-0">
            <tr>
              <th className="p-4 font-semibold">Resource</th>
              <th className="p-4 font-semibold">Approved By</th>
              <th className="p-4 font-semibold">Suspicious Activity</th>
              <th className="p-4 font-semibold">Detected At</th>
              <th className="p-4 font-semibold">ML Score</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs?.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-6 text-gray-500">
                  No suspicious activity logs found
                </td>
              </tr>
            ) : (
              filteredLogs?.map((log) => (
                <tr
                  key={log._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 text-gray-700">{log.resource.name}</td>
                  <td className="p-4 text-gray-700">{log.approvedBy.name}</td>
                  <td className="p-4">
                    {log.suspiciousActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        {activity.type === "tooFast" ? (
                          <FaClock className="text-yellow-500" />
                        ) : activity.type === "tooLate" ? (
                          <FaExclamationTriangle className="text-red-500" />
                        ) : activity.type === "anomaly" ? (
                          <FaExclamationTriangle className="text-blue-500" />
                        ) : null}
                        <span className="text-sm">
                          {activity.details} ({activity.type} - {activity.actionType})
                        </span>
                      </div>
                    ))}
                  </td>
                  <td className="p-4 text-gray-700">
                    {new Date(log.suspiciousActivity[0].detectedAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-gray-700">
                    {log.suspiciousActivity[0].mlScore?.toFixed(2) || "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuspiciousActivityLogs;