const multer = require("multer");
const path = require("path");

// Set up Multer storage (temporary storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
