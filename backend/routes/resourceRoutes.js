const express = require("express");
const { createResource, getResources, deleteResource, uploadResourcesCSV, updateResource, getSections, getResourceUsage, getbookingUsage, getResourceUtlization, getFacultyUsage } = require("../controllers/resourceController");
const { protect, isTrustee } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", protect, isTrustee, createResource); // Only admin can add resources
router.get("/", protect, getResources); // All authenticated users can view resources
router.delete("/:id", protect, isTrustee, deleteResource); // Only admin can delete resources
router.post("/upload-resources-csv", protect, isTrustee, upload.single("file"), uploadResourcesCSV); //for bulk upload resource
router.put("/:id", updateResource);
router.get("/sections", getSections);
router.get("/resource-usage", protect, isTrustee, getResourceUsage); // Only admin can view resource usage
router.get("/booking-trends", protect, isTrustee, getbookingUsage) //only admin can Fetch booking trends (daily, weekly, monthly)
router.get("/resource-utilization", protect, isTrustee, getResourceUtlization)
router.get("/faculty-usage", protect, isTrustee, getFacultyUsage) //only admin can fetch faculty usage of rsources
module.exports = router;
