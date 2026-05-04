const express = require("express");
const router = express.Router();
const {
  login,
  getCurrentUser,
  registerStudent,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/login", login);
router.post("/register", registerStudent);
router.get("/me", protect, getCurrentUser);

module.exports = router;
