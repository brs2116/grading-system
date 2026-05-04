const db = require("../config/db");

// Get courses taught by this teacher (only their assigned courses)
const getMyCourses = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const [courses] = await db.query(
      `SELECT * FROM courses WHERE teacher_id = ?`,
      [teacherId],
    );

    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching courses" });
  }
};

// Get students enrolled in a specific course
const getCourseStudents = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const [students] = await db.query(
      `SELECT 
                u.id, u.student_id, u.name, u.email,
                COALESCE(fg.letter_grade, '') as letter_grade,
                COALESCE(fg.percentage, 0) as percentage,
                COALESCE(fg.gpa_points, 0) as gpa_points
             FROM users u
             LEFT JOIN final_grades fg ON u.id = fg.student_id AND fg.course_id = ?
             WHERE u.role = 'student'
             ORDER BY u.name`,
      [courseId],
    );

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching students" });
  }
};

// Update grade for a student
const updateGrade = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const { letter_grade, percentage, gpa_points, semester, year } = req.body;

    // Check if grade exists
    const [existing] = await db.query(
      "SELECT id FROM final_grades WHERE student_id = ? AND course_id = ? AND semester = ? AND year = ?",
      [studentId, courseId, semester, year],
    );

    if (existing.length > 0) {
      // Update existing grade
      await db.query(
        `UPDATE final_grades 
                 SET letter_grade = ?, percentage = ?, gpa_points = ?
                 WHERE student_id = ? AND course_id = ? AND semester = ? AND year = ?`,
        [
          letter_grade,
          percentage,
          gpa_points,
          studentId,
          courseId,
          semester,
          year,
        ],
      );
    } else {
      // Insert new grade
      await db.query(
        `INSERT INTO final_grades (student_id, course_id, letter_grade, percentage, gpa_points, semester, year)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          studentId,
          courseId,
          letter_grade,
          percentage,
          gpa_points,
          semester,
          year,
        ],
      );
    }

    res.json({ message: "Grade updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating grade" });
  }
};

// Get grade breakdown for a student in a course
const getStudentGradeDetails = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    const [details] = await db.query(
      `SELECT 
                gi.id,
                gi.item_name,
                gi.item_type,
                gi.weight,
                gi.max_score,
                COALESCE(ss.score_obtained, 0) as score_obtained
             FROM grade_items gi
             LEFT JOIN student_scores ss ON gi.id = ss.grade_item_id AND ss.student_id = ?
             WHERE gi.course_id = ?
             ORDER BY gi.due_date`,
      [studentId, courseId],
    );

    res.json(details);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching grade details" });
  }
};

module.exports = {
  getMyCourses,
  getCourseStudents,
  updateGrade,
  getStudentGradeDetails,
};
