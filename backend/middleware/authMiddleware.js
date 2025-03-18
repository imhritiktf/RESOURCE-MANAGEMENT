const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      let decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user = await User.findById(decoded.id).select("-password");


      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Populate assignedResources only for supervisors
      if (user.role === "supervisor") {
        user = await user.populate("assignedResources", "name organization");
      }

      req.user = user;
      next();
    } catch (error) { 
      return res.status(401).json({ message: "Invalid token", error: error.message });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied! Only admins can perform this action." });
  }
};

exports.isTrustee = (req, res, next) => {
  if (req.user.role !== "trustee") {
    return res.status(403).json({ message: "Access denied! Only Trustees can perform this action." });
  }
  next();
};

exports.isSupervisorOrTrustee = (req, res, next) => {
  if (req.user.role === "supervisor" || req.user.role === "trustee") {
    next();
  } else {
    res.status(403).json({ message: "Access denied! Only supervisors or trustees can approve requests." });
  }
};
