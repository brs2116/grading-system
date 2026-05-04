const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.use(protect);
router.use(adminOnly);

// Get all students
router.get("/students", async (req, res) => {
  try {
    const [students] = await db.query(
      "SELECT id, student_id, name, email, role, created_at FROM users WHERE role = 'student'",
    );
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students" });
  }
});

// Get all courses
router.get("/courses", async (req, res) => {
  try {
    const [courses] = await db.query("SELECT * FROM courses");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching courses" });
  }
});

// Get all teachers
router.get("/teachers", async (req, res) => {
  try {
    const [teachers] = await db.query(
      "SELECT id, name, email FROM users WHERE role = 'teacher'",
    );
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teachers" });
  }
});

// Assign teacher to course - FIXED
router.put("/courses/:courseId/assign-teacher", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { teacher_id } = req.body;

    console.log("Received - Course ID:", courseId, "Teacher ID:", teacher_id);

    // Validate inputs
    if (!courseId || !teacher_id) {
      return res
        .status(400)
        .json({ message: "Course ID and Teacher ID are required" });
    }

    // Check if course exists
    const [course] = await db.query("SELECT id FROM courses WHERE id = ?", [
      courseId,
    ]);
    if (course.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if teacher exists
    const [teacher] = await db.query(
      "SELECT id FROM users WHERE id = ? AND role = 'teacher'",
      [teacher_id],
    );
    if (teacher.length === 0) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Update the course
    const [result] = await db.query(
      "UPDATE courses SET teacher_id = ? WHERE id = ?",
      [teacher_id, courseId],
    );

    console.log("Update result:", result);
    res.json({ message: "Teacher assigned successfully" });
  } catch (error) {
    console.error("Error in assign-teacher:", error);
    res
      .status(500)
      .json({ message: "Error assigning teacher: " + error.message });
  }
});

// Add new student
router.post("/students", async (req, res) => {
  try {
    const { student_id, name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (student_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'student')",
      [student_id, name, email, hashedPassword],
    );
    res.json({ message: "Student added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error adding student" });
  }
});

// Get all grades
router.get("/all-grades", async (req, res) => {
  try {
    const [grades] = await db.query(`
      SELECT u.name as student_name, u.student_id, c.course_code, c.course_name, 
             fg.letter_grade, fg.percentage, fg.semester, fg.year
      FROM final_grades fg
      JOIN users u ON fg.student_id = u.id
      JOIN courses c ON fg.course_id = c.id
      ORDER BY u.name, fg.year DESC
    `);
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: "Error fetching grades" });
  }
});

module.exports = router;
