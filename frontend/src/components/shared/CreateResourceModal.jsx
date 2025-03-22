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
    section: "", // Selected section
    slaTime: 2880, // Default SLA time in minutes (48 hours)
    newSection: "", // New section input
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

  // Fetch sections for the dropdown (if available)
  const { data: sections = [] } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/sections", {
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
    if (!formData.section && !formData.newSection) {
      toast.error("Please select or create a section.");
      return;
    }

    // Validate SLA time
    if (formData.slaTime <= 0 || formData.slaTime > 10080) {
      toast.error("SLA time must be between 1 and 10080 minutes.");
      return;
    }

    // Prepare the final resource data
    const resourceData = {
      ...formData,
      section: formData.newSection || formData.section, // Use new section if provided
    };

    addResourceMutation.mutate(resourceData);
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

  // Format sections for the dropdown
  const sectionOptions = sections.map((section) => ({
    value: section,
    label: section,
  }));

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      onClick={handleBackdropClick} // Close modal on outside click
    >
      <div className="bg-white p-6 rounded-lg shadow-lg w-[80%] max-w-4xl relative">
        {/* Close Icon */}
        <button
          onClick={onClose}
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

        <h2 className="text-xl font-bold mb-4">Add Resource</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name and Description in a grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
                rows={3} // Limit the height of the textarea
              />
            </div>
          </div>

          {/* Organization and Section in a grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Section</label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
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
                onChange={handleChange}
                className="w-full p-2 border rounded-md mt-2"
                placeholder="Or create a new section"
              />
            </div>
          </div>

          {/* SLA Time and Supervisors in a grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SLA Time (in minutes)</label>
              <input
                type="number"
                name="slaTime"
                value={formData.slaTime}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                min="1"
                max="10080"
                required
              />
            </div>
            <div>
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