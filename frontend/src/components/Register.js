import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import axiosInstance from "../utils/axiosConfig";
import Footer from "./Footer";

const Register = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    student_id: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department_id: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get("/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error(error);
      setError("Failed to load departments");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.student_id || !formData.name || !formData.email) {
      return "Please fill in all required fields";
    }
    if (!formData.email.includes("@")) {
      return "Please enter a valid email address";
    }
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
    if (!formData.department_id) {
      return "Please select your department";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post("/auth/register", {
        student_id: formData.student_id,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department_id: formData.department_id,
      });

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container px-3">
          <span className="navbar-brand fw-semibold">
            🎓 Student Registration
          </span>
          <Button
            variant="outline-light"
            size="sm"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        </div>
      </nav>

      {/* Form */}
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <Card className="shadow border-0 rounded-3">
              <Card.Body className="p-4">
                <h4 className="text-center mb-4 fw-bold">Create Account</h4>

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    {/* Student ID */}
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Student ID</Form.Label>
                        <Form.Control
                          type="text"
                          name="student_id"
                          placeholder="Enter your student ID (e.g., STU001)"
                          value={formData.student_id}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Full Name */}
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Email */}
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          placeholder="Enter your email address"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Department */}
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Department</Form.Label>
                        <Form.Select
                          name="department_id"
                          value={formData.department_id}
                          onChange={handleChange}
                          required
                        >
                          <option value="">-- Select your department --</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {/* Password */}
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Enter password (min 6 characters)"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>

                    {/* Confirm Password */}
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Confirm Password</Form.Label>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Show Password Toggle */}
                  <div className="mt-2">
                    <Form.Check
                      type="checkbox"
                      label="Show Password"
                      onChange={() => setShowPassword(!showPassword)}
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 mt-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      "Register"
                    )}
                  </Button>

                  {/* Login Link */}
                  <div className="text-center mt-3">
                    <small>
                      Already have an account?{" "}
                      <span
                        className="text-primary"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate("/login")}
                      >
                        Sign in
                      </span>
                    </small>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Footer />
    </>
  );
};

export default Register;
