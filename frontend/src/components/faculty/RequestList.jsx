import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import useFacultyRequests from "../../hooks/useFacultyRequests";
import { deleteRequest, resubmitRequest } from "../../api/facultyApi";

// Function to calculate time ago (days, hours, or minutes)
const getTimeAgo = (date) => {
  if (!date) return "N/A";
  const now = new Date();
  const createdDate = new Date(date);
  const diffInMs = now - createdDate;

  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24)); // Convert ms to days
  const hours = Math.floor(diffInMs / (1000 * 60 * 60)); // Convert ms to hours
  const minutes = Math.floor(diffInMs / (1000 * 60)); // Convert ms to minutes

  if (days >= 1) {
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  } else if (hours >= 1) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else if (minutes >= 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  }
  return "N/A";
};

// Function to format SLA response time (in minutes) to hours
const getResponseTime = (slaTime) => {
  if (!slaTime || isNaN(slaTime)) return "N/A";
  const hours = Math.floor(slaTime / 60);
  return `${hours} hour${hours !== 1 ? "s" : ""}`;
};

const RequestList = () => {
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    startDate: "",
    endDate: "",
    sortBy: "newest",
    page: 1,
    limit: 10,
  });
  const [selectedRequest, setSelectedRequest] = useState(null);

  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useFacultyRequests(filters);
  const requests = data?.requests || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;
  const totalCount = data?.totalCount || requests.length;

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRequest,
    onSuccess: (data) => {
      toast.success(data.message || "Request deleted successfully!");
      queryClient.invalidateQueries(["facultyRequests"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete request");
    },
  });

  // Resubmit Mutation
  const resubmitMutation = useMutation({
    mutationFn: resubmitRequest,
    onSuccess: (data) => {
      toast.success(data.message || "Request resubmitted successfully!");
      queryClient.invalidateQueries(["facultyRequests"]);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to resubmit request"
      );
    },
  });

  if (isLoading) {
    return (
      <p className="text-center text-gray-600 py-8">Loading requests...</p>
    );
  }
  if (error) {
    return (
      <p className="text-center text-red-500 py-8">Error: {error.message}</p>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">My Requests</h2>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-[#ef7f1a] text-white rounded hover:bg-[#ffa64d] transition"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value, page: 1 })
            }
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#ef7f1a] focus:border-[#ef7f1a]"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value, page: 1 })
            }
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#ef7f1a] focus:border-[#ef7f1a]"
          >
            <option value="">All</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value, page: 1 })
            }
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#ef7f1a] focus:border-[#ef7f1a]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value, page: 1 })
            }
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#ef7f1a] focus:border-[#ef7f1a]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters({ ...filters, sortBy: e.target.value, page: 1 })
            }
            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#ef7f1a] focus:border-[#ef7f1a]"
          >
            <option value="newest">Newest First</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Results Count and Color Identification */}
      <div className="flex items-end justify-between mb-6">
        <div className="text-gray-700">
          Showing <span className="font-semibold">{requests.length}</span> of{" "}
          <span className="font-semibold">{totalCount}</span> requests
        </div>
        <div className="inline-block">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Color Identification
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 rounded-full"></span>
              <span className="text-sm text-gray-700">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-yellow-100 rounded-full"></span>
              <span className="text-sm text-gray-700">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-100 rounded-full"></span>
              <span className="text-sm text-gray-700">Rejected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gradient-to-r from-[#ef7f1a] to-[#ffa64d] text-white sticky top-0">
            <tr>
              <th className="p-4 font-semibold">Resource</th>
              <th className="p-4 font-semibold">Organization</th>
              <th className="p-4 font-semibold text-center">Requested Date</th>
              <th className="p-4 font-semibold text-center">Pending Since</th>
              <th className="p-4 font-semibold text-center">Priority</th>
              <th className="p-4 font-semibold text-center">Status</th>
              <th className="p-4 font-semibold text-center">Response Time</th>
              <th className="p-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center p-6 text-gray-500">
                  No requests found
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr
                  key={request._id}
                  className={`transition-all duration-200 cursor-pointer ${
                    request.status === "pending"
                      ? "bg-yellow-50 hover:bg-yellow-100"
                      : request.status === "approved"
                      ? "bg-green-50 hover:bg-green-100"
                      : request.status === "rejected"
                      ? "bg-red-50 hover:bg-red-100"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <td className="p-4 text-gray-700">
                    {request.resource ? request.resource.name : "No resource"}
                  </td>
                  <td className="p-4 text-gray-700">
                    {request.organization || "N/A"}
                  </td>
                  <td className="p-4 text-gray-700 text-center">
                    {new Date(request.requestedDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-gray-700 text-center">
                    {getTimeAgo(request.createdAt)}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        request.priority === "urgent"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {request.priority || "N/A"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        request.status === "approved"
                          ? "bg-green-100 text-green-600"
                          : request.status === "rejected"
                          ? "bg-red-100 text-red-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-700 text-center">
                    {getResponseTime(request.resource?.slaTime)}
                  </td>
                  <td className="p-4 text-center flex justify-center gap-4">
                    {request.status === "pending" && (
                      <button
                        className="text-red-600 hover:text-red-700 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              "Are you sure you want to delete this request?"
                            )
                          ) {
                            deleteMutation.mutate(request._id);
                          }
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                    {request.inactiveStatus &&
                      request.slaBreached?.isBreached &&
                      request.slaBreached?.resolved === false && (
                        <button
                          className="text-blue-600 hover:text-blue-700 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            resubmitMutation.mutate({ requestId: request._id });
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h5m11 0v5m-5-5h5m-5 0V4"
                            />
                          </svg>
                        </button>
                      )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <button
          className="px-4 py-2 bg-gray-200 rounded-l hover:bg-gray-300 transition disabled:bg-gray-100"
          onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
          disabled={filters.page === 1}
        >
          Previous
        </button>
        <span className="px-4 py-2 bg-gray-100">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="px-4 py-2 bg-gray-200 rounded-r hover:bg-gray-300 transition disabled:bg-gray-100"
          onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={(e) => {
            setSelectedRequest(null);
          }}
        >
          <div className="bg-white p-6 rounded-lg shadow-xl w-[500px] max-w-full transform transition-all scale-100 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-2xl font-bold text-gray-800">
                Request Details
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700 transition text-xl"
              >
                ✖
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-gray-700 mt-4">
              <p>
                <strong>Resource:</strong>{" "}
                {selectedRequest.resource?.name || "N/A"}
              </p>
              <p>
                <strong>Organization:</strong>{" "}
                {selectedRequest.organization || "N/A"}
              </p>
              <p>
                <strong>Requested Date:</strong>{" "}
                {new Date(selectedRequest.requestedDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Pending Since:</strong>{" "}
                {getTimeAgo(selectedRequest.createdAt)}
              </p>
              <p>
                <strong>Duration:</strong> {selectedRequest.durationDays} days
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
              <p>
                <strong>Response Time:</strong>{" "}
                {getResponseTime(selectedRequest.resource?.slaTime)}
              </p>
              {selectedRequest.approvedBy && (
                <p>
                  <strong>Approved By:</strong>{" "}
                  {selectedRequest.approvedBy.name || "N/A"}
                </p>
              )}
            </div>

            <div className="mt-4">
              <p className="font-semibold text-gray-800">Event Details:</p>
              <div className="bg-gray-100 p-3 rounded-md text-gray-700 max-h-28 overflow-y-auto border">
                {selectedRequest.eventDetails || "N/A"}
              </div>
            </div>

           

            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                onClick={() => setSelectedRequest(null)}
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

export default RequestList;
