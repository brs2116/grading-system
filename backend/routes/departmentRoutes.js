const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all departments (public - for registration)
router.get("/", async (req, res) => {
  try {
    const [departments] = await db.query(
      "SELECT id, name, code, description FROM departments ORDER BY name",
    );
    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching departments" });
  }
});

module.exports = router;
