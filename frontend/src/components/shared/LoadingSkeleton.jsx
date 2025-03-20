const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {/* Skeleton for Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-200 h-10 rounded-md"></div>
        <div className="bg-gray-200 h-10 rounded-md"></div>
        <div className="bg-gray-200 h-10 rounded-md"></div>
      </div>
  
      {/* Skeleton for Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-200 h-24 rounded-lg"></div>
        <div className="bg-gray-200 h-24 rounded-lg"></div>
        <div className="bg-gray-200 h-24 rounded-lg"></div>
      </div>
  
      {/* Skeleton for SLA Breach Logs */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="bg-gray-200 h-8 w-1/3 mb-4 rounded-md"></div>
        <div className="space-y-2">
          <div className="bg-gray-200 h-6 w-full rounded-md"></div>
          <div className="bg-gray-200 h-6 w-full rounded-md"></div>
          <div className="bg-gray-200 h-6 w-full rounded-md"></div>
          <div className="bg-gray-200 h-6 w-full rounded-md"></div>
        </div>
      </div>
  
      {/* Skeleton for SLA Breach Trends */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="bg-gray-200 h-8 w-1/3 mb-4 rounded-md"></div>
        <div className="bg-gray-200 h-64 rounded-md"></div>
      </div>
    </div>
  );

  export default LoadingSkeleton;