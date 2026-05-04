const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Login function
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, student_id: user.student_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ message: "Login successful", token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, student_id, name, email, role, department_id FROM users WHERE id = ?",
      [req.user.id],
    );
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Student self-registration (ONLY ONE - with department)
// Student self-registration with auto-enrollment
const registerStudent = async (req, res) => {
    try {
        const { student_id, name, email, password, department_id } = req.body;

        // Validate input
        if (!student_id || !name || !email || !password || !department_id) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if student_id already exists
        const [existingStudent] = await db.query(
            "SELECT id FROM users WHERE student_id = ?",
            [student_id]
        );

        if (existingStudent.length > 0) {
            return res.status(400).json({ message: "Student ID already exists" });
        }

        // Check if email already exists
        const [existingEmail] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingEmail.length > 0) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Check if department exists
        const [department] = await db.query(
            "SELECT id FROM departments WHERE id = ?",
            [department_id]
        );

        if (department.length === 0) {
            return res.status(400).json({ message: "Invalid department selected" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new student
        const [result] = await db.query(
            `INSERT INTO users (student_id, name, email, password_hash, role, department_id) 
             VALUES (?, ?, ?, ?, 'student', ?)`,
            [student_id, name, email, hashedPassword, department_id]
        );

        const newStudentId = result.insertId;

        // AUTO-ENROLL: Get all courses in this department
        const [departmentCourses] = await db.query(
            "SELECT id FROM courses WHERE department_id = ?",
            [department_id]
        );

        // Enroll student in all department courses
        for (const course of departmentCourses) {
            await db.query(
                `INSERT IGNORE INTO course_enrollments (student_id, course_id, status) 
                 VALUES (?, ?, 'enrolled')`,
                [newStudentId, course.id]
            );
        }

        res.status(201).json({ 
            message: `Student registered and enrolled in ${departmentCourses.length} courses!`,
            studentId: newStudentId,
            enrolledCourses: departmentCourses.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during registration" });
    }
};

module.exports = { login, getCurrentUser, registerStudent };
