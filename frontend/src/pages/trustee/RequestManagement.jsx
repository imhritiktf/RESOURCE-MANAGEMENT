import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { FaCheck, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import debounce from "lodash.debounce";

// Function to calculate time ago (days, hours, or minutes)
const getTimeAgo = (date) => {
  if (!date) return "N/A";
  const now = new Date();
  const createdDate = new Date(date);
  const diffInMs = now - createdDate;

  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const minutes = Math.floor(diffInMs / (1000 * 60));

  if (days >= 1) {
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  } else if (hours >= 1) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else if (minutes >= 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  }
  return "N/A";
};

// Function to check if SLA is breached (client-side fallback)
const isSLABreached = (createdAt, slaTime) => {
  if (!createdAt || !slaTime) return false;
  const now = new Date();
  const createdDate = new Date(createdAt);
  const slaLimit = slaTime * 60 * 1000; // Convert minutes to milliseconds
  return now - createdDate > slaLimit;
};

const RequestManagement = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestToProcess, setRequestToProcess] = useState(null);
  const [action, setAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchFaculty, setSearchFaculty] = useState("");
  const [searchResource, setSearchResource] = useState("");
  const [sortByDate, setSortByDate] = useState("newest");
  const [page, setPage] = useState(1);
  const limit = 10;

  const queryClient = useQueryClient();

  // Debounced search functions
  const debouncedSearchFaculty = useCallback(
    debounce((value) => {
      setSearchFaculty(value);
      setPage(1);
    }, 300),
    []
  );

  const debouncedSearchResource = useCallback(
    debounce((value) => {
      setSearchResource(value);
      setPage(1);
    }, 300),
    []
  );

  // Fetch requests with compound sorting
  const { data, isLoading, error } = useQuery({
    queryKey: ["requests", filterStatus, searchFaculty, searchResource, sortByDate, page],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/requests", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: filterStatus === "all" ? undefined : filterStatus,
          facultyName: searchFaculty,
          resourceName: searchResource,
          sort: sortByDate === "newest" ? "-priority -createdAt" : "priority createdAt",
          page,
          limit,
        },
      });
      return data;
    },
    keepPreviousData: true,
  });

  const { data: pendingRequestsCount, refetch: refetchPendingCount } = useQuery({
    queryKey: ["pendingRequestsCount"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/requests/count", {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: "pending" },
      });
      return data.count;
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, reason }) => {
      const token = localStorage.getItem("token");
      const { data } = await axios.put(
        `http://localhost:5000/api/requests/${requestId}/status`,
        { status, rejectionReason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Request updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      refetchPendingCount();
      setRequestToProcess(null);
      setAction(null);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "Something went wrong!";
      toast.error(errorMessage);
    },
  });

  // Clear filters
  const clearFilters = () => {
    setFilterStatus("all");
    setSearchFaculty("");
    setSearchResource("");
    setSortByDate("newest");
    setPage(1);
  };

  if (isLoading) return <p className="text-center text-gray-600">Loading requests...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error.message}</p>;

  const { requests, totalPages, totalCount } = data;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Request Management</h2>

      {/* Filtering Options */}
      <div className="flex gap-6 mb-6">
        {["all", "pending", "approved", "rejected"].map((status) => (
          <label key={status} className="flex items-center gap-2 cursor-pointer relative">
            <input
              type="radio"
              value={status}
              checked={filterStatus === status}
              onChange={() => {
                setFilterStatus(status);
                setPage(1);
              }}
              className="hidden"
            />
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterStatus === status ? "bg-[#ef7f1a] text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {status === "all" ? "All Requests" : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            {status === "pending" && pendingRequestsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {pendingRequestsCount}
              </span>
            )}
          </label>
        ))}
      </div>

      {/* Search & Sorting */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search Faculty..."
          defaultValue={searchFaculty}
          onChange={(e) => debouncedSearchFaculty(e.target.value)}
          className="px-3 py-2 border rounded-md"
        />
        <input
          type="text"
          placeholder="Search Resource..."
          defaultValue={searchResource}
          onChange={(e) => debouncedSearchResource(e.target.value)}
          className="px-3 py-2 border rounded-md"
        />
        <select
          value={sortByDate}
          onChange={(e) => setSortByDate(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
        >
          Clear Filters
        </button>
      </div>

      <div className="flex items-end justify-between">
        <div className="mb-4 text-gray-700">
          Showing <span className="font-semibold">{requests.length}</span> of{" "}
          <span className="font-semibold">{totalCount}</span> requests
        </div>
        <div className="mb-6 inline-block">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Color Identification</h3>
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
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-500 rounded-full border-2 border-red-700"></span>
              <span className="text-sm text-gray-700">SLA Breached</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-blue-500 rounded-full border-2 border-blue-700"></span>
              <span className="text-sm text-gray-700">Resubmitted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
  <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-lg">
    <thead className="bg-gradient-to-r from-[#ef7f1a] to-[#ffa64d] text-white sticky top-0">
      <tr>
        <th className="p-4 font-semibold">Faculty</th>
        <th className="p-4 font-semibold">Resource</th>
        <th className="p-4 font-semibold text-center">Priority</th>
        <th className="p-4 font-semibold text-center">Requested Date</th>
        <th className="p-4 font-semibold text-center">Pending Since</th>
        <th className="p-4 font-semibold text-center">Status</th>
        <th className="p-4 font-semibold text-center">Respond Within</th>
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
        requests.map((request) => {
          const slaBreached =
            request.slaBreached?.isBreached || isSLABreached(request.createdAt, request.resource?.slaTime);
          const isResubmitted = request.modifiedCount > 0;

          return (
            <tr
              key={request._id}
              className={`transition-all duration-200 ${
                slaBreached && request.status === "pending"
                  ? "bg-red-50 hover:bg-red-100 border-l-4 border-red-500"
                  : request.status === "pending"
                  ? "bg-yellow-50 hover:bg-yellow-100"
                  : request.status === "approved"
                  ? "bg-green-50 hover:bg-green-100"
                  : request.status === "rejected"
                  ? "bg-red-50 hover:bg-red-100"
                  : "hover:bg-gray-50"
              }`}
            >
              <td className="p-4 text-gray-700">{request.faculty?.name || "Unknown"}</td>
              <td className="p-4 text-gray-700">{request.resource?.name || "Unknown"}</td>
              <td className="p-4 text-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    request.priority === "urgent" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {request.priority}
                </span>
              </td>
              <td className="p-4 text-center text-gray-700">
                {new Date(request.requestedDate).toLocaleDateString()}
              </td>
              <td className="p-4 text-center text-gray-700">
                {request.status === "pending" ? getTimeAgo(request.createdAt) : "-"}
              </td>
              <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
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
                  {isResubmitted && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                      Resubmitted
                    </span>
                  )}
                </div>
              </td>
              <td className="p-4 text-gray-700 text-center">
                {request.resource?.slaTime
                  ? `${Math.floor(request.resource.slaTime / 60)} hour${
                      Math.floor(request.resource.slaTime / 60) !== 1 ? "s" : ""
                    }`
                  : "Unknown"}
              </td>
              <td className="p-4 text-center flex justify-center gap-4">
                <button
                  className="text-blue-600 hover:text-blue-700 transition-all"
                  onClick={() => setSelectedRequest(request)}
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"
                    />
                  </svg>
                </button>
                {request.status === "pending" && (
                  <>
                    <button
                      className="text-green-600 hover:text-green-700 transition-all"
                      onClick={() => {
                        setRequestToProcess(request);
                        setAction("approve");
                      }}
                    >
                      <FaCheck className="h-5 w-5" />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-700 transition-all"
                      onClick={() => {
                        setRequestToProcess(request);
                        setAction("reject");
                      }}
                    >
                      <FaTimes className="h-5 w-5" />
                    </button>
                  </>
                )}
              </td>
            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <button
          className="px-4 py-2 bg-gray-200 rounded-l"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="px-4 py-2 bg-gray-100">
          Page {page} of {totalPages}
        </span>
        <button
          className="px-4 py-2 bg-gray-200 rounded-r"
          onClick={() => setPage((prev) => prev + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>

      {/* Approve Confirmation Modal */}
      {action === "approve" && requestToProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
            <h3 className="text-xl font-bold mb-4">Confirm Approval</h3>
            <p className="text-gray-700">Are you sure you want to approve this request?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setAction(null)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={() =>
                  updateRequestMutation.mutate({
                    requestId: requestToProcess._id,
                    status: "approved",
                    reason: "",
                  })
                }
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {action === "reject" && requestToProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
            <h3 className="text-xl font-bold mb-4">Confirm Rejection</h3>
            <textarea
              className="w-full p-2 border rounded-md"
              rows="3"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setAction(null)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                disabled={!rejectionReason.trim()}
                onClick={() =>
                  updateRequestMutation.mutate({
                    requestId: requestToProcess._id,
                    status: "rejected",
                    reason: rejectionReason,
                  })
                }
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={() => setSelectedRequest(null)}>
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
              <p><strong>Faculty:</strong> {selectedRequest.faculty?.name || "Unknown"}</p>
              <p><strong>Organization:</strong> {selectedRequest.organization || "N/A"}</p>
              <p><strong>Resource:</strong> {selectedRequest.resource?.name || "Unknown"}</p>
              <p>
                <strong>Priority:</strong>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-sm font-semibold ${
                    selectedRequest.priority === "urgent" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {selectedRequest.priority}
                </span>
              </p>
              <p>
                <strong>Requested Date:</strong>{" "}
                {new Date(selectedRequest.requestedDate).toLocaleDateString()}
              </p>
              <p><strong>Pending Since:</strong> {getTimeAgo(selectedRequest.createdAt)}</p>
              <p>
                <strong>Respond Within:</strong>{" "}
                {selectedRequest.resource?.slaTime
                  ? `${Math.floor(selectedRequest.resource.slaTime / 60)} hour${
                      Math.floor(selectedRequest.resource.slaTime / 60) !== 1 ? "s" : ""
                    }`
                  : "Unknown"}
              </p>
              <p>
                <strong>SLA Status:</strong>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-sm font-semibold ${
                    selectedRequest.slaBreached?.isBreached ||
                    isSLABreached(selectedRequest.createdAt, selectedRequest.resource?.slaTime)
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {selectedRequest.slaBreached?.isBreached ||
                  isSLABreached(selectedRequest.createdAt, selectedRequest.resource?.slaTime)
                    ? "Breached"
                    : "Within SLA"}
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
              {selectedRequest.status !== "pending" && selectedRequest.approvedBy && (
                <p>
                  <strong>{selectedRequest.status === "approved" ? "Approved By:" : "Rejected By:"}</strong>{" "}
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

export default RequestManagement;