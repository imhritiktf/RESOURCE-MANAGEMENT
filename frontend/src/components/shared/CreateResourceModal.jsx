import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import Select from "react-select";

const CreateResourceModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    organization: "",
    supervisors: [],
    section: "",
    slaTime: 2880,
    newSection: "",
  });

  // Fetch all supervisors (we'll filter them based on organization)
  const { data: allSupervisors = [] } = useQuery({
    queryKey: ["supervisors"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/auth?role=supervisor", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
  });
  const organizations = allSupervisors.reduce((acc, supervisor) => {
    const org = supervisor.organization?.name || supervisor.organization;
    if (org && !acc.includes(org)) {
      acc.push(org);
    }
    return acc;
  }, []);

  // Fetch sections
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

  // Filter supervisors based on selected organization
  const filteredSupervisors = allSupervisors.filter(
    (supervisor) => supervisor.organization === formData.organization
  );

  const supervisorOptions = filteredSupervisors.map((supervisor) => ({
    value: supervisor._id,
    label: `${supervisor.name} (${supervisor.organization})`,
  }));

  const sectionOptions = sections.map((section) => ({
    value: section,
    label: section,
  }));

  const addResourceMutation = useMutation({
    mutationFn: async (newResource) => {
      const token = localStorage.getItem("token");
      const { data } = await axios.post("http://localhost:5000/api/resources", newResource, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success(data.message || "Resource created successfully");
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add resource");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.supervisors.length < 1 || formData.supervisors.length > 2) {
      toast.error("Please select 1 or 2 supervisors.");
      return;
    }

    if (!formData.section && !formData.newSection) {
      toast.error("Please select or create a section.");
      return;
    }

    if (formData.slaTime <= 0 || formData.slaTime > 10080) {
      toast.error("SLA time must be between 1 and 10080 minutes.");
      return;
    }

    const resourceData = {
      ...formData,
      section: formData.newSection || formData.section,
    };

    addResourceMutation.mutate(resourceData);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOrganizationChange = (e) => {
    const org = e.target.value;
    setFormData({
      ...formData,
      organization: org,
      supervisors: [], // Clear supervisors when organization changes
    });
  };

  const handleSupervisorChange = (selectedOptions) => {
    if (selectedOptions.length > 2) {
      toast.error("You can only select up to 2 supervisors.");
      return;
    }
    setFormData({
      ...formData,
      supervisors: selectedOptions.map((option) => option.value),
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center" onClick={handleBackdropClick}>
      <div className="bg-white p-6 rounded-lg shadow-lg w-[80%] max-w-4xl relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold mb-4">Add Resource</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                rows={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <select
                name="organization"
                value={formData.organization}
                onChange={handleOrganizationChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select an organization</option>
                <option value="CSC">CSC</option>
          <option value="GHP">GHP</option>
              </select>
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
                placeholder={formData.organization ? "Select supervisors..." : "First select an organization"}
                value={supervisorOptions.filter((option) =>
                  formData.supervisors.includes(option.value)
                )}
                isDisabled={!formData.organization}
                noOptionsMessage={() => formData.organization ? "No supervisors found" : "Select an organization first"}
              />
              {formData.organization && (
                <p className="text-xs text-gray-500 mt-1">
                  Showing supervisors from: {formData.organization}
                </p>
              )}
            </div>
          </div>

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