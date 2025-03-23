const express = require("express");
const {
  createRequest,
  getRequests,
  getFacultyRequests,
  updateRequestStatus,
  getSuspiciousRequests,
  deleteRequest,
  getRequestLog,
  getRequestLogByRequestId,
  getSlaBreachedRequests,
  resolveSLABreach,
  getSLAMetrics,
  getRequestCountByStatus,
  } = require("../controllers/requestController");
const {
  protect,
  isSupervisorOrTrustee,
  isTrustee,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createRequest); // Faculty can create requests
router.get("/", protect, isSupervisorOrTrustee, getRequests);

router.get("/my-requests", protect, getFacultyRequests); // Faculty can view their own requests
router.put("/:id/status", protect, isSupervisorOrTrustee, updateRequestStatus); // Supervisors can approve/reject requests
router.delete("/:id", protect, deleteRequest); // Faculty can delete pending requests
router.get("/logs", protect, getRequestLog); 
router.get("/count", protect, isSupervisorOrTrustee, getRequestCountByStatus);
router.get(
  "/logs/:requestId",
  protect,
  isSupervisorOrTrustee,
  getRequestLogByRequestId
);
router.get("/sla-breached", protect, isTrustee, getSlaBreachedRequests);
router.get("/suspicious-activities", protect, isTrustee, getSuspiciousRequests);
router.get("/sla-metrics", protect, isTrustee, getSLAMetrics);

module.exports = router;
