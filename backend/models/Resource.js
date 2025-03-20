const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  organization: { type: String, enum: ["CSC", "GHP"], required: true },
  supervisors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  section: { type: String, required: true }, // New field
  availability: { type: Boolean, default: true },
});

module.exports = mongoose.model("Resource", resourceSchema);
