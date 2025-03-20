import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import Select from "react-select"; // For dropdown

const CreateResourceModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    organization: "", // Organization will be auto-filled
    supervisors: [], // Array of supervisor IDs
    section: "", // New field for section
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

  // Add resource mutation
  const addResourceMutation = useMutation({
    mutationFn: async (newResource) => {
      const token = localStorage.getItem("token");
      const { data } = await axios.post("http://localhost:5000/api/resources", newResource, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data; // Return the response data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["resources"] }); // Refresh the list
      toast.success(data.message || "Resource created successfully"); // Use backend message
      onClose(); // Close the modal
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add resource"); // Use backend error message
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate the number of supervisors before submitting
    if (formData.supervisors.length < 1 || formData.supervisors.length > 2) {
      toast.error("Please select 1 or 2 supervisors.");
      return;
    }

    // Validate the section field
    if (!formData.section) {
      toast.error("Please select a section.");
      return;
    }

    addResourceMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle supervisor selection
  const handleSupervisorChange = (selectedOptions) => {
    // Restrict the selection to a maximum of 2 supervisors
    if (selectedOptions.length > 2) {
      toast.error("You can only select up to 2 supervisors.");
      return;
    }

    const selectedSupervisors = selectedOptions.map((option) => option.value);

    // Automatically set the organization based on the first selected supervisor
    if (selectedSupervisors.length > 0) {
      const firstSupervisor = supervisors.find(
        (supervisor) => supervisor._id === selectedSupervisors[0]
      );
      setFormData({
        ...formData,
        supervisors: selectedSupervisors,
        organization: firstSupervisor?.organization || "", // Set organization
      });
    } else {
      setFormData({
        ...formData,
        supervisors: [],
        organization: "", // Clear organization if no supervisors are selected
      });
    }
  };

  // Format supervisors for the dropdown
  const supervisorOptions = supervisors.map((supervisor) => ({
    value: supervisor._id,
    label: supervisor.name,
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Add Resource</h2>
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          {/* Organization (auto-filled) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Organization</label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              className="w-full p-2 border rounded-md bg-gray-100"
              readOnly // Make the field read-only
            />
          </div>

          {/* Section */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Section</label>
            <select
              name="section"
              value={formData.section}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select a section</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Plant and Machinery">Plant and Machinery</option>
              <option value="Cleaning">Cleaning</option>
              {/* Add more sections as needed */}
            </select>
          </div>

          {/* Supervisors Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Supervisors</label>
            <Select
              isMulti
              options={supervisorOptions}
              onChange={handleSupervisorChange}
              className="w-full"
              placeholder="Select supervisors..."
              value={supervisorOptions.filter((option) =>
                formData.supervisors.includes(option.value)
              )}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#ef7f1a] text-white px-4 py-2 rounded-md hover:bg-[#ffa64d]"
            >
              Add Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateResourceModal;