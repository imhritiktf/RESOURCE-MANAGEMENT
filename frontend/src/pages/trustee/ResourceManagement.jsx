import { useState } from "react";
import CreateResourceModal from "../../components/shared/CreateResourceModal";
import ResourceList from "../../components/shared/ResourceList";

const ResourceManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Resource Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
        >
          Add Resource
        </button>
      </div>

      {/* Resource List */}
      <ResourceList />

      {/* Create Resource Modal */}
      {isModalOpen && <CreateResourceModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default ResourceManagement;