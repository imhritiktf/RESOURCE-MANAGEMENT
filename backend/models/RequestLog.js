const mongoose = require("mongoose");

const requestLogSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Request",
    required: true,
  },
  action: {
    type: String,
    enum: ["approved", "rejected"],
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("RequestLog", requestLogSchema);
