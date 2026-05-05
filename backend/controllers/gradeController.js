const db = require("../config/db");
const PDFGenerator = require("../utils/pdfGenerator");

// Helper function to calculate letter grade
function calculateLetterGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 85) return "A-";
  if (percentage >= 80) return "B+";
  if (percentage >= 75) return "B";
  if (percentage >= 70) return "B-";
  if (percentage >= 65) return "C+";
  if (percentage >= 60) return "C";
  if (percentage >= 55) return "C-";
  if (percentage >= 50) return "D+";
  if (percentage >= 45) return "D";
  return "F";
}

// Get all grades for a student (with optional semester filter)
// Get all grades for a student (show ALL enrolled courses, even without grades)
const getStudentGrades = async (req, res) => {
  try {
    const studentId = req.user.id;
    const semester = req.query.semester;
    const year = req.query.year;

    // Get ALL courses the student is enrolled in (from course_enrollments)
    let query = `
            SELECT 
                c.id as course_id,
                c.course_code,
                c.course_name,
                c.credits,
                COALESCE(fg.letter_grade, 'Not Graded') as letter_grade,
                COALESCE(fg.percentage, 0) as percentage,
                COALESCE(fg.gpa_points, 0) as gpa_points,
                COALESCE(fg.semester, 'Current') as semester,
                COALESCE(fg.year, YEAR(CURDATE())) as year
            FROM course_enrollments ce
            JOIN courses c ON ce.course_id = c.id
            LEFT JOIN final_grades fg ON c.id = fg.course_id AND fg.student_id = ce.student_id
            WHERE ce.student_id = ?
        `;

    const queryParams = [studentId];

    if (semester && semester !== "all") {
      query += ` AND COALESCE(fg.semester, 'Current') = ?`;
      queryParams.push(semester);
    }

    if (year && year !== "all") {
      query += ` AND COALESCE(fg.year, YEAR(CURDATE())) = ?`;
      queryParams.push(year);
    }

    query += ` ORDER BY c.course_code`;

    const [grades] = await db.query(query, queryParams);

    // Get available semesters from final_grades
    const [semesters] = await db.query(
      `SELECT DISTINCT semester, year 
             FROM final_grades 
             WHERE student_id = ?
             UNION
             SELECT 'Current' as semester, YEAR(CURDATE()) as year`,
      [studentId],
    );

    res.json({
      grades: grades,
      filters: {
        semesters: semesters,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching grades" });
  }
};

// Get GPA summary (current semester and cumulative)
// Get GPA summary (only from graded courses)
const getGPASummary = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get current semester GPA (only from graded courses)
    const [currentGPA] = await db.query(
      `SELECT 
                COALESCE(fg.semester, 'Current') as semester,
                COALESCE(fg.year, YEAR(CURDATE())) as year,
                ROUND(AVG(fg.gpa_points), 2) as semester_gpa,
                SUM(c.credits) as total_credits,
                COUNT(fg.id) as graded_courses
            FROM course_enrollments ce
            JOIN courses c ON ce.course_id = c.id
            LEFT JOIN final_grades fg ON c.id = fg.course_id AND fg.student_id = ce.student_id
            WHERE ce.student_id = ? AND fg.id IS NOT NULL
            GROUP BY fg.semester, fg.year
            ORDER BY year DESC, semester DESC
            LIMIT 1`,
      [studentId],
    );

    // Get cumulative GPA (only from graded courses)
    const [cumulative] = await db.query(
      `SELECT 
                ROUND(AVG(fg.gpa_points), 2) as cumulative_gpa,
                COUNT(DISTINCT c.id) as total_courses,
                SUM(c.credits) as total_credits,
                COUNT(fg.id) as graded_courses
            FROM course_enrollments ce
            JOIN courses c ON ce.course_id = c.id
            LEFT JOIN final_grades fg ON c.id = fg.course_id AND fg.student_id = ce.student_id
            WHERE ce.student_id = ?`,
      [studentId],
    );

    // Get total enrolled courses count
    const [totalEnrolled] = await db.query(
      `SELECT COUNT(*) as total FROM course_enrollments WHERE student_id = ?`,
      [studentId],
    );

    res.json({
      current_semester: currentGPA[0] || null,
      cumulative: cumulative[0] || {
        cumulative_gpa: 0,
        total_courses: totalEnrolled[0]?.total || 0,
        total_credits: 0,
        graded_courses: 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching GPA" });
  }
};
// Get filtered GPA summary (for semester/year filters)
const getFilteredGPASummary = async (req, res) => {
  try {
    const studentId = req.user.id;
    const semester = req.query.semester;
    const year = req.query.year;

    let query = `
      SELECT 
        ROUND(AVG(gpa_points), 2) as filtered_gpa,
        COUNT(*) as total_courses,
        SUM(credits) as total_credits
      FROM final_grades fg
      JOIN courses c ON fg.course_id = c.id
      WHERE fg.student_id = ?
    `;

    const queryParams = [studentId];

    if (semester && semester !== "all") {
      query += ` AND fg.semester = ?`;
      queryParams.push(semester);
    }

    if (year && year !== "all") {
      query += ` AND fg.year = ?`;
      queryParams.push(year);
    }

    const [filtered] = await db.query(query, queryParams);

    // Get overall cumulative GPA (no filters)
    const [cumulative] = await db.query(
      `SELECT 
        ROUND(AVG(gpa_points), 2) as cumulative_gpa,
        COUNT(*) as total_courses,
        SUM(credits) as total_credits
      FROM final_grades fg
      JOIN courses c ON fg.course_id = c.id
      WHERE fg.student_id = ?`,
      [studentId],
    );

    res.json({
      filtered: filtered[0] || {
        filtered_gpa: 0,
        total_courses: 0,
        total_credits: 0,
      },
      cumulative: cumulative[0] || {
        cumulative_gpa: 0,
        total_courses: 0,
        total_credits: 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching filtered GPA" });
  }
};

// Get detailed grade breakdown for a specific course
const getCourseGradeDetails = async (req, res) => {
  try {
    const studentId = req.user.id;
    const courseId = req.params.courseId;

    // 1. Get course info
    const [courseInfo] = await db.query("SELECT * FROM courses WHERE id = ?", [
      courseId,
    ]);

    if (courseInfo.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 2. Get grade items (FIXED: prevent duplicates)
    const [details] = await db.query(
      `SELECT 
        gi.id,
        gi.item_name,
        gi.item_type,
        gi.weight,
        gi.max_score,
        COALESCE(MAX(ss.score_obtained), 0) as score_obtained
      FROM grade_items gi
      LEFT JOIN student_scores ss 
        ON gi.id = ss.grade_item_id 
        AND ss.student_id = ?
      WHERE gi.course_id = ?
      GROUP BY gi.id
      ORDER BY gi.due_date`,
      [studentId, courseId],
    );

    // 3. Calculate overall percentage (FIXED)
    let totalPoints = 0;

    for (const item of details) {
      if (item.max_score > 0 && item.weight > 0) {
        const percentage = item.score_obtained / item.max_score; // 0–1
        const weightedScore = percentage * item.weight; // already %
        totalPoints += weightedScore;
      }
    }

    const overallPercentage = totalPoints;

    // 4. Prepare detailed breakdown
    const enrichedDetails = details.map((item) => {
      let percentage = 0;
      let weightedScore = 0;

      if (item.max_score > 0) {
        percentage = (item.score_obtained / item.max_score) * 100;
        weightedScore = (percentage * item.weight) / 100;
      }

      return {
        id: item.id,
        item_name: item.item_name,
        item_type: item.item_type,
        weight: item.weight,
        max_score: item.max_score,
        score_obtained: item.score_obtained,
        percentage: percentage.toFixed(2),
        weighted_score: weightedScore.toFixed(2),
      };
    });

    // 5. Send response
    res.json({
      course: courseInfo[0],
      grade_breakdown: enrichedDetails,
      overall_percentage: overallPercentage.toFixed(2),
      letter_grade: calculateLetterGrade(overallPercentage),
    });
  } catch (error) {
    console.error("Error in getCourseGradeDetails:", error);
    res.status(500).json({ message: "Error fetching grade details" });
  }
};
// Export grades to PDF
const exportGradesToPDF = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student info
    const [students] = await db.query(
      "SELECT id, student_id, name, email FROM users WHERE id = ?",
      [studentId],
    );

    // Get grades
    const [grades] = await db.query(
      `SELECT 
        c.course_code,
        c.course_name,
        c.credits,
        fg.letter_grade,
        fg.percentage,
        fg.gpa_points
      FROM final_grades fg
      JOIN courses c ON fg.course_id = c.id
      WHERE fg.student_id = ?`,
      [studentId],
    );

    // Get GPA summary
    const [cumulative] = await db.query(
      `SELECT 
        ROUND(AVG(gpa_points), 2) as cumulative_gpa,
        COUNT(*) as total_courses,
        SUM(credits) as total_credits
      FROM final_grades fg
      JOIN courses c ON fg.course_id = c.id
      WHERE fg.student_id = ?`,
      [studentId],
    );

    const [currentGPA] = await db.query(
      `SELECT 
        semester,
        year,
        ROUND(AVG(gpa_points), 2) as semester_gpa
      FROM final_grades fg
      JOIN courses c ON fg.course_id = c.id
      WHERE fg.student_id = ?
      GROUP BY semester, year
      ORDER BY year DESC, semester DESC
      LIMIT 1`,
      [studentId],
    );

    const gpaSummary = {
      cumulative: cumulative[0],
      current_semester: currentGPA[0] || null,
    };

    // Generate PDF
    const pdfBuffer = await PDFGenerator.generateGradeReport(
      students[0],
      grades,
      gpaSummary,
    );

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=grade_report_${students[0].student_id}.pdf`,
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating PDF report" });
  }
};

module.exports = {
  getStudentGrades,
  getGPASummary,
  getFilteredGPASummary,
  getCourseGradeDetails,
  exportGradesToPDF,
};
