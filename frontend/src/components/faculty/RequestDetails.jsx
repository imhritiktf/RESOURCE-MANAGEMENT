import React from "react";

const RequestDetails = ({ request }) => {
  return (
    <div>
      <h2>Request Details</h2>
      <p>Resource: {request.resource.name}</p>
      <p>Requested Date: {new Date(request.requestedDate).toLocaleDateString()}</p>
      <p>Status: {request.status}</p>
      <p>Event Details: {request.eventDetails}</p>
    </div>
  );
};

export default RequestDetails;  