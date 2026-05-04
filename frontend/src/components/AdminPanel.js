import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Modal,
  Alert,
  Tab,
  Tabs,
  Spinner,
} from "react-bootstrap";
import axiosInstance from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import Footer from "./Footer";

const AdminPanel = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allGrades, setAllGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherSelections, setTeacherSelections] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [newStudent, setNewStudent] = useState({
    student_id: "",
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (user?.role === "admin") {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStudents(),
      fetchCourses(),
      fetchAllGrades(),
      fetchTeachers(),
    ]);
    setLoading(false);
  };

  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get("/admin/students");
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get("/admin/courses");
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchAllGrades = async () => {
    try {
      const response = await axiosInstance.get("/admin/all-grades");
      setAllGrades(response.data);
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axiosInstance.get("/admin/teachers");
      setTeachers(response.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const assignTeacher = async (courseId, teacherId) => {
    if (!teacherId || teacherId === "") {
      setMessage({ type: "warning", text: "Please select a teacher first" });
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      await axiosInstance.put(`/admin/courses/${courseId}/assign-teacher`, {
        teacher_id: parseInt(teacherId),
      });
      setMessage({ type: "success", text: "Teacher assigned successfully!" });
      fetchCourses();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage({ type: "danger", text: "Error assigning teacher" });
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/admin/students", newStudent);
      setMessage({ type: "success", text: "Student added successfully!" });
      setShowModal(false);
      fetchStudents();
      setNewStudent({ student_id: "", name: "", email: "", password: "" });
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage({ type: "danger", text: "Error adding student" });
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (user?.role !== "admin") {
    return (
      <>
        <Container className="mt-5">
          <Alert variant="danger">Access Denied. Admin only.</Alert>
        </Container>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <div className="text-center mt-5">
          <Spinner animation="border" variant="primary" />
          <p>Loading admin panel...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Container className="mt-4">
        <h2 className="mb-4">Admin Panel</h2>

        {message && (
          <Alert
            variant={message.type}
            onClose={() => setMessage("")}
            dismissible
          >
            {message.text}
          </Alert>
        )}

        <Button
          variant="primary"
          className="mb-3"
          onClick={() => setShowModal(true)}
        >
          + Add New Student
        </Button>

        <Tabs defaultActiveKey="students" className="mb-3">
          <Tab eventKey="students" title="Students">
            <Card className="shadow-sm">
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center">
                          No students found
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr key={student.id}>
                          <td>{student.student_id}</td>
                          <td>{student.name}</td>
                          <td>{student.email}</td>
                          <td>
                            {new Date(student.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="courses" title="Courses & Teachers">
            <Card className="shadow-sm">
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Credits</th>
                      <th>Assigned Teacher</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center">
                          No courses found
                        </td>
                      </tr>
                    ) : (
                      courses.map((course) => (
                        <tr key={course.id}>
                          <td>
                            <strong>{course.course_code}</strong>
                          </td>
                          <td>{course.course_name}</td>
                          <td>{course.credits}</td>
                          <td>
                            <Form.Select
                              value={
                                teacherSelections[course.id] ||
                                course.teacher_id ||
                                ""
                              }
                              onChange={(e) =>
                                setTeacherSelections({
                                  ...teacherSelections,
                                  [course.id]: e.target.value,
                                })
                              }
                              size="sm"
                            >
                              <option value="">-- Select Teacher --</option>
                              {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                  {teacher.name} ({teacher.email})
                                </option>
                              ))}
                            </Form.Select>
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() =>
                                assignTeacher(
                                  course.id,
                                  teacherSelections[course.id] ||
                                    course.teacher_id,
                                )
                              }
                            >
                              Assign Teacher
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="grades" title="All Grades">
            <Card className="shadow-sm">
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Student ID</th>
                      <th>Course</th>
                      <th>Grade</th>
                      <th>Percentage</th>
                      <th>Semester</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allGrades.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          No grades found
                        </td>
                      </tr>
                    ) : (
                      allGrades.map((grade, idx) => (
                        <tr key={idx}>
                          <td>{grade.student_name}</td>
                          <td>{grade.student_id}</td>
                          <td>
                            {grade.course_code} - {grade.course_name}
                          </td>
                          <td>
                            <strong>{grade.letter_grade}</strong>
                          </td>
                          <td>{grade.percentage}%</td>
                          <td>
                            {grade.semester} {grade.year}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>

        {/* Add Student Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Student</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleAddStudent}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Student ID</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., STU002"
                  value={newStudent.student_id}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, student_id: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Student Name"
                  value={newStudent.name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="student@example.com"
                  value={newStudent.email}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, email: e.target.value })
                  }
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Temporary Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="password123"
                  value={newStudent.password}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, password: e.target.value })
                  }
                  required
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Add Student
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
      <Footer />
    </>
  );
};

export default AdminPanel;
