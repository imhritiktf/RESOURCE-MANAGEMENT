import React, { useState } from "react";
import useFacultyRequests from "../../hooks/useFacultyRequests";
import { FaClock, FaCheckCircle, FaTimesCircle, FaSyncAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const FacultyDashboard = () => {
  // All hooks at the top, unconditionally
  const { data, isLoading, error, refetch } = useFacultyRequests();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const navigate = useNavigate();

  // Function to format time ago (days, hours, minutes)
  const getTimeAgo = (date) => {
    if (!date) return "N/A";
    const now = new Date();
    const createdDate = new Date(date);
    const diffInMs = now - createdDate;

    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const minutes = Math.floor(diffInMs / (1000 * 60));

    if (days >= 1) return `${days} day${days !== 1 ? "s" : ""} ago`;
    if (hours >= 1) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    if (minutes >= 0) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    return "N/A";
  };

  // Extract requests from data
  const requests = data?.requests || [];
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((req) => req.status === "pending");
  const approvedRequests = requests.filter((req) => req.status === "approved");
  const rejectedRequests = requests.filter((req) => req.status === "rejected");

  // Calculate percentages for progress bars
  const pendingPercentage = totalRequests ? (pendingRequests.length / totalRequests) * 100 : 0;
  const approvedPercentage = totalRequests ? (approvedRequests.length / totalRequests) * 100 : 0;
  const rejectedPercentage = totalRequests ? (rejectedRequests.length / totalRequests) * 100 : 0;

  // Conditional rendering for loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-4 border-[#ef7f1a] border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-red-600 text-lg font-semibold">Error: {error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-[#ef7f1a] text-white rounded-md hover:bg-[#ffa64d] transition flex items-center gap-2 mx-auto"
          >
            <FaSyncAlt /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-blue-950">Faculty Dashboard</h2>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-[#ef7f1a] text-white rounded-md hover:bg-[#ffa64d] transition flex items-center gap-2"
        >
          <FaSyncAlt /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Requests</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</p>
            </div>
            <FaClock className="text-yellow-500 text-3xl" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-yellow-500 h-2.5 rounded-full"
                style={{ width: `${pendingPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{pendingPercentage.toFixed(1)}% of total</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Approved Requests</p>
              <p className="text-3xl font-bold text-green-600">{approvedRequests.length}</p>
            </div>
            <FaCheckCircle className="text-green-500 text-3xl" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full"
                style={{ width: `${approvedPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{approvedPercentage.toFixed(1)}% of total</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Rejected Requests</p>
              <p className="text-3xl font-bold text-red-600">{rejectedRequests.length}</p>
            </div>
            <FaTimesCircle className="text-red-500 text-3xl" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-red-500 h-2.5 rounded-full"
                style={{ width: `${rejectedPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{rejectedPercentage.toFixed(1)}% of total</p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Request Overview</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <p className="text-gray-600">
              Total Requests: <span className="font-semibold">{totalRequests}</span>
            </p>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <p className="text-sm text-gray-700">Pending: {pendingRequests.length}</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <p className="text-sm text-gray-700">Approved: {approvedRequests.length}</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <p className="text-sm text-gray-700">Rejected: {rejectedRequests.length}</p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-600 font-medium mb-2">Distribution</p>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-yellow-500 h-4"
                style={{ width: `${pendingPercentage}%`, display: "inline-block" }}
              ></div>
              <div
                className="bg-green-500 h-4"
                style={{ width: `${approvedPercentage}%`, display: "inline-block" }}
              ></div>
              <div
                className="bg-red-500 h-4"
                style={{ width: `${rejectedPercentage}%`, display: "inline-block" }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests Section */}
      {requests.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 font-semibold">Resource</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Requested Date</th>
                  <th className="p-3 font-semibold">Pending Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.slice(0, 5).map((req) => (
                  <tr
                    key={req._id}
                    className="hover:bg-gray-50 cursor-pointer transition-all"
                    onClick={() => setSelectedRequest(req)}
                  >
                    <td className="p-3 text-gray-700">{req.resource?.name || "Unknown"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          req.status === "pending"
                            ? "bg-yellow-100 text-yellow-600"
                            : req.status === "approved"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">
                      {new Date(req.requestedDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-gray-700">
                      {req.status === "pending" ? getTimeAgo(req.createdAt) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {requests.length > 5 && (
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing 5 of {requests.length} requests.
              </p>
              <button
                onClick={() => navigate("requests")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                View All Requests
              </button>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setSelectedRequest(null)} // Close on overlay click
        >
          <div className="bg-white p-6 rounded-lg shadow-xl w-[500px] max-w-full transform transition-all scale-100 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-2xl font-bold text-gray-800">Request Details</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700 transition text-xl"
              >
                ✖
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-gray-700 mt-4">
              <p>
                <strong>Faculty:</strong> {selectedRequest.faculty?.name || "Unknown"}
              </p>
              <p>
                <strong>Organization:</strong> {selectedRequest.organization || "N/A"}
              </p>
              <p>
                <strong>Resource:</strong> {selectedRequest.resource?.name || "Unknown"}
              </p>
              <p>
                <strong>Priority:</strong>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-sm font-semibold ${
                    selectedRequest.priority === "urgent"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {selectedRequest.priority || "N/A"}
                </span>
              </p>
              <p>
                <strong>Requested Date:</strong>{" "}
                {new Date(selectedRequest.requestedDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Pending Since:</strong> {getTimeAgo(selectedRequest.createdAt)}
              </p>
              <p>
                <strong>Respond Within:</strong>{" "}
                {selectedRequest.resource?.slaTime
                  ? `${Math.floor(selectedRequest.resource.slaTime / 60)} hour${
                      Math.floor(selectedRequest.resource.slaTime / 60) !== 1 ? "s" : ""
                    }`
                  : "Unknown"}
              </p>
              <p>
                <strong>Status:</strong>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-sm font-semibold ${
                    selectedRequest.status === "approved"
                      ? "bg-green-100 text-green-600"
                      : selectedRequest.status === "rejected"
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {selectedRequest.status}
                </span>
              </p>
              {selectedRequest.status !== "pending" && selectedRequest.approvedBy && (
                <p>
                  <strong>
                    {selectedRequest.status === "approved" ? "Approved By:" : "Rejected By:"}
                  </strong>{" "}
                  {selectedRequest.approvedBy?.name || "Unknown"}
                </p>
              )}
            </div>
            <div className="mt-4">
              <p className="font-semibold text-gray-800">Event Details:</p>
              <div className="bg-gray-100 p-3 rounded-md text-gray-700 max-h-28 overflow-y-auto border">
                {selectedRequest.eventDetails || "N/A"}
              </div>
            </div>
            {selectedRequest.rejectionReason && (
              <div className="mt-4">
                <p className="font-semibold text-red-600">Rejection Reason:</p>
                <div className="bg-red-100 p-3 rounded-md text-red-700 border">
                  {selectedRequest.rejectionReason}
                </div>
              </div>
            )}
            {selectedRequest.slaBreached?.isBreached && (
              <div className="mt-4">
                <p className="font-semibold text-red-600">SLA Breach Details:</p>
                <div className="bg-red-100 p-3 rounded-md text-red-700 border">
                  <p>
                    <strong>Breached At:</strong>{" "}
                    {new Date(selectedRequest.slaBreached.breachedAt).toLocaleString()}
                  </p>
                  <p>
                    <strong>Reason:</strong> {selectedRequest.slaBreached.reason || "SLA Time Exceeded"}
                  </p>
                </div>
              </div>
            )}
            {selectedRequest.modifiedCount > 0 && (
              <div className="mt-4">
                <p className="font-semibold text-blue-600">Resubmission Details:</p>
                <div className="bg-blue-100 p-3 rounded-md text-blue-700 border">
                  <p>
                    <strong>Resubmitted Count:</strong> {selectedRequest.modifiedCount}
                  </p>
                  <p>
                    <strong>Last Resubmitted At:</strong>{" "}
                    {new Date(selectedRequest.modifiedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            <div className="flex justify-end mt-6 gap-4">
              <button
                onClick={() => navigate(`/requests/${selectedRequest._id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                View Full Details
              </button>
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;