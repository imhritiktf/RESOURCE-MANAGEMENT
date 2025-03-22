const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  organization: { type: String, enum: ["CSC", "GHP"], required: true },
  supervisors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  section: { type: String, required: true },
  availability: { type: Boolean, default: true },
  slaTime: { type: Number, default: 2880 }, // Default SLA time in minutes (48 hours)
});

module.exports = mongoose.model("Resource", resourceSchema);
