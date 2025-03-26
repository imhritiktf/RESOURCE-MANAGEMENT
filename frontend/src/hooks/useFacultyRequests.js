// hooks/useFacultyRequests.js
import { useQuery } from "@tanstack/react-query";
import { getFacultyRequests } from "../api/facultyApi";
import { useAuth } from "../context/AuthContext";

const useFacultyRequests = (filters) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["facultyRequests", user?.id, filters], 
    queryFn: () => getFacultyRequests(filters),
    staleTime: 0,
    enabled: !!user?.id, 
    onError: (error) => {
      console.error("Error fetching requests:", error);
    },
    onSuccess: (data) => {
      console.log("Successfully fetched requests:", data);
    }
  });
};

export default useFacultyRequests;