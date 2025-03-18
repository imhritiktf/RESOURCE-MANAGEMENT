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
  slaBreached: { type: Boolean, default: false },

  suspiciousActivity: [{ type: String, enum: ["tooFast", "tooLate"] }], // Stores suspicious actions
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User"  }
});

requestSchema.index({ createdAt: -1, status: 1 });
requestSchema.index({ priority: 1 });
requestSchema.index({ approvedBy: 1 });
requestSchema.index({ approvedBy: 1 }, { sparse: true });




module.exports = mongoose.model("Request", requestSchema);
