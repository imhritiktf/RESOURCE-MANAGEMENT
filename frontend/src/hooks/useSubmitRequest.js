import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitRequest } from "../api/facultyApi";
import toast from "react-hot-toast";

const useSubmitRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitRequest,
    onSuccess: (data) => {
      // Invalidate the exact query key used by useFacultyRequests
      queryClient.invalidateQueries({ queryKey: ["facultyRequests"] });
      toast.success(data.message || "Request submitted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit request");
    },
  });
};

export default useSubmitRequest;