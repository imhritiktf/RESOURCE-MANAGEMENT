const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const User = require("../models/User");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.SECRET_KEY, { expiresIn: "7d" });
};

exports.register = async (req, res) => {
  try {
    console.log("Incoming Request: /register");
    console.log("Logged-in User:", req.user);
    console.log("Received Body:", req.body);

    // ✅ Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation Errors:", errors.array());
      return res.status(400).json({ errors: errors.array() }); // ✅ Ensure response is sent
    }

    const { name, email, role, department, assignedResources } = req.body;
    const requester = req.user;

    // ✅ Prevent infinite loop (Trustees should not be added here)
    if (requester.role !== "trustee") {
      console.log("❌ Access Denied: Only trustees can add users.");
      return res
        .status(403)
        .json({ message: "Access denied. Only trustees can add users." });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ User Already Exists:", email);
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    // ✅ Hash default password
    const defaultPassword = "password123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // ✅ Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department: role === "faculty" ? department : null,
      assignedResources: role === "supervisor" ? assignedResources : [],
    });

    await newUser.save();
    console.log("✅ User Added Successfully:", newUser);

    // ✅ Send success response (Prevents infinite loop)
    return res.status(201).json({
      message: `${role} added successfully. Default password is 'password123'.`,
      user: {
        id: newUser._id,
        role: newUser.role,
        email: newUser.email,
        name: newUser.name,
        department: newUser.department,
      },
    });
  } catch (error) {
    console.error("🔥 Server Error:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        role: user.role,
        email: user.email,
        name: user.name,
        department: user.department,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
exports.getUserProfile = async (req, res) => {
  try {
    res.status(200).json({
      message: "User Profile Retrieved",
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// onnly for admin to change or manage the roles of users
exports.updateUser = async (req, res) => {
  try {
    const { name, email, department, role, assignedResources } = req.body;
    const validRoles = ["faculty", "supervisor"];

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent updating trustee role
    if (user.role === "trustee") {
      return res.status(403).json({ message: "Cannot update a trustee" });
    }

    // Apply updates
    if (name) user.name = name;
    if (email) user.email = email;
    if (department) user.department = department;
    if (role) {
      if (user.role === "supervisor" && role === "faculty") {
        user.assignedResources = []; // Remove resources if demoted to faculty
      }
      if (user.role === "faculty" && role === "supervisor") {
        if (!assignedResources || assignedResources.length === 0) {
          return res
            .status(400)
            .json({ message: "Supervisors must be assigned at least one resource." });
        }
        user.assignedResources = assignedResources; // Assign resources
      }
      user.role = role;
    }

    await user.save();
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all users (with optional role filter)
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query; // Get role from query params
    let query = {};

    // Add role filter if provided
    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select("-password"); // Exclude passwords
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
