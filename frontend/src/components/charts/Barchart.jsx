const fetchResourceUtilization = async ({ organization, startDate, endDate }) => {
    const response = await axios.get("/api/logs/resource-utilization", {
      params: { organization, startDate, endDate },
    });
    return response.data;
  };
  
  const useResourceUtilization = (filters) => {
    return useQuery({
      queryKey: ["resourceUtilization", filters],
      queryFn: () => fetchResourceUtilization(filters),
    });
  };
  
  const ResourceUtilizationChart = ({ filters }) => {
    const { data, isLoading, isError } = useResourceUtilization(filters);
  
    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error fetching data</div>;
  
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="resourceName" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="utilizationRate" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    );
  };    