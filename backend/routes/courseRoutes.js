const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getDepartmentCourses,
  getMyEnrolledCourses,
  registerForCourse,
  dropCourse,
} = require("../controllers/courseRegistrationController");

router.use(protect);

router.get("/department-courses", getDepartmentCourses);
router.get("/my-courses", getMyEnrolledCourses);
router.post("/register/:courseId", registerForCourse);
router.delete("/drop/:courseId", dropCourse);

module.exports = router;
