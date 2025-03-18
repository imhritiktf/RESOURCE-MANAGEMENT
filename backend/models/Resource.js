const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organization: { type: String, enum: ["CSC", "GHP"], required: true }, // New field
  supervisors: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ], // Ensure two supervisors
  description: { type: String },
  availability: { type: Boolean, default: true }, // New field for availability
});

module.exports = mongoose.model("Resource", resourceSchema);
