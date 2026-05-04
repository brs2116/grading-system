import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Table,
  Button,
  Badge,
  Spinner,
  Alert,
  ProgressBar,
  Row,
  Col,
} from "react-bootstrap";
import axiosInstance from "../utils/axiosConfig";
import Footer from "./Footer";

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourseDetails = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        `/grades/course/${courseId}/details`,
      );
      console.log("Course Data from backend:", response.data);
      setCourseData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load course details");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  const getGradeBadgeVariant = (percentage) => {
    if (percentage >= 90) return "success";
    if (percentage >= 80) return "info";
    if (percentage >= 70) return "warning";
    if (percentage >= 60) return "danger";
    return "dark";
  };

  const getItemTypeIcon = (type) => {
    const icons = {
      assignment: "📝",
      quiz: "❓",
      midterm: "📚",
      final: "🎯",
      project: "💻",
    };
    return icons[type] || "📋";
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading course details...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!courseData) {
    return <Alert variant="warning">Course not found</Alert>;
  }

  return (
    <>
      <Container className="mt-4">
        {/* Back Button */}
        <Button
          variant="secondary"
          onClick={() => navigate("/dashboard")}
          className="mb-3"
        >
          ← Back to Dashboard
        </Button>

        {/* Course Header */}
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h4 className="mb-0">
              {courseData.course?.course_code} -{" "}
              {courseData.course?.course_name}
            </h4>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <p>
                  <strong>Credits:</strong> {courseData.course?.credits}
                </p>
              </Col>
              <Col md={6}>
                <p>
                  <strong>Overall Grade:</strong>{" "}
                  <Badge
                    bg={getGradeBadgeVariant(courseData.overall_percentage)}
                    size="lg"
                  >
                    {courseData.letter_grade} ({courseData.overall_percentage}%)
                  </Badge>
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Grade Breakdown Table */}
        <Card className="shadow-sm">
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">Grade Breakdown</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Item Type</th>
                  <th>Assignment Name</th>
                  <th>Weight</th>
                  <th>Your Score</th>
                  <th>Max Score</th>
                  <th>Percentage</th>
                  <th>Weighted Score</th>
                </tr>
              </thead>
              <tbody>
                {courseData.grade_breakdown?.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <span className="fs-4">
                        {getItemTypeIcon(item.item_type)}
                      </span>
                    </td>
                    <td>
                      <strong>{item.item_name}</strong>
                      <br />
                      <small className="text-muted">{item.item_type}</small>
                    </td>
                    <td>{item.weight}%</td>
                    <td>
                      {item.score_obtained ? (
                        <Badge bg="success">{item.score_obtained}</Badge>
                      ) : (
                        <Badge bg="secondary">Not graded</Badge>
                      )}
                    </td>
                    <td>{item.max_score}</td>
                    <td>
                      {item.percentage ? (
                        <>
                          <div className="mb-1">{item.percentage}%</div>
                          <ProgressBar
                            now={parseFloat(item.percentage)}
                            variant={
                              parseFloat(item.percentage) >= 70
                                ? "success"
                                : "warning"
                            }
                            style={{ height: "5px" }}
                          />
                        </>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>
                      {item.weighted_score ? (
                        <strong>{item.weighted_score}%</strong>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="table-active">
                <tr>
                  <td colSpan="5" className="text-end">
                    <strong>Total Weighted Score:</strong>
                  </td>
                  <td colSpan="2">
                    <strong>{courseData.overall_percentage}%</strong>
                  </td>
                </tr>
              </tfoot>
            </Table>
          </Card.Body>
        </Card>

        {/* Performance Summary Card */}
        <Card className="mt-4 shadow-sm bg-light">
          <Card.Body>
            <h6 className="text-muted mb-3">Performance Summary</h6>
            <Row>
              <Col md={4}>
                <div className="text-center">
                  <small className="text-muted">Final Grade</small>
                  <h2
                    className={
                      courseData.letter_grade === "A"
                        ? "text-success"
                        : "text-primary"
                    }
                  >
                    {courseData.letter_grade}
                  </h2>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-center">
                  <small className="text-muted">Percentage</small>
                  <h3>{courseData.overall_percentage}%</h3>
                </div>
              </Col>
              <Col md={4}>
                <div className="text-center">
                  <small className="text-muted">Status</small>
                  <h4>
                    {parseFloat(courseData.overall_percentage) >= 60 ? (
                      <Badge bg="success">Passing</Badge>
                    ) : (
                      <Badge bg="danger">Failing</Badge>
                    )}
                  </h4>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default CourseDetails;
