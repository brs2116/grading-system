import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Spinner,
  Alert,
  Button, // ✅ FIX 1: import Button
} from "react-bootstrap";
import { useNavigate } from "react-router-dom"; // ✅ FIX 2: import navigate
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axiosConfig";
import Footer from "./Footer";

const MyCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // ✅ FIX 3: initialize navigate

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const response = await axiosInstance.get("/courses/my-courses");
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to load your courses");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="text-center mt-5">
          <Spinner animation="border" variant="primary" />
          <p>Loading your courses...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid px-3">
          <span className="navbar-brand">📚 My Courses</span>
          <div className="d-flex">
            <span className="navbar-text me-3">Welcome, {user?.name}</span>

            <Button
              variant="outline-light"
              size="sm"
              onClick={() => navigate("/dashboard")} // ✅ FIX 4: works correctly now
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <Container className="mt-4 mb-5">
        <h2 className="mb-4">My Department Courses</h2>

        {error && <Alert variant="danger">{error}</Alert>}

        {courses.length === 0 ? (
          <Alert variant="info">No courses found for your department.</Alert>
        ) : (
          <Row>
            {courses.map((course) => (
              <Col md={6} lg={4} key={course.id} className="mb-3">
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <Card.Title className="text-primary">
                      {course.course_code}
                    </Card.Title>

                    <Card.Subtitle className="mb-2 text-muted">
                      {course.course_name}
                    </Card.Subtitle>

                    <p className="mb-1">
                      <strong>Credits:</strong> {course.credits}
                    </p>

                    <p className="mb-0">
                      <strong>Status:</strong>{" "}
                      <Badge bg={course.letter_grade ? "success" : "warning"}>
                        {course.letter_grade ? "Graded" : "In Progress"}
                      </Badge>
                    </p>

                    {course.letter_grade && (
                      <p className="mb-0 mt-2">
                        <strong>Grade:</strong> {course.letter_grade} (
                        {course.percentage}%)
                      </p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      <Footer />
    </>
  );
};

export default MyCourses;
