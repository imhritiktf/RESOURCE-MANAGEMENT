import { useQuery } from "@tanstack/react-query";
import { getResources } from "../api/facultyApi";

const useResources = () => {
  return useQuery({
    queryKey: ["resources"],
    queryFn: getResources,
  });
};

export default useResources;