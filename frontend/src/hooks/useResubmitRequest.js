import { useMutation } from "@tanstack/react-query";
import { resubmitRequest } from "../api/facultyApi";

const useResubmitRequest = () => {
  return useMutation({
    mutationFn: resubmitRequest,
    onSuccess: () => {
      // Invalidate the faculty requests query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["facultyRequests"] });
    },
  });
};

export default useResubmitRequest;