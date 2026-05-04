const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getStudentGrades,
  getGPASummary,
  getFilteredGPASummary, // ADD THIS
  getCourseGradeDetails,
  exportGradesToPDF,
} = require("../controllers/gradeController");

router.use(protect);

router.get("/my-grades", getStudentGrades);
router.get("/gpa-summary", getGPASummary);
router.get("/filtered-gpa", getFilteredGPASummary); // ADD THIS
router.get("/course/:courseId/details", getCourseGradeDetails);
router.get("/export-pdf", exportGradesToPDF);

module.exports = router;
