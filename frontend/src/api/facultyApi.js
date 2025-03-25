import axios from "axios";

const token = localStorage.getItem("token");

// Fetch resources
export const getResources = async () => {
  const { data } = await axios.get("http://localhost:5000/api/resources", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

// Submit a new request
export const submitRequest = async (requestData) => {
  if (!token) {
    throw new Error("No authentication token found");
  }
  const { data } = await axios.post("http://localhost:5000/api/requests", requestData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

// Resubmit a request
export const resubmitRequest = async ({ requestId, ...requestData }) => {
  const { data } = await axios.put(
    `http://localhost:5000/api/requests/${requestId}/resubmit`,
    requestData,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

// Fetch faculty requests
export const getFacultyRequests = async (filters) => {
  const { data } = await axios.get("http://localhost:5000/api/requests/my-requests", {
    headers: { Authorization: `Bearer ${token}` },
    params: filters,
  });
  return data;
};

// Delete a request
export const deleteRequest = async (requestId) => {
  if (!token) {
    throw new Error("No authentication token found");
  }
  const { data } = await axios.delete(`http://localhost:5000/api/requests/${requestId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

// Fetch booking history
export const getBookingHistory = async () => {
  const { data } = await axios.get("http://localhost:5000/api/requests/booking-history", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

// Fetch notifications
export const getNotifications = async () => {
  const { data } = await axios.get("http://localhost:5000/api/notifications", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};