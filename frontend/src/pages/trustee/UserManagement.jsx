import { useState } from "react";
import { FaSearch, FaUserPlus, FaTimes } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import UserTable from "../../components/trustee/UserTable"; // Import the new UserTable component

export default function UserManagement() {
  const token = localStorage.getItem("token");
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "faculty",
    department: "",
    assignedResources: [],
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Users
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get("http://localhost:5000/api/auth", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Fetch Resources
  const { data: resources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const res = await axios.get("http://localhost:5000/api/resources", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Add User Mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData) => {
      await axios.post("http://localhost:5000/api/auth/register", userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setIsAddModalOpen(false);
      toast.success("User added successfully!");
      setNewUser({ name: "", email: "", role: "faculty", department: "", assignedResources: [] });
    },
    onError: () => toast.error("Failed to add user!"),
  });

  // Update User Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ userId, updatedData }) => {
      await axios.put(
        `http://localhost:5000/api/auth/${userId}/update-user`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setIsEditModalOpen(false);
      toast.success("User updated successfully!");
    },
    onError: () => toast.error("Failed to update user!"),
  });

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      await axios.delete(`http://localhost:5000/api/auth/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      toast.success("User deleted successfully!");
    },
    onError: () => toast.error("Failed to delete user!"),
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">User Management</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#ef7f1a] text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FaUserPlus /> Add User
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-white p-3 rounded-lg shadow-sm mb-4">
        <FaSearch className="text-gray-500" />
        <input
          type="text"
          placeholder="Search..."
          className="ml-2 w-full outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Users Table */}
      {!isLoading && !isError && (
        <UserTable
          users={users}
          resources={resources}
          onEdit={(user) => {
            setEditingUser(user);
            setIsEditModalOpen(true);
          }}
          onDelete={(userId) => deleteMutation.mutate(userId)}
          searchQuery={searchQuery}
        />
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
    <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Edit User</h3>
        <FaTimes
          className="cursor-pointer"
          onClick={() => setIsEditModalOpen(false)}
        />
      </div>

      {/* Name */}
      <input
        type="text"
        placeholder="Name"
        className="p-2 border rounded w-full mb-3"
        value={editingUser.name}
        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
      />

      {/* Email */}
      <input
        type="email"
        placeholder="Email"
        className="p-2 border rounded w-full mb-3"
        value={editingUser.email}
        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
      />

      {/* Organization */}
      <input
        type="text"
        placeholder="Organization"
        className="p-2 border rounded w-full mb-3"
        value={editingUser.organization}
        onChange={(e) => setEditingUser({ ...editingUser, organization: e.target.value })}
      />

      {/* Role Selection */}
      <select
        className="p-2 border rounded w-full mb-3"
        value={editingUser.role}
        onChange={(e) => {
          const newRole = e.target.value;
          setEditingUser((prev) => ({
            ...prev,
            role: newRole,
            assignedResources: newRole === "supervisor" ? [] : prev.assignedResources,
            department: newRole === "supervisor" ? "" : prev.department,
          }));
        }}
      >
        <option value="faculty">Faculty</option>
        <option value="supervisor">Supervisor</option>
      </select>

      {/* Department (Hidden for Supervisors) */}
      {editingUser.role !== "supervisor" && (
        <input
          type="text"
          placeholder="Department"
          className="p-2 border rounded w-full mb-3"
          value={editingUser.department}
          onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
        />
      )}

      {/* Assigned Resources (Only Show When Role is Supervisor) */}
      {editingUser.role === "supervisor" && (
        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">Assign Resources</label>
          <select
            className="p-2 border rounded w-full"
            multiple
            value={editingUser.assignedResources}
            onChange={(e) => {
              const selectedResources = Array.from(e.target.selectedOptions, (option) => option.value);
              setEditingUser({ ...editingUser, assignedResources: selectedResources });
            }}
          >
            {resources.map((resource) => (
              <option key={resource._id} value={resource._id}>
                {resource.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Save Changes Button */}
      <button
        onClick={() => {
          if (editingUser.role === "supervisor" && editingUser.assignedResources.length === 0) {
            toast.error("Supervisors must be assigned at least one resource.");
            return;
          }

          updateMutation.mutate({
            userId: editingUser._id,
            updatedData: editingUser,
          });
        }}
        className="w-full bg-[#ef7f1a] text-white p-2 rounded mt-4"
      >
        Save Changes
      </button>
    </div>
  </div>
)}
      {/* Add User Modal */}
      {isAddModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
    <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Add User</h3>
        <FaTimes
          className="cursor-pointer"
          onClick={() => setIsAddModalOpen(false)}
        />
      </div>

      {/* Name */}
      <input
        type="text"
        placeholder="Name"
        className="p-2 border rounded w-full mb-3"
        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
      />

      {/* Email */}
      <input
        type="email"
        placeholder="Email"
        className="p-2 border rounded w-full mb-3"
        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
      />

      {/* Organization */}
      <input
        type="text"
        placeholder="Organization"
        className="p-2 border rounded w-full mb-3"
        onChange={(e) => setNewUser({ ...newUser, organization: e.target.value })}
      />

      {/* Role */}
      <select
        className="p-2 border rounded w-full mb-3"
        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
      >
        <option value="faculty">Faculty</option>
        <option value="supervisor">Supervisor</option>
      </select>

      {/* Department (Hidden for Supervisors) */}
      {newUser.role !== "supervisor" && (
        <input
          type="text"
          placeholder="Department"
          className="p-2 border rounded w-full mb-3"
          onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
        />
      )}

      {/* Resources for Supervisors */}
      {newUser.role === "supervisor" && (
        <select
          multiple
          className="p-2 border rounded w-full mb-3"
          onChange={(e) =>
            setNewUser({
              ...newUser,
              assignedResources: [...e.target.selectedOptions].map((o) => o.value),
            })
          }
        >
          {resources.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </select>
      )}

      <button
        onClick={() => addUserMutation.mutate(newUser)}
        className="w-full bg-[#ef7f1a] text-white p-2 rounded mt-4"
      >
        Add User
      </button>
    </div>
  </div>
)}
    </div>
  );
}