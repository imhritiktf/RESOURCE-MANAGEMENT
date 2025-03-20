const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  resource: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
  organization: { type: String, enum: ["CSC", "GHP"], required: true }, 
  eventDetails: { type: String, required: true },
  requestedDate: { type: Date, required: true, index: true },
  durationDays: { type: Number, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  priority: { type: String, enum: ["normal", "urgent"], default: "normal" },
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now, index: -1 },

  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Who approved/rejected
  approvalTime: { type: Date }, // When was it approved/rejected

  //  SLA breach tracking
  slaBreached: {
    isBreached: { type: Boolean, default: false }, // Whether SLA is breached
    breachedAt: { type: Date }, // When the SLA was breached
    reason: { type: String, enum: ["eventDatePassed", "48HoursExceeded"] }, // Reason for breach
    resolved: { type: Boolean, default: false }, // Whether the breach has been resolved
    resolvedAt: { type: Date }, // When the breach was resolved
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Who resolved the breach
  },

  // suspicious activity tracking
  suspiciousActivity: [
    {
      type: { type: String, enum: ["tooFast", "tooLate"], required: true }, // Type of suspicious activity
      detectedAt: { type: Date, default: Date.now }, // When the activity was detected
      details: { type: String }, // Additional details (example approved within a 10 sex)
    },
  ],

  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Indexes
requestSchema.index({ createdAt: -1, status: 1 });
requestSchema.index({ priority: 1 });
requestSchema.index({ approvedBy: 1 });
requestSchema.index({ approvedBy: 1 }, { sparse: true });

module.exports = mongoose.model("Request", requestSchema);