import { FaUserEdit, FaTrash } from "react-icons/fa";

const UserTable = ({ users, resources, onEdit, onDelete, searchQuery }) => {
  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Identification Section */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Color Identification</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-100 rounded-full"></span>
            <span className="text-sm text-gray-700">Faculty (Department)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-100 rounded-full"></span>
            <span className="text-sm text-gray-700">Supervisor (Resources)</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#ef7f1a] text-white">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Organization</th>
              <th className="p-4">Department / Resources</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user._id}
                className={`border-b hover:bg-gray-50 ${
                  user.role === "supervisor" ? "bg-green-50" : "bg-blue-50"
                }`}
              >
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user.organization}</td>

                {/* Show Department for Faculty, Show Resource Names for Supervisors */}
                <td className="p-4">
                  {user.role === "supervisor"
                    ? user.assignedResources
                        .map((resourceId) => {
                          const resource = resources.find((r) => r._id === resourceId);
                          return resource ? resource.name : "Unknown Resource";
                        })
                        .join(", ")
                    : user.department}
                </td>

                <td className="p-4 capitalize">{user.role}</td>
                <td className="p-4 flex justify-center gap-3">
                  <button
                    onClick={() => onEdit(user)}
                    className="text-blue-600 hover:text-blue-800 transition"
                  >
                    <FaUserEdit />
                  </button>
                  <button
                    onClick={() => onDelete(user._id)}
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
    </div>
  );
};

export default UserTable;