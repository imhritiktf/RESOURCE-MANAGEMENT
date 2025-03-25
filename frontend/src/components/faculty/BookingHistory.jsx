import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const token = localStorage.getItem("token");

const fetchRequestLogs = async ({ role, userId }) => {
  const endpoint =
    role === "faculty"
      ? "http://localhost:5000/api/logs/faculty"
      : role === "supervisor"
      ? "http://localhost:5000/api/logs/supervisor"
      : "http://localhost:5000/api/logs/trustee";

  const response = await axios.get(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
    },
    params: { userId }, // Pass userId for faculty and supervisor
  });
  return response.data;
};

const RequestHistory = ({ userRole, userId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);

  const {
    data: requestLogs,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["requestLogs", userRole, userId],
    queryFn: () => fetchRequestLogs({ role: userRole, userId }),
    cacheTime: 0, // Disable caching
    staleTime: 0, // Data is immediately stale
  });

  // Force refetch when role or userId changes
  useEffect(() => {
    refetch();
  }, [userRole, userId, refetch]);

  const filteredLogs = requestLogs?.filter((log) => {
    const matchesSearchQuery =
      log.request.eventDetails.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionBy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.request.faculty.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatusFilter = filterStatus === "all" || log.action === filterStatus;

    return matchesSearchQuery && matchesStatusFilter;
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <svg className="animate-spin h-5 w-5 mx-auto text-gray-500" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8v8h-8z" />
        </svg>
        Loading logs...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-500">
        Error fetching request logs
        <button onClick={() => refetch()} className="ml-2 text-blue-500 underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-blue-950">Request Logs</h1>
      <div className="mb-6 flex justify-end">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Color Identification</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 rounded-full"></span>
              <span className="text-sm text-gray-700">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-100 rounded-full"></span>
              <span className="text-sm text-gray-700">Rejected</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by event details, action by, action, or requested by"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Actions</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gradient-to-r from-[#ef7f1a] to-[#ffa64d] text-white sticky top-0">
            <tr>
              <th className="p-4 font-semibold">Requested By</th>
              <th className="p-4 font-semibold">Requested Date</th>
              <th className="p-4 font-semibold text-center">Action</th>
              <th className="p-4 font-semibold">Action By</th>
              <th className="p-4 font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs?.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-6 text-gray-500">
                  No logs found
                </td>
              </tr>
            ) : (
              filteredLogs?.map((log) => (
                <tr
                  key={log._id}
                  className={`transition-all duration-200 ${
                    log.action === "pending"
                      ? "bg-yellow-50 hover:bg-yellow-100"
                      : log.action === "approved"
                      ? "bg-green-50 hover:bg-green-100"
                      : log.action === "rejected"
                      ? "bg-red-50 hover:bg-red-100"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedLog(log)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="p-4 text-gray-700">{log.request.faculty.name}</td>
                  <td className="p-4 text-gray-700">
                    {new Date(log.request.requestedDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        log.action === "approved"
                          ? "bg-green-100 text-green-600"
                          : log.action === "rejected"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-gray-700">{log.actionBy.name}</td>
                  <td className="p-4 text-gray-700">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl w-[500px] max-w-full transform transition-all scale-100 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-2xl font-bold text-gray-800">Request Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700 transition text-xl"
              >
                ✖
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-gray-700 mt-4">
              <p><strong>Faculty:</strong> {selectedLog.request.faculty.name}</p>
              <p><strong>Email:</strong> {selectedLog.request.faculty.email}</p>
              <p><strong>Department:</strong> {selectedLog.request.faculty.department}</p>
              <p>
                <strong>Requested Date:</strong>{" "}
                {new Date(selectedLog.request.requestedDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Action:</strong>{" "}
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-sm font-semibold ${
                    selectedLog.action === "approved"
                      ? "bg-green-100 text-green-600"
                      : selectedLog.action === "rejected"
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {selectedLog.action}
                </span>
              </p>
              <p><strong>Action By:</strong> {selectedLog.actionBy.name}</p>
              <p><strong>Role:</strong> {selectedLog.actionBy.role}</p>
              <p>
                <strong>Timestamp:</strong>{" "}
                {new Date(selectedLog.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="mt-4">
              <p className="font-semibold text-gray-800">Event Details:</p>
              <div className="bg-gray-100 p-3 rounded-md text-gray-700 max-h-28 overflow-y-auto border">
                {selectedLog.request.eventDetails}
              </div>
            </div>

            {selectedLog.request.rejectionReason && (
              <div className="mt-4">
                <p className="font-semibold text-red-600">Rejection Reason:</p>
                <div className="bg-red-100 p-3 rounded-md text-red-700 border">
                  {selectedLog.request.rejectionReason}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestHistory;