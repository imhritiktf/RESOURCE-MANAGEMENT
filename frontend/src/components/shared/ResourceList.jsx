import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaTrash, FaEdit, FaUpload, FaSpinner, FaSearch } from "react-icons/fa";
import Select from "react-select"; // For dropdown

const ResourceList = () => {
  const queryClient = useQueryClient();
  const [resourceToDelete, setResourceToDelete] = useState(null); // Track resource to delete
  const [resourceToUpdate, setResourceToUpdate] = useState(null); // Track resource to update
  const [showCSVUploadModal, setShowCSVUploadModal] = useState(false); // State for CSV upload modal
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    organization: "",
    supervisors: [],
    section: "", // Selected section
    slaTime: 2880, // Default SLA time in minutes (48 hours)
    newSection: "", // New section input
  });
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [selectedSection, setSelectedSection] = useState(""); // Filter by section
  const [selectedOrganization, setSelectedOrganization] = useState(""); // Filter by organization

  // Fetch resources using TanStack Query
  const {
    data: resources = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/resources", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
  });

  // Fetch sections using TanStack Query
  const { data: sections = [] } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        "http://localhost:5000/api/resources/sections",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return data.sections; // Return the sections array
    },
  });

  // Fetch supervisors for the dropdown
  const { data: supervisors = [] } = useQuery({
    queryKey: ["supervisors"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        "http://localhost:5000/api/auth?role=supervisor",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return data;
    },
  });

  // Delete resource mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      const { data } = await axios.delete(
        `http://localhost:5000/api/resources/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return data; // Return the response data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["resources"] }); // Refresh the list
      toast.success(data.message || "Resource deleted successfully"); // Use backend message
      setResourceToDelete(null); // Close the confirmation modal
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete resource"); // Use backend error message
    },
  });

  // Update resource mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedResource) => {
      const token = localStorage.getItem("token");
      const { data } = await axios.put(
        `http://localhost:5000/api/resources/${updatedResource._id}`,
        updatedResource,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return data; // Return the response data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["resources"] }); // Refresh the list
      toast.success(data.message || "Resource updated successfully"); // Use backend message
      setResourceToUpdate(null); // Close the update modal
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update resource"); // Use backend error message
    },
  });

  // Handle CSV upload
  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:5000/api/resources/upload-resources-csv",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["resources"] }); // Refresh the list
      setShowCSVUploadModal(false); // Close the modal
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload CSV");
    }
  };

  // Handle update form submission
  const handleUpdateSubmit = (e) => {
    e.preventDefault();

    // Validate SLA time
    if (formData.slaTime <= 0 || formData.slaTime > 10080) {
      toast.error("SLA time must be between 1 and 10080 minutes.");
      return;
    }

    // Prepare the final resource data
    const updatedResource = {
      ...formData,
      section: formData.newSection || formData.section, // Use new section if provided
      _id: resourceToUpdate._id,
    };

    updateMutation.mutate(updatedResource);
  };

  // Handle input change for update form
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle supervisor selection for update form
  const handleSupervisorChange = (selectedOptions) => {
    const selectedSupervisors = selectedOptions.map((option) => option.value);
    setFormData({ ...formData, supervisors: selectedSupervisors });
  };

  // Open update modal and set form data
  const openUpdateModal = (resource) => {
    setResourceToUpdate(resource);
    setFormData({
      name: resource.name,
      description: resource.description,
      organization: resource.organization,
      supervisors: resource.supervisors.map((supervisor) => supervisor._id),
      section: resource.section, // Include section in the form data
      slaTime: resource.slaTime || 2880, // Include SLA time in the form data
      newSection: "", // Reset new section input
    });
  };

  // Format supervisors for the dropdown
  const supervisorOptions = supervisors.map((supervisor) => ({
    value: supervisor._id,
    label: supervisor.name,
  }));

  // Format sections for the dropdown
  const sectionOptions = sections.map((section) => ({
    value: section,
    label: section,
  }));

  // Filter resources based on search query and filters
  const filteredResources = resources.filter((resource) => {
    const matchesSearchQuery =
      resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSection = selectedSection
      ? resource.section === selectedSection
      : true;

    const matchesOrganization = selectedOrganization
      ? resource.organization === selectedOrganization
      : true;

    return matchesSearchQuery && matchesSection && matchesOrganization;
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-[#ef7f1a]" />
      </div>
    );
  if (isError)
    return (
      <div className="text-center text-red-500 py-6">
        Error fetching resources. Please try again later.
      </div>
    );

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Resource List</h2>

      {/* Search and Filters */}
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
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#ef7f1a]"
        >
          <option value="">All Sections</option>
          {sectionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={selectedOrganization}
          onChange={(e) => setSelectedOrganization(e.target.value)}
          className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#ef7f1a]"
        >
          <option value="">All Organizations</option>
          <option value="CSC">CSC</option>
          <option value="GHP">GHP</option>
        </select>
      </div>

      {/* CSV Upload Button */}
      <button
        onClick={() => setShowCSVUploadModal(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mb-4 flex items-center"
      >
        <FaUpload className="inline-block mr-2" />
        Upload Resources via CSV
      </button>

      {/* Resources Table */}
      <div className="overflow-x-auto rounded-lg shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gradient-to-r from-[#ef7f1a] to-[#ffa64d] text-white sticky top-0">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Description</th>
              <th className="p-4">Organization</th>
              <th className="p-4">Supervisors</th>
              <th className="p-4">Section</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResources.map((resource, index) => (
              <tr
                key={resource._id}
                className={`border-b hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                }`}
              >
                <td className="p-4">{resource.name}</td>
                <td className="p-4">{resource.description}</td>
                <td className="p-4">{resource.organization}</td>
                <td className="p-4">
                  {resource.supervisors.map((supervisor) => (
                    <span key={supervisor._id} className="block">
                      {supervisor.name}
                    </span>
                  ))}
                </td>
                <td className="p-4">{resource.section}</td>
                <td className="p-4 text-center space-x-2">
                  <button
                    onClick={() => openUpdateModal(resource)}
                    className="text-blue-600 hover:text-blue-800 transition"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => setResourceToDelete(resource)}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {resourceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the resource{" "}
              <span className="font-semibold">{resourceToDelete.name}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResourceToDelete(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(resourceToDelete._id)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Resource Modal */}
      {resourceToUpdate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setResourceToUpdate(null)
          } // Close modal on outside click
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-[80%] max-w-4xl relative">
            {/* Close Icon */}
            <button
              onClick={() => setResourceToUpdate(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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

            <h3 className="text-xl font-bold mb-4">Update Resource</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              {/* Name and Description in a grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                    rows={3} // Limit the height of the textarea
                  />
                </div>
              </div>

              {/* Organization and Section in a grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Organization
                  </label>
                  <select
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="CSC">CSC</option>
                    <option value="GHP">GHP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Section
                  </label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select a section</option>
                    {sectionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="newSection"
                    value={formData.newSection}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md mt-2"
                    placeholder="Or create a new section"
                  />
                </div>
              </div>

              {/* SLA Time and Supervisors in a grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    SLA Time (in minutes)
                  </label>
                  <input
                    type="number"
                    name="slaTime"
                    value={formData.slaTime}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    min="1"
                    max="10080"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Supervisors
                  </label>
                  <Select
                    isMulti
                    options={supervisorOptions}
                    value={supervisorOptions.filter((option) =>
                      formData.supervisors.includes(option.value)
                    )}
                    onChange={handleSupervisorChange}
                    className="w-full"
                    placeholder="Select supervisors..."
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResourceToUpdate(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCSVUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">Upload Resources via CSV</h3>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCSVUploadModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceList;