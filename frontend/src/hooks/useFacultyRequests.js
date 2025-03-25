import { useQuery } from "@tanstack/react-query";
import { getFacultyRequests } from "../api/facultyApi";

const useFacultyRequests = (filters) => {
  return useQuery({
    queryKey: ["facultyRequests", filters], // Include filters in the query key
    queryFn: () => getFacultyRequests(filters),
    staleTime: 0, // Data is immediately stale
    cacheTime: 0, // No caching to ensure fresh data
  });
};

export default useFacultyRequests;