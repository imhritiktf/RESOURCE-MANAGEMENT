const mongoose = require("mongoose");

const approvalLogSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
    required: true,
  },
  actionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Changed to optional for system actions
  },
  action: {
    type: String,
    enum: ["approved", "rejected"],
    required: true,
    index: true,
  },
  reason: String,
  timestamp: { type: Date, default: Date.now, index: -1 },
});

approvalLogSchema.index({ timestamp: -1, action: 1 });

module.exports = mongoose.model("ApprovalLog", approvalLogSchema);