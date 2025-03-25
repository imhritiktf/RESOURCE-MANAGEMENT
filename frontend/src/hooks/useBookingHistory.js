import { useQuery } from "@tanstack/react-query";
import { getBookingHistory } from "../api/facultyApi";

const useBookingHistory = () => {
  return useQuery({
    queryKey: ["bookingHistory"],
    queryFn: getBookingHistory,
  });
};

export default useBookingHistory;