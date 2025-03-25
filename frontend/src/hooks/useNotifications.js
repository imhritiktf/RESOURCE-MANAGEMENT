import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "../api/facultyApi";

const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });
};

export default useNotifications;