import React, { useState } from "react";
import { useForm } from "react-hook-form";
import useSubmitRequest from "../../hooks/useSubmitRequest";
import useResources from "../../hooks/useResources";
import { FaSearch } from "react-icons/fa";

const NewRequestForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const {
    mutate: submitRequest,
    isLoading,
    isError,
    error,
  } = useSubmitRequest();
  const { data: resources, isLoading: isResourcesLoading } = useResources();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);

  const onSubmit = (data) => {
    const requestData = {
      resource: selectedResource._id,
      eventDetails: data.eventDetails,
      requestedDate: new Date(data.requestedDate).toISOString(), // ISO format
      durationDays: Number(data.durationDays),
      priority: data.priority,
    };
    console.log("Submitting request:", requestData);
    submitRequest(requestData, {
      onSuccess: () => {
        reset();
        setSelectedResource(null);
      },
    });
  };

  const filteredResources =
    resources?.filter((resource) => {
      const matchesSearch =
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (resource.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesOrg = selectedOrganization
        ? resource.organization === selectedOrganization
        : true;
      const matchesSection = selectedSection
        ? resource.section === selectedSection
        : true;
      return matchesSearch && matchesOrg && matchesSection;
    }) || [];

  const organizations = [
    ...new Set(resources?.map((r) => r.organization).filter(Boolean)),
  ];
  const sections = [
    ...new Set(resources?.map((r) => r.section).filter(Boolean)),
  ];

  if (isResourcesLoading) {
    return (
      <p className="text-center text-gray-600 py-8">Loading resources...</p>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-blue-950 mb-6">
        New Resource Request
      </h2>

      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#ef7f1a]"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-500" />
        </div>
        <select
          value={selectedOrganization}
          onChange={(e) => setSelectedOrganization(e.target.value)}
          className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#ef7f1a]"
        >
          <option value="">All Organizations</option>
          {organizations.map((org) => (
            <option key={org} value={org}>
              {org}
            </option>
          ))}
        </select>
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#ef7f1a]"
        >
          <option value="">All Sections</option>
          {sections.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>
      </div>

      {/* Resources Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <table className="w-full text-left border-collapse rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-gradient-to-r from-[#ef7f1a] to-[#ffa64d] text-white sticky top-0">
            <tr>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Description</th>
              <th className="p-4 font-semibold">Organization</th>
              <th className="p-4 font-semibold">Section</th>
              <th className="p-4 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredResources.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-6 text-gray-500">
                  No resources found
                </td>
              </tr>
            ) : (
              filteredResources.map((resource, index) => (
                <tr
                  key={resource._id}
                  className={`transition-all duration-200 hover:bg-gray-50 ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <td className="p-4 text-gray-700">{resource.name}</td>
                  <td className="p-4 text-gray-700">
                    {resource.description || "N/A"}
                  </td>
                  <td className="p-4 text-gray-700">
                    {resource.organization || "N/A"}
                  </td>
                  <td className="p-4 text-gray-700">
                    {resource.section || "N/A"}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedResource(resource)}
                      className="px-3 py-1 bg-[#ef7f1a] text-white rounded-md hover:bg-[#ffa64d] transition"
                    >
                      Request
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Request Modal */}
      {selectedResource && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={() => setSelectedResource(null)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl w-[500px] max-w-full transform transition-all scale-100 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-2xl font-bold text-gray-800">
                Request: {selectedResource.name}
              </h3>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-gray-500 hover:text-gray-700 transition text-xl"
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Details
                </label>
                <textarea
                  {...register("eventDetails", {
                    required: "Event details are required",
                  })}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#ef7f1a] focus:border-[#ef7f1a]"
                  rows="3"
                />
                {errors.eventDetails && (
                  <span className="text-red-500 text-sm">
                    {errors.eventDetails.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requested Date
                </label>
                <input
                  type="date"
                  {...register("requestedDate", {
                    required: "Requested date is required",
                  })}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#ef7f1a] focus:border-[#ef7f1a]"
                />
                {errors.requestedDate && (
                  <span className="text-red-500 text-sm">
                    {errors.requestedDate.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  {...register("durationDays", {
                    required: "Duration is required",
                    min: {
                      value: 1,
                      message: "Duration must be at least 1 day",
                    },
                  })}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#ef7f1a] focus:border-[#ef7f1a]"
                />
                {errors.durationDays && (
                  <span className="text-red-500 text-sm">
                    {errors.durationDays.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  {...register("priority", {
                    required: "Priority is required",
                  })}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-[#ef7f1a] focus:border-[#ef7f1a]"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
                {errors.priority && (
                  <span className="text-red-500 text-sm">
                    {errors.priority.message}
                  </span>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedResource(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md text-white transition ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#ef7f1a] hover:bg-[#ffa64d]"
                  }`}
                >
                  {isLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
            {isError && (
              <p className="text-red-500 mt-2">
                {error.message || "Failed to submit request"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewRequestForm;
