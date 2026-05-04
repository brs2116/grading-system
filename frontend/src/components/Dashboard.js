import React, { useEffect, useState } from "react";
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
  Form,
} from "react-bootstrap";
import axiosInstance from "../utils/axiosConfig";
import Footer from "./Footer";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [gpa, setGpa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [filteredGpa, setFilteredGpa] = useState(null);

  useEffect(() => {
    fetchGrades();
    fetchFilteredGPA();
    fetchGPA();
  }, [selectedSemester, selectedYear]);

  const fetchGrades = async () => {
    try {
      let url = "/grades/my-grades";
      const params = [];

      if (selectedSemester && selectedSemester !== "all") {
        params.push(`semester=${selectedSemester}`);
      }
      if (selectedYear && selectedYear !== "all") {
        params.push(`year=${selectedYear}`);
      }

      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }

      const response = await axiosInstance.get(url);
      setGrades(response.data.grades || response.data);

      if (response.data.filters?.semesters) {
        const semesters = response.data.filters.semesters;
        setAvailableSemesters(semesters);
        const years = [...new Set(semesters.map((s) => s.year))];
        setAvailableYears(years.sort((a, b) => b - a));
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
      setGrades([]);
    }
  };

  const fetchGPA = async () => {
    try {
      const response = await axiosInstance.get("/grades/gpa-summary");
      setGpa(response.data);
    } catch (error) {
      console.error("Error fetching GPA:", error);
      setGpa(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredGPA = async () => {
    try {
      let url = "/grades/filtered-gpa";
      const params = [];

      if (selectedSemester && selectedSemester !== "all") {
        params.push(`semester=${selectedSemester}`);
      }
      if (selectedYear && selectedYear !== "all") {
        params.push(`year=${selectedYear}`);
      }

      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }

      const response = await axiosInstance.get(url);
      setFilteredGpa(response.data);
    } catch (error) {
      console.error("Error fetching filtered GPA:", error);
      setFilteredGpa(null);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await axiosInstance.get("/grades/export-pdf", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `grade_report_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to generate PDF report");
    } finally {
      setExporting(false);
    }
  };

  const getGradeBadge = (letter) => {
    if (letter === "Not Graded") return "secondary";
    if (letter.startsWith("A")) return "success";
    if (letter.startsWith("B")) return "info";
    if (letter.startsWith("C")) return "warning";
    if (letter.startsWith("D")) return "danger";
    return "dark";
  };

  const handleClearFilters = () => {
    setSelectedSemester("all");
    setSelectedYear("all");
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading your grades...</p>
      </div>
    );
  }

  return (
    <>
      {/* Responsive Navbar */}
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid px-3">
          <span
            className="navbar-brand"
            style={{ fontSize: "clamp(1rem, 5vw, 1.5rem)" }}
          >
            📊 Grade System
          </span>
          <div className="d-flex flex-wrap gap-2">
            {user?.role === "admin" && (
              <Button
                variant="outline-info"
                size="sm"
                onClick={() => navigate("/admin")}
              >
                👑 Admin
              </Button>
            )}
            {user?.role === "student" && (
              <Button
                variant="outline-info"
                size="sm"
                className="me-2"
                onClick={() => navigate("/my-courses")}
              >
                📚 My Courses
              </Button>
            )}
            <span className="navbar-text d-none d-sm-inline">
              Welcome, {user?.name}
            </span>
            <Button variant="outline-light" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <Container fluid className="mt-3 mt-md-4 px-3 px-md-4">
        {/* Export PDF Button */}
        <div className="mb-3 d-flex justify-content-end">
          <Button
            variant="success"
            onClick={handleExportPDF}
            disabled={exporting}
            size="sm"
            style={{ fontSize: "0.8rem", padding: "4px 12px" }}
          >
            {exporting ? "⏳" : "📄Export PDF"}
          </Button>
        </div>

        {/* Filter Section */}
        <Card className="mb-4 shadow-sm">
          <Card.Body className="p-3 p-md-4">
            <Row className="g-3">
              <Col xs={12} sm={6} md={3}>
                <Form.Group>
                  <Form.Label>Semester</Form.Label>
                  <Form.Select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    size="sm"
                  >
                    <option value="all">All Semesters</option>
                    {availableSemesters.map((s, idx) => (
                      <option key={idx} value={s.semester}>
                        {s.semester}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <Form.Group>
                  <Form.Label>Year</Form.Label>
                  <Form.Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    size="sm"
                  >
                    <option value="all">All Years</option>
                    {availableYears.map((year, idx) => (
                      <option key={idx} value={year}>
                        {year}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <Form.Group>
                  <Form.Label>&nbsp;</Form.Label>
                  <div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleClearFilters}
                      className="w-100"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={3}>
                <div className="text-start text-md-end">
                  <small className="text-muted">Filtered GPA</small>
                  <h4
                    className={
                      filteredGpa?.filtered?.filtered_gpa >= 3.0
                        ? "text-success"
                        : "text-warning"
                    }
                  >
                    {filteredGpa?.filtered?.filtered_gpa || "N/A"}
                  </h4>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* GPA Cards */}
        <Row className="mb-4 g-3">
          <Col xs={12} sm={6}>
            <Card className="text-center shadow-sm border-primary h-100">
              <Card.Body className="p-3 p-md-4">
                <Card.Title style={{ fontSize: "clamp(0.9rem, 4vw, 1.25rem)" }}>
                  Current Semester GPA
                </Card.Title>
                <h2
                  className="text-primary"
                  style={{ fontSize: "clamp(1.5rem, 8vw, 2.5rem)" }}
                >
                  {gpa?.current_semester?.semester_gpa || "N/A"}
                </h2>
                {gpa?.current_semester && (
                  <small>
                    {gpa.current_semester.semester} {gpa.current_semester.year}
                  </small>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="text-center shadow-sm border-success h-100">
              <Card.Body className="p-3 p-md-4">
                <Card.Title style={{ fontSize: "clamp(0.9rem, 4vw, 1.25rem)" }}>
                  Cumulative GPA
                </Card.Title>
                <h2
                  className="text-success"
                  style={{ fontSize: "clamp(1.5rem, 8vw, 2.5rem)" }}
                >
                  {gpa?.cumulative?.cumulative_gpa || "0.00"}
                </h2>
                <small>{gpa?.cumulative?.total_courses || 0} Courses</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Grades Table */}
        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white py-2 py-md-3">
            <h5
              className="mb-0"
              style={{ fontSize: "clamp(1rem, 4vw, 1.25rem)" }}
            >
              My Grades
            </h5>
          </Card.Header>
          <Card.Body className="p-0 p-md-3">
            <div
              style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
            >
              <Table
                responsive
                striped
                hover
                className="mb-0"
                style={{ minWidth: "600px" }}
              >
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course</th>
                    <th>Cr</th>
                    <th>%</th>
                    <th>Grade</th>
                    <th>GPA</th>
                    <th>Sem</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        No courses found. Please contact your department.
                      </td>
                    </tr>
                  ) : (
                    grades.map((grade, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{grade.course_code}</strong>
                        </td>
                        <td
                          className="text-truncate"
                          style={{ maxWidth: "150px" }}
                        >
                          {grade.course_name}
                        </td>
                        <td>{grade.credits}</td>
                        <td>
                          {grade.percentage > 0 ? `${grade.percentage}%` : "—"}
                        </td>
                        <td>
                          {grade.letter_grade === "Not Graded" ? (
                            <Badge bg="secondary">Not Graded</Badge>
                          ) : (
                            <Badge bg={getGradeBadge(grade.letter_grade)}>
                              {grade.letter_grade}
                            </Badge>
                          )}
                        </td>
                        <td>{grade.gpa_points > 0 ? grade.gpa_points : "—"}</td>
                        <td>
                          <small>
                            {grade.semester !== "Current"
                              ? `${grade.semester?.substring(0, 3)} ${grade.year}`
                              : "Current"}
                          </small>
                        </td>
                        <td>
                          {grade.letter_grade !== "Not Graded" && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() =>
                                navigate(`/course/${grade.course_id}`)
                              }
                              className="px-2 px-md-3"
                            >
                              View
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Container>
      <Footer />
    </>
  );
};

export default Dashboard;
