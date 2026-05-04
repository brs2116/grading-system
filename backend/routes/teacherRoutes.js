const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getMyCourses,
  getCourseStudents,
  updateGrade,
  getStudentGradeDetails,
} = require("../controllers/teacherController");


// Teacher only middleware
const teacherOnly = (req, res, next) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Teacher only." });
  }
  next();
};
const {
  uploadGrades,
  downloadTemplate,
  upload,
} = require("../controllers/bulkUploadController");
router.use(protect);
router.use(teacherOnly);


// Bulk upload routes
router.post(
  "/course/:courseId/bulk-upload",
  upload.single("file"),
  uploadGrades,
);
router.get("/download-template", downloadTemplate);
router.get("/my-courses", getMyCourses);
router.get("/course/:courseId/students", getCourseStudents);
router.get(
  "/course/:courseId/student/:studentId/grades",
  getStudentGradeDetails,
);
router.put("/course/:courseId/student/:studentId/grade", updateGrade);
module.exports = router;
