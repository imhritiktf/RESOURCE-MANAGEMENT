const express = require("express");
const { check } = require("express-validator");
const { register, login, getAllUsers, getUserProfile, deleteUser, updateUser, getMe } = require("../controllers/authController");
const { protect, isTrustee } = require("../middleware/authMiddleware");

const router = express.Router();

// Register User (Faculty, Supervisor, or Trustee)
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    // check("password", "Password must be at least 6 characters").isLength({ min: 6 }),
    check("role", "Role is required").isIn(["faculty", "supervisor"]), 
  ],
  protect,
  isTrustee,
  register
);


// Login User
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  login
);

// Get All Users (Trustee Only)
router.get("/", protect, isTrustee, getAllUsers);

// Get Logged-in User Profile
router.get("/profile", protect, getUserProfile);

// Update User Role (Trustee Only)
router.put("/:id/update-user", protect, isTrustee, updateUser);

// Delete User (Trustee Only)
router.delete("/:userId", protect, isTrustee, deleteUser);
router.get("/me", protect, getMe );


module.exports = router;
