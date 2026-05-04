import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Spinner,
  Modal,
  Form,
  Alert,
  ProgressBar,
} from "react-bootstrap";
import axiosInstance from "../utils/axiosConfig";
import Footer from "./Footer";

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [gradeData, setGradeData] = useState({
    letter_grade: "",
    percentage: "",
    gpa_points: "",
    semester: "Fall",
    year: new Date().getFullYear(),
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get("/teacher/my-courses");
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (courseId) => {
    try {
      const response = await axiosInstance.get(
        `/teacher/course/${courseId}/students`,
      );
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    fetchStudents(course.id);
    setUploadResult(null);
    setUploadProgress(null);
  };

  const handleEditGrade = (student) => {
    setSelectedStudent(student);
    setGradeData({
      letter_grade: student.letter_grade || "",
      percentage: student.percentage || "",
      gpa_points: student.gpa_points || "",
      semester: "Fall",
      year: new Date().getFullYear(),
    });
    setShowModal(true);
  };

  const handleUpdateGrade = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.put(
        `/teacher/course/${selectedCourse.id}/student/${selectedStudent.id}/grade`,
        gradeData,
      );
      setMessage({ type: "success", text: "Grade updated successfully!" });
      setShowModal(false);
      fetchStudents(selectedCourse.id);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating grade:", error);
      setMessage({
        type: "danger",
        text: error.response?.data?.message || "Error updating grade",
      });
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axiosInstance.get("/teacher/download-template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "grade_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading template:", error);
      setMessage({ type: "danger", text: "Failed to download template" });
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleFileUpload = async (event, courseId) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("courseId", courseId);

    setUploadProgress({ percentage: 0 });
    setUploadResult(null);

    try {
      const response = await axiosInstance.post(
        `/teacher/course/${courseId}/bulk-upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress({ percentage });
          },
        },
      );

      setUploadResult({
        success: true,
        successCount: response.data.successCount,
        errorCount: response.data.errorCount,
        errors: response.data.errors,
      });
      fetchStudents(courseId);
      setMessage({
        type: "success",
        text: `Upload complete! ${response.data.successCount} grades updated.`,
      });
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      setUploadResult({
        success: false,
        successCount: 0,
        errorCount: 1,
        errors: [{ error: error.response?.data?.message || "Upload failed" }],
      });
      setMessage({ type: "danger", text: "Bulk upload failed" });
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setTimeout(() => setUploadProgress(null), 2000);
      event.target.value = "";
    }
  };

  const getGradeBadge = (letter) => {
    if (!letter) return "secondary";
    if (letter.startsWith("A")) return "success";
    if (letter.startsWith("B")) return "info";
    if (letter.startsWith("C")) return "warning";
    if (letter.startsWith("D")) return "danger";
    return "dark";
  };

  if (loading) {
    return (
      <>
        <div className="text-center mt-5">
          <Spinner animation="border" variant="primary" />
          <p>Loading teacher dashboard...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid px-3">
          <span className="navbar-brand">👨‍🏫 Teacher Dashboard</span>
          <div className="d-flex flex-wrap gap-2">
            <span className="navbar-text">Welcome, {user?.name}</span>
            <Button variant="outline-light" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <Container className="mt-4 mb-5">
        {message && (
          <Alert
            variant={message.type}
            onClose={() => setMessage("")}
            dismissible
          >
            {message.text}
          </Alert>
        )}

        <h2 className="mb-4">📚 Course Management</h2>

        <Row>
          <Col lg={4} md={5} className="mb-3">
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">My Courses</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                  {courses.length === 0 ? (
                    <p className="text-center text-muted p-3">
                      No courses assigned
                    </p>
                  ) : (
                    courses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => handleCourseSelect(course)}
                        style={{
                          cursor: "pointer",
                          backgroundColor:
                            selectedCourse?.id === course.id
                              ? "#e3f2fd"
                              : "white",
                          borderBottom: "1px solid #eee",
                        }}
                        className="p-3"
                      >
                        <strong>{course.course_code}</strong>
                        <br />
                        <small className="text-muted">
                          {course.course_name}
                        </small>
                        <br />
                        <Badge bg="secondary" className="mt-1">
                          {course.credits} credits
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8} md={7}>
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">
                  {selectedCourse
                    ? `Students in ${selectedCourse.course_code}`
                    : "Select a course"}
                </h5>
              </Card.Header>
              <Card.Body>
                {selectedCourse ? (
                  <>
                    <Card className="mb-3 shadow-sm">
                      <Card.Header className="bg-info text-white">
                        <h6 className="mb-0">📤 Bulk Grade Upload</h6>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Download Template</Form.Label>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={downloadTemplate}
                              >
                                📥 Download Excel Template
                              </Button>
                              <Form.Text className="text-muted">
                                Use this template to prepare your grades
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Upload Grades File</Form.Label>
                              <Form.Control
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={(e) =>
                                  handleFileUpload(e, selectedCourse.id)
                                }
                                size="sm"
                              />
                              <Form.Text className="text-muted">
                                Upload filled template (Excel or CSV)
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                        {uploadProgress && (
                          <ProgressBar
                            now={uploadProgress.percentage}
                            label={`${uploadProgress.percentage}%`}
                            className="mt-3"
                          />
                        )}
                        {uploadResult && (
                          <Alert
                            variant={
                              uploadResult.success ? "success" : "warning"
                            }
                            className="mt-3"
                          >
                            <strong>Upload Complete!</strong>
                            <br />✅ Success: {uploadResult.successCount} | ❌
                            Errors: {uploadResult.errorCount}
                            {uploadResult.errors?.length > 0 && (
                              <details className="mt-2">
                                <summary>View Errors</summary>
                                <pre className="small mt-2">
                                  {JSON.stringify(uploadResult.errors, null, 2)}
                                </pre>
                              </details>
                            )}
                          </Alert>
                        )}
                      </Card.Body>
                    </Card>

                    <div style={{ overflowX: "auto" }}>
                      <Table responsive striped hover>
                        <thead>
                          <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Current Grade</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center">
                                No students enrolled
                              </td>
                            </tr>
                          ) : (
                            students.map((student) => (
                              <tr key={student.id}>
                                <td>{student.student_id}</td>
                                <td>
                                  <strong>{student.name}</strong>
                                </td>
                                <td>{student.email}</td>
                                <td>
                                  <Badge
                                    bg={getGradeBadge(student.letter_grade)}
                                  >
                                    {student.letter_grade || "Not graded"}
                                  </Badge>
                                </td>
                                <td>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleEditGrade(student)}
                                  >
                                    📝 Enter Grade
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <p className="text-muted text-center py-5">
                    Click on a course from the left to view students
                  </p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📝 Enter Grade for {selectedStudent?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateGrade}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Letter Grade</Form.Label>
                  <Form.Select
                    value={gradeData.letter_grade}
                    onChange={(e) =>
                      setGradeData({
                        ...gradeData,
                        letter_grade: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select Grade</option>
                    <option value="A+">A+ (90-100%)</option>
                    <option value="A">A (85-89%)</option>
                    <option value="A-">A- (80-84%)</option>
                    <option value="B+">B+ (75-79%)</option>
                    <option value="B">B (70-74%)</option>
                    <option value="B-">B- (65-69%)</option>
                    <option value="C+">C+ (60-64%)</option>
                    <option value="C">C (55-69%)</option>
                    <option value="C-">C- (50-54%)</option>
                    <option value="D">D (45-49%)</option>
                    <option value="F">F (Below 45%)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Percentage (%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={gradeData.percentage}
                    onChange={(e) =>
                      setGradeData({ ...gradeData, percentage: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>GPA Points</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={gradeData.gpa_points}
                    onChange={(e) =>
                      setGradeData({ ...gradeData, gpa_points: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Semester</Form.Label>
                  <Form.Select
                    value={gradeData.semester}
                    onChange={(e) =>
                      setGradeData({ ...gradeData, semester: e.target.value })
                    }
                  >
                    <option>Fall</option>
                    <option>Spring</option>
                    <option>Summer</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Year</Form.Label>
                  <Form.Control
                    type="number"
                    value={gradeData.year}
                    onChange={(e) =>
                      setGradeData({ ...gradeData, year: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "💾 Save Grade"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Footer />
    </>
  );
};

export default TeacherDashboard;
