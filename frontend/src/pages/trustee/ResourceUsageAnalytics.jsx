import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const token = localStorage.getItem("token");

// Fetch resource usage data
const fetchResourceUsage = async ({ organization, startDate, endDate }) => {
  const response = await axios.get("http://localhost:5000/api/resources/resource-usage", {
    headers: { Authorization: `Bearer ${token}` },
    params: { organization, startDate, endDate },
  });
  return response.data;
};

// Fetch booking trends data
const fetchBookingTrends = async ({ organization, startDate, endDate, interval }) => {
  const response = await axios.get("http://localhost:5000/api/resources/booking-trends", {
    headers: { Authorization: `Bearer ${token}` },
    params: { organization, startDate, endDate, interval },
  });
  return response.data;
};

// Fetch resource utilization data
const fetchResourceUtilization = async ({ organization, startDate, endDate }) => {
  const response = await axios.get("http://localhost:5000/api/resources/resource-utilization", {
    headers: { Authorization: `Bearer ${token}` },
    params: { organization, startDate, endDate },
  });
  return response.data;
};

  // Fetch faculty usage data
  const fetchFacultyUsage = async ({ organization, startDate, endDate }) => {
    const response = await axios.get("http://localhost:5000/api/resources/faculty-usage", {
      headers: { Authorization: `Bearer ${token}` },
      params: { organization, startDate, endDate },
    });
    return response.data;
  };

const ResourceUsageAnalytics = () => {
  const [filters, setFilters] = useState({ organization: "CSC", startDate: "", endDate: "", interval: "daily" });

  // Fetch data using TanStack Query
  const {
    data: resourceUsageData,
    isLoading: isResourceUsageLoading,
    isError: isResourceUsageError,
  } = useQuery({
    queryKey: ["resourceUsage", filters],
    queryFn: () => fetchResourceUsage(filters),
  });

  const {
    data: bookingTrendsData,
    isLoading: isBookingTrendsLoading,
    isError: isBookingTrendsError,
  } = useQuery({
    queryKey: ["bookingTrends", filters],
    queryFn: () => fetchBookingTrends(filters),
  });

  const {
    data: resourceUtilizationData,
    isLoading: isResourceUtilizationLoading,
    isError: isResourceUtilizationError,
  } = useQuery({
    queryKey: ["resourceUtilization", filters],
    queryFn: () => fetchResourceUtilization(filters),
  });

  const {
    data: facultyUsageData,
    isLoading: isFacultyUsageLoading,
    isError: isFacultyUsageError,
  } = useQuery({
    queryKey: ["facultyUsage", filters],
    queryFn: () => fetchFacultyUsage(filters),
  });

  if (isResourceUsageLoading || isBookingTrendsLoading || isResourceUtilizationLoading || isFacultyUsageLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (isResourceUsageError || isBookingTrendsError || isResourceUtilizationError || isFacultyUsageError) {
    return <div className="text-center py-8 text-red-500">Error fetching data</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Filters */}
      <div className="flex gap-4 mb-6">
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
        <select
          value={filters.interval}
          onChange={(e) => setFilters({ ...filters, interval: e.target.value })}
          className="p-2 border border-gray-300 rounded-md"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* Most Used Resources */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Most Used Resources</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={resourceUsageData?.mostUsedResources || []}>
            <XAxis dataKey="resourceName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalBookings" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Booking Trends */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Booking Trends</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={bookingTrendsData || []}>
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="totalBookings" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Resource Utilization */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Resource Utilization</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={resourceUtilizationData || []}>
            <XAxis dataKey="resourceName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="utilizationRate" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Faculty Usage */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Faculty Usage</h2>
        <table className="w-full bg-white rounded-lg shadow-md">
          <thead>
            <tr className="text-left">
              <th className="p-2">Faculty Name</th>
              <th className="p-2">Total Bookings</th>
              <th className="p-2">Total Duration (Days)</th>
            </tr>
          </thead>
          <tbody>
            {facultyUsageData?.map((faculty) => (
              <tr key={faculty._id}>
                <td className="p-2">{faculty.facultyName}</td>
                <td className="p-2">{faculty.totalBookings}</td>
                <td className="p-2">{faculty.totalDuration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResourceUsageAnalytics;