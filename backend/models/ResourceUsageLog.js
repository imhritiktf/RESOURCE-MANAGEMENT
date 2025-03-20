const mongoose = require("mongoose");

const resourceUsageLogSchema = new mongoose.Schema({
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resource",
    required: true,
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  organization: {
    type: String,
    enum: ["CSC", "GHP"],
    required: true,
  },
  bookingStart: {
    type: Date,
    required: true,
  },
  bookingEnd: {
    type: Date,
    required: true,
  },
  durationDays: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ResourceUsageLog", resourceUsageLogSchema);