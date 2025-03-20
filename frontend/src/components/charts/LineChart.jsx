import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const fetchBookingTrends = async ({ organization, startDate, endDate, interval }) => {
  const response = await axios.get("/api/logs/booking-trends", {
    params: { organization, startDate, endDate, interval },
  });
  return response.data;
};

const useBookingTrends = (filters) => {
  return useQuery({
    queryKey: ["bookingTrends", filters],
    queryFn: () => fetchBookingTrends(filters),
  });
};

const BookingTrendsChart = ({ filters }) => {
  const { data, isLoading, isError } = useBookingTrends(filters);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching data</div>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="_id" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="totalBookings" stroke="#3b82f6" />
      </LineChart>
    </ResponsiveContainer>
  );
};