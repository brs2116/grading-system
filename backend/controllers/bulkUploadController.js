const db = require("../config/db");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Upload grades via Excel
const uploadGrades = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const courseId = req.body.courseId;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: "File is empty" });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const row of data) {
      try {
        const studentId = row.student_id || row.StudentID;
        const letterGrade = row.letter_grade || row.Grade;
        const percentage = row.percentage || row.Percentage;
        const gpaPoints = row.gpa_points || row.GPA;
        const semester = row.semester || "Fall";
        const year = row.year || new Date().getFullYear();

        if (!studentId || !letterGrade || !percentage) {
          errorCount++;
          errors.push({ row, error: "Missing required fields" });
          continue;
        }

        const [student] = await db.query(
          "SELECT id FROM users WHERE student_id = ? AND role = 'student'",
          [studentId.toString()],
        );

        if (student.length === 0) {
          errorCount++;
          errors.push({ row, error: `Student ${studentId} not found` });
          continue;
        }

        const [existing] = await db.query(
          "SELECT id FROM final_grades WHERE student_id = ? AND course_id = ? AND semester = ? AND year = ?",
          [student[0].id, courseId, semester, year],
        );

        if (existing.length > 0) {
          await db.query(
            `UPDATE final_grades 
                         SET letter_grade = ?, percentage = ?, gpa_points = ?
                         WHERE student_id = ? AND course_id = ? AND semester = ? AND year = ?`,
            [
              letterGrade,
              percentage,
              gpaPoints,
              student[0].id,
              courseId,
              semester,
              year,
            ],
          );
        } else {
          await db.query(
            `INSERT INTO final_grades (student_id, course_id, letter_grade, percentage, gpa_points, semester, year)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              student[0].id,
              courseId,
              letterGrade,
              percentage,
              gpaPoints,
              semester,
              year,
            ],
          );
        }
        successCount++;
      } catch (rowError) {
        errorCount++;
        errors.push({ row, error: rowError.message });
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({
      message: "Bulk upload completed",
      successCount,
      errorCount,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error processing file" });
  }
};

// Download template
const downloadTemplate = async (req, res) => {
  const template = [
    {
      student_id: "STU001",
      letter_grade: "A",
      percentage: 92.5,
      gpa_points: 4.0,
      semester: "Fall",
      year: 2024,
    },
    {
      student_id: "STU002",
      letter_grade: "B+",
      percentage: 87.0,
      gpa_points: 3.3,
      semester: "Fall",
      year: 2024,
    },
    {
      student_id: "STU003",
      letter_grade: "A-",
      percentage: 90.0,
      gpa_points: 3.7,
      semester: "Fall",
      year: 2024,
    },
  ];

  const ws = xlsx.utils.json_to_sheet(template);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "GradeTemplate");
  const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=grade_template.xlsx",
  );
  res.send(buffer);
};

module.exports = { uploadGrades, downloadTemplate, upload };
