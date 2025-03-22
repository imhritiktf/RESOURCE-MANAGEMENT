import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { FaCheck, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import debounce from "lodash.debounce"; // Import debounce

const RequestManagement = () => {
  const [filterStatus, setFilterStatus] = useState("all"); // Default to "all"
  const [selectedRequest, setSelectedRequest] = useState(null); // View Details
  const [requestToProcess, setRequestToProcess] = useState(null); // Approve/Reject Action
  const [action, setAction] = useState(null); // "approve" or "reject"
  const [rejectionReason, setRejectionReason] = useState("");

  // Sorting & Filtering States
  const [searchFaculty, setSearchFaculty] = useState("");
  const [searchResource, setSearchResource] = useState("");
  const [sortByDate, setSortByDate] = useState("newest");
  const [sortByPriority, setSortByPriority] = useState("urgent");

  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 10;

  const queryClient = useQueryClient();

  // Debounced search functions
  const debouncedSearchFaculty = useCallback(
    debounce((value) => {
      setSearchFaculty(value);
      setPage(1); // Reset to first page when search changes
    }, 300),
    []
  );

  const debouncedSearchResource = useCallback(
    debounce((value) => {
      setSearchResource(value);
      setPage(1); // Reset to first page when search changes
    }, 300),
    []
  );

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "requests",
      filterStatus,
      searchFaculty,
      searchResource,
      sortByDate,
      sortByPriority,
      page,
    ],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/requests", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: filterStatus === "all" ? undefined : filterStatus, // Send undefined for "all"
          facultyName: searchFaculty,
          resourceName: searchResource,
          sortBy: sortByDate === "newest" ? "-requestedDate" : "requestedDate",
          priority: sortByPriority === "urgent" ? "urgent" : "normal",
          page,
          limit,
        },
      });
      return data;
    },
    keepPreviousData: true,
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, reason }) => {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/requests/${requestId}/status`,
        { status, rejectionReason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      toast.success("Request updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      setRequestToProcess(null);
      setAction(null);
    },
    onError: () => {
      toast.error("Failed to update request. Try again.");
    },
  });

  // Function to clear all filters
  const clearFilters = () => {
    setFilterStatus("all");
    setSearchFaculty("");
    setSearchResource("");
    setSortByDate("newest");
    setSortByPriority("urgent");
    setPage(1);
  };

  if (isLoading)
    return <p className="text-center text-gray-600">Loading requests...</p>;
  if (error)
    return <p className="text-center text-red-500">Error: {error.message}</p>;

  const { requests, totalPages, totalCount } = data;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Request Management
      </h2>

      {/*  Filtering Options */}
      <div className="flex gap-6 mb-6">
        {["all", "pending", "approved", "rejected"].map((status) => (
          <label
            key={status}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="radio"
              value={status}
              checked={filterStatus === status}
              onChange={() => {
                setFilterStatus(status);
                setPage(1); // Reset to first page when filter changes
              }}
              className="hidden"
            />
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterStatus === status
                  ? "bg-[#ef7f1a] text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {status === "all"
                ? "All Requests"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </label>
        ))}
      </div>

      {/*  Search & Sorting */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search Faculty */}
        <input
          type="text"
          placeholder="Search Faculty..."
          defaultValue={searchFaculty}
          onChange={(e) => debouncedSearchFaculty(e.target.value)}
          className="px-3 py-2 border rounded-md"
        />
        {/* Search Resource */}
        <input
          type="text"
          placeholder="Search Resource..."
          defaultValue={searchResource}
          onChange={(e) => debouncedSearchResource(e.target.value)}
          className="px-3 py-2 border rounded-md"
        />
        {/* Sort by Date */}
        <select
          value={sortByDate}
          onChange={(e) => setSortByDate(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        {/* Sort by Priority */}
        <select
          value={sortByPriority}
          onChange={(e) => setSortByPriority(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="urgent">Urgent First</option>
          <option value="normal">Normal First</option>
        </select>

        {/* Clear Filters Button */}
        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
        >
          Clear Filters
        </button>
      </div>
      
      <div className="flex items-end justify-between">
      {/*  Number of Results */}
        <div className="mb-4 text-gray-700 ">
          Showing <span className="font-semibold">{requests.length}</span> of{" "}
          <span className="font-semibold">{totalCount}</span> requests
        </div>
        {/* color identification */}
        <div className="mb-6 inline-block">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Color Identification
          </h3>
          <div className="flex flex-wrap gap-4">
            {/* Approved */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 rounded-full"></span>
              <span className="text-sm text-gray-700">Approved</span>
            </div>
            {/* Pending */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-yellow-100 rounded-full"></span>
              <span className="text-sm text-gray-700">Pending</span>
            </div>
            {/* Rejected */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-100 rounded-full"></span>
              <span className="text-sm text-gray-700">Rejected</span>
            </div>
          </div>
        </div>
      </div>

      {/*  Requests Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gradient-to-r from-[#ef7f1a] to-[#ffa64d] text-white sticky top-0">
            <tr>
              <th className="p-4 font-semibold">Faculty</th>
              <th className="p-4 font-semibold">Resource</th>
              <th className="p-4 font-semibold text-center">Priority</th>
              <th className="p-4 font-semibold text-center">Requested Date</th>
              <th className="p-4 font-semibold text-center">Status</th>
              <th className="p-4 font-semibold text-center">Respond within</th>
              <th className="p-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-6 text-gray-500">
                  No requests found
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr
                  key={request._id}
                  className={`transition-all duration-200 ${
                    request.status === "pending"
                      ? "bg-yellow-50 hover:bg-yellow-100" // Highlight pending requests
                      : request.status === "approved"
                      ? "bg-green-50 hover:bg-green-100" // Highlight approved requests
                      : request.status === "rejected"
                      ? "bg-red-50 hover:bg-red-100" // Highlight rejected requests
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="p-4 text-gray-700">
                    {request.faculty?.name || "Unknown"}
                  </td>
                  <td className="p-4 text-gray-700">
                    {request.resource?.name || "Unknown"}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        request.priority === "urgent"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {request.priority}
                    </span>
                  </td>
                  <td className="p-4 text-center text-gray-700">
                    {new Date(request.requestedDate).toLocaleDateString()}
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
                    {request.resource?.slaTime/60 || "Unknown"} Hours
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/*  Pagination */}
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

      {/*  Approve Confirmation Modal */}
      {action === "approve" && requestToProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
            <h3 className="text-xl font-bold mb-4">Confirm Approval</h3>
            <p className="text-gray-700">
              Are you sure you want to approve this request?
            </p>
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

      {/*  Reject Confirmation Modal */}
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

{/* details modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[500px] max-w-full transform transition-all scale-100 animate-fadeIn">
            {/* Modal Header */}
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

            {/* Modal Content */}
            <div className="grid grid-cols-2 gap-4 text-gray-700 mt-4">
              <p>
                <strong>Faculty:</strong> {selectedRequest.faculty?.name}
              </p>
              <p>
                <strong>Organization:</strong> {selectedRequest.organization}
              </p>
              <p>
                <strong>Resource:</strong> {selectedRequest.resource?.name}
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
                  {selectedRequest.priority}
                </span>
              </p>
              <p>
                <strong>Requested Date:</strong>{" "}
                {new Date(selectedRequest.requestedDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Duration:</strong> {selectedRequest.durationDays} days
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

              {/*  Approved By / Rejected By */}
              {selectedRequest.status !== "pending" &&
                selectedRequest.approvedBy && (
                  <p>
                    <strong>
                      {selectedRequest.status === "approved"
                        ? "Approved By:"
                        : "Rejected By:"}
                    </strong>{" "}
                    {selectedRequest.approvedBy?.name || "Unknown"}
                  </p>
                )}
            </div>  

            {/* Event Details */}
            <div className="mt-4">
              <p className="font-semibold text-gray-800">Event Details:</p>
              <div className="bg-gray-100 p-3 rounded-md text-gray-700 max-h-28 overflow-y-auto border">
                {selectedRequest.eventDetails}
              </div>
            </div>

            {/* Rejection Reason (if exists) */}
            {selectedRequest.rejectionReason && (
              <div className="mt-4">
                <p className="font-semibold text-red-600">Rejection Reason:</p>
                <div className="bg-red-100 p-3 rounded-md text-red-700 border">
                  {selectedRequest.rejectionReason}
                </div>
              </div>
            )}

            {/* Modal Footer */}
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
