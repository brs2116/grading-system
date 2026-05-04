import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Badge,
  Spinner,
  Row,
  Col,
  ListGroup,
} from "react-bootstrap";
import axiosInstance from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";

const TeacherPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
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
  const [loading, setLoading] = useState(true);

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
      setMessage({ type: "danger", text: "Error updating grade" });
      setTimeout(() => setMessage(""), 3000);
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
          <p>Loading teacher panel...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid px-3">
          <span className="navbar-brand">👨‍🏫 Teacher Portal</span>
          <div className="d-flex">
            <span className="navbar-text me-3">Welcome, {user?.name}</span>
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
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

        <Row>
          {/* Courses List */}
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">My Courses</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <ListGroup variant="flush">
                  {courses.map((course) => (
                    <ListGroup.Item
                      key={course.id}
                      action
                      active={selectedCourse?.id === course.id}
                      onClick={() => handleCourseSelect(course)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{course.course_code}</strong>
                        <br />
                        <small>{course.course_name}</small>
                      </div>
                      <Badge bg="secondary">{course.credits} credits</Badge>
                    </ListGroup.Item>
                  ))}
                  {courses.length === 0 && (
                    <ListGroup.Item className="text-center">
                      No courses assigned
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Students List */}
          <Col md={8}>
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
                            <td>{student.name}</td>
                            <td>{student.email}</td>
                            <td>
                              <Badge bg={getGradeBadge(student.letter_grade)}>
                                {student.letter_grade || "Not graded"}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditGrade(student)}
                              >
                                Enter/Edit Grade
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted text-center">
                    Select a course to view students
                  </p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Grade Entry Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Enter Grade for {selectedStudent?.name}</Modal.Title>
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
            <Button variant="primary" type="submit">
              Save Grade
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Footer />
    </>
  );
};

export default TeacherPanel;
