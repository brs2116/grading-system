import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser?.role === "teacher") {
        window.location.href = "/teacher";
      } else {
        window.location.href = "/dashboard";
      }
    } else {
      setLocalError(result.error || "Invalid email or password");
    }

    setLoading(false);
  };

  return (
    <Container
      fluid
      className="vh-100 d-flex align-items-center justify-content-center bg-light"
    >
      <Row className="w-100 justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow border-0 rounded-3">
            <Card.Body className="p-5">
              {/* Title */}
              <h2 className="text-center fw-bold mb-2">Student Portal</h2>

              {/* Subtitle */}
              <p className="text-center text-muted mb-4">
                Sign in to access your grades and academic records
              </p>

              {/* Error */}
              {localError && (
                <Alert variant="danger" className="text-center">
                  {localError}
                </Alert>
              )}

              {/* Form */}
              <Form onSubmit={handleSubmit}>
                {/* Email */}
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                {/* Password */}
                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                {/* Button */}
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </Form>

              {/* Demo */}
              <div className="text-center mt-3">
                <small className="text-muted">
                  Demo account: abebe@example.com | student123
                </small>
              </div>

              {/* Register link */}
              <div className="text-center mt-2">
                <small>
                  Don't have an account?{" "}
                  <a href="/register" className="text-decoration-none">
                    Register here
                  </a>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
