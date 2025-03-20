import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaTrash, FaEdit, FaUpload } from "react-icons/fa";
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
    section: "", // New field for section
  });

  // Fetch resources using TanStack Query
  const { data: resources = [], isLoading, isError } = useQuery({
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
      const { data } = await axios.get("http://localhost:5000/api/resources/sections", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.sections; // Return the sections array
    },
  });

  // Fetch supervisors for the dropdown
  const { data: supervisors = [] } = useQuery({
    queryKey: ["supervisors"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/auth?role=supervisor", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
  });

  // Delete resource mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      const { data } = await axios.delete(`http://localhost:5000/api/resources/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    updateMutation.mutate({ ...formData, _id: resourceToUpdate._id });
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
    });
  };

  // Format supervisors for the dropdown
  const supervisorOptions = supervisors.map((supervisor) => ({
    value: supervisor._id,
    label: supervisor.name,
  }));

  // Group resources by section

  if (isLoading) return <p className="text-center text-gray-600">Loading resources...</p>;
  if (isError) return <p className="text-center text-red-500">Error fetching resources</p>;

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Resource List</h2>
  
      {/* CSV Upload Button */}
      <button
        onClick={() => setShowCSVUploadModal(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mb-4"
      >
        <FaUpload className="inline-block mr-2" />
        Upload Resources via CSV
      </button>
  
      {/* Resources Table */}
      <div className="overflow-hidden rounded-lg shadow-sm">
        {sections.map((section) => (
          <div key={section} className="mb-8">
            <h3 className="text-xl font-bold mb-4 bg-gray-100 p-3 rounded-t-lg">
              {section}
            </h3>
            <table className="w-full text-left border-collapse">
              <thead className="bg-gradient-to-r from-[#ef7f1a] to-[#ffa64d] text-white">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Supervisors</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources
                  .filter((resource) => resource.section === section)
                  .map((resource) => (
                    <tr
                      key={resource._id}
                      className="border-b hover:bg-gray-50 transition-colors"
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
        ))}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">Update Resource</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Organization</label>
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select a section</option>
                  {sections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Supervisors</label>
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