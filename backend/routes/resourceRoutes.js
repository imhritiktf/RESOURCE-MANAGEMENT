const express = require("express");
const { createResource, getResources, deleteResource, uploadResourcesCSV, updateResource } = require("../controllers/resourceController");
const { protect, isTrustee } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", protect, isTrustee, createResource); // Only admin can add resources
router.get("/", protect, getResources); // All authenticated users can view resources
router.delete("/:id", protect, isTrustee, deleteResource); // Only admin can delete resources
router.post("/upload-resources-csv", protect, isTrustee, upload.single("file"), uploadResourcesCSV); //for bulk upload resource
router.put("/:id", updateResource);

module.exports = router;
