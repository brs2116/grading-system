import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  Modal,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axiosConfig";
import Footer from "./Footer";

const CourseRegistration = () => {
  const { user } = useAuth();
  const [availableCourses, setAvailableCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchAvailableCourses(), fetchMyCourses()]);
    setLoading(false);
  };

  const fetchAvailableCourses = async () => {
    try {
      const response = await axiosInstance.get("/courses/department-courses");
      console.log("Available courses response:", response.data);
      // Check if response is array or has courses property
      if (Array.isArray(response.data)) {
        setAvailableCourses(response.data);
      } else if (response.data.courses) {
        setAvailableCourses(response.data.courses);
      } else {
        setAvailableCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setMessage({ type: "danger", text: "Failed to load courses" });
    }
  };

  const fetchMyCourses = async () => {
    try {
      const response = await axiosInstance.get("/courses/my-courses");
      console.log("My courses response:", response.data);
      if (Array.isArray(response.data)) {
        setMyCourses(response.data);
      } else {
        setMyCourses([]);
      }
    } catch (error) {
      console.error("Error fetching my courses:", error);
      setMyCourses([]);
    }
  };

  const handleRegister = (course) => {
    setSelectedCourse(course);
    setShowConfirm(true);
  };

  const confirmRegister = async () => {
    try {
      await axiosInstance.post(`/courses/register/${selectedCourse.id}`);
      setMessage({
        type: "success",
        text: `Registered for ${selectedCourse.course_name}!`,
      });
      setShowConfirm(false);
      loadData();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.response?.data?.message || "Registration failed",
      });
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) {
    return (
      <>
        <div className="text-center mt-5">
          <Spinner animation="border" variant="primary" />
          <p>Loading courses...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid px-3">
          <span className="navbar-brand">📚 Course Registration</span>
          <div className="d-flex">
            <span className="navbar-text me-3">Welcome, {user?.name}</span>
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Back to Dashboard
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
          {/* Available Courses */}
          <Col lg={7} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">📖 Available Courses</h5>
              </Card.Header>
              <Card.Body>
                {availableCourses.length === 0 ? (
                  <p className="text-muted text-center py-3">
                    No courses available for your department.
                  </p>
                ) : (
                  <Row>
                    {availableCourses.map((course) => (
                      <Col md={6} key={course.id} className="mb-3">
                        <Card className="h-100">
                          <Card.Body>
                            <h6 className="text-primary">
                              {course.course_code}
                            </h6>
                            <strong>{course.course_name}</strong>
                            <p className="text-muted small mt-2">
                              {course.credits} credits
                            </p>
                            {course.already_enrolled ? (
                              <Badge bg="success">Already Enrolled</Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleRegister(course)}
                              >
                                Register
                              </Button>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* My Enrolled Courses */}
          <Col lg={5}>
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">✅ My Enrolled Courses</h5>
              </Card.Header>
              <Card.Body>
                {myCourses.length === 0 ? (
                  <p className="text-muted text-center py-3">
                    No courses enrolled yet.
                  </p>
                ) : (
                  myCourses.map((course) => (
                    <Card key={course.id} className="mb-2 border-success">
                      <Card.Body className="py-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{course.course_code}</strong>
                            <br />
                            <small>{course.course_name}</small>
                            <br />
                            <small className="text-muted">
                              {course.credits} credits
                            </small>
                          </div>
                          <Badge bg="success">Enrolled</Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  ))
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Confirmation Modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Registration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to register for{" "}
          <strong>{selectedCourse?.course_name}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmRegister}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <Footer />
    </>
  );
};

export default CourseRegistration;
