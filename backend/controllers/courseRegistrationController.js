const db = require("../config/db");

// Get all courses in student's department (all available, not just registered)
const getDepartmentCourses = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get all courses (temporary fix)
    const [courses] = await db.query(
      `SELECT * FROM courses WHERE is_available = 1`,
    );

    console.log("Courses found:", courses.length);
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching courses" });
  }
};

// Get all departments (for admin to manage)
const getAllDepartments = async (req, res) => {
  try {
    const [departments] = await db.query(
      "SELECT DISTINCT department FROM courses WHERE department IS NOT NULL",
    );
    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching departments" });
  }
};

// Get student's enrolled courses
const getMyEnrolledCourses = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [courses] = await db.query(
      `SELECT c.*, ce.enrollment_date, ce.status
             FROM course_enrollments ce
             JOIN courses c ON ce.course_id = c.id
             WHERE ce.student_id = ?
             ORDER BY ce.enrollment_date DESC`,
      [studentId],
    );

    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching enrolled courses" });
  }
};

// Register for a course
const registerForCourse = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;

    // Check if already enrolled
    const [existing] = await db.query(
      "SELECT id FROM course_enrollments WHERE student_id = ? AND course_id = ?",
      [studentId, courseId],
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "Already registered for this course" });
    }

    // Register student
    await db.query(
      "INSERT INTO course_enrollments (student_id, course_id, status) VALUES (?, ?, 'approved')",
      [studentId, courseId],
    );

    res.json({ message: "Successfully registered for course!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error registering for course" });
  }
};

// Drop a course
const dropCourse = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;

    await db.query(
      "DELETE FROM course_enrollments WHERE student_id = ? AND course_id = ?",
      [studentId, courseId],
    );

    res.json({ message: "Course dropped successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error dropping course" });
  }
};

module.exports = {
  getDepartmentCourses,
  getMyEnrolledCourses,
  registerForCourse,
  dropCourse,
  getAllDepartments,
};
