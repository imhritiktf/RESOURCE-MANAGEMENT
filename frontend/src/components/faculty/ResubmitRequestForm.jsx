import React from "react";
import { useForm } from "react-hook-form";
import useResubmitRequest from "../../hooks/useResubmitRequest";

const ResubmitRequestForm = ({ request }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { mutate: resubmitRequest, isLoading } = useResubmitRequest();

  const onSubmit = (data) => {
    resubmitRequest({ requestId: request._id, ...data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Resource</label>
        <input
          type="text"
          defaultValue={request.resource.name}
          disabled
        />
      </div>
      <div>
        <label>Event Details</label>
        <textarea
          {...register("eventDetails", { required: true })}
          defaultValue={request.eventDetails}
        />
        {errors.eventDetails && <span>This field is required</span>}
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Resubmitting..." : "Resubmit"}
      </button>
    </form>
  );
};

export default ResubmitRequestForm;