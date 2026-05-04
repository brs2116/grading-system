import React from "react";
import { Container, Card, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <>
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid px-3">
          <span
            className="navbar-brand"
            style={{ fontSize: "clamp(1rem, 5vw, 1.5rem)" }}
          >
            🔒 Privacy Policy
          </span>
          <div className="d-flex">
            <button
              className="btn btn-outline-light btn-sm"
              onClick={() => navigate("/dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <Container className="mt-4 mb-5">
        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h4 className="mb-0">Privacy Policy</h4>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col>
                <h5>1. Information We Collect</h5>
                <p>
                  We collect personal information including name, email address,
                  student ID, and academic records (grades, courses, GPA) to
                  provide grade reporting services.
                </p>

                <h5>2. How We Use Your Information</h5>
                <p>
                  Your information is used solely for academic purposes
                  including:
                </p>
                <ul>
                  <li>Displaying your grades and academic progress</li>
                  <li>Generating grade reports and transcripts</li>
                  <li>Providing GPA calculations</li>
                  <li>Administering student accounts</li>
                </ul>

                <h5>3. Data Security</h5>
                <p>
                  We implement industry-standard security measures including:
                </p>
                <ul>
                  <li>Password hashing (bcrypt)</li>
                  <li>JWT token authentication</li>
                  <li>Secure database connections</li>
                  <li>Protected API endpoints</li>
                </ul>

                <h5>4. Data Sharing</h5>
                <p>Your academic information is only accessible to:</p>
                <ul>
                  <li>You (the student)</li>
                  <li>Authorized administrators</li>
                  <li>Your instructors (for grade management)</li>
                </ul>
                <p>We do not sell or share your data with third parties.</p>

                <h5>5. Your Rights</h5>
                <p>You have the right to:</p>
                <ul>
                  <li>View your academic records</li>
                  <li>Request corrections to your grades</li>
                  <li>Export your grade data (PDF format)</li>
                  <li>Delete your account (contact admin)</li>
                </ul>

                <h5>6. Data Retention</h5>
                <p>
                  Your academic records are retained indefinitely for academic
                  transcript purposes. Account information can be removed upon
                  request.
                </p>

                <h5>7. Cookies</h5>
                <p>
                  We use JWT tokens stored in local storage for authentication.
                  No tracking cookies are used.
                </p>

                <h5>8. Contact Us</h5>
                <p>
                  For privacy concerns or data requests, contact:
                  <br />
                  <strong>Email:</strong> biruka414@gmail.com
                  <br />
                  <strong>Phone:</strong> (+251) 962-22-68-56
                </p>

                <h5>9. Updates to This Policy</h5>
                <p>
                  This privacy policy was last updated on{" "}
                  {new Date().toLocaleDateString()}. We will notify users of any
                  material changes via email or dashboard notification.
                </p>

                <hr />

                <p className="text-muted text-center small">
                  By using the Student Grade System, you agree to this Privacy
                  Policy.
                </p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>

      <Footer />
    </>
  );
};

export default Privacy;
