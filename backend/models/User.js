const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["faculty", "supervisor", "trustee"],
    required: true,
  },
  organization: { type: String, enum: ["CSC", "GHP"], required: true }, // ✅ Added this field
  department: String, // Only for faculty members
  assignedResources: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Resource" },
  ],
});

module.exports = mongoose.model("User", userSchema);
