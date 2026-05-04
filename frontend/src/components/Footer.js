import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  // Dynamic year (auto updates if needed)
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const interval = setInterval(
      () => {
        setYear(new Date().getFullYear());
      },
      1000 * 60 * 60,
    ); // update every hour

    return () => clearInterval(interval);
  }, []);

  // ✅ EDIT THIS TEXT
  const copyrightText = `© ${year} Unity University. All Rights Reserved`;

  return (
    <footer className="bg-dark text-white mt-5 py-4">
      <Container>
        <Row className="align-items-center">
          {/* Left Section */}
          <Col
            xs={12}
            md={4}
            className="text-center text-md-start mb-3 mb-md-0"
          >
            <h6 className="mb-1">📊 Student Grade System</h6>
            <small className="text-light">Track your academic progress</small>
          </Col>

          {/* Middle Section */}
          <Col xs={12} md={4} className="text-center mb-3 mb-md-0">
            <h6 className="mb-2">Quick Links</h6>
            <small>
              <button
                onClick={() => navigate("/dashboard")}
                className="btn btn-link text-white text-decoration-none p-0 me-3"
                style={{ fontSize: "0.8rem" }}
              >
                Dashboard
              </button>

              <button
                onClick={() => navigate("/privacy")}
                className="btn btn-link text-white text-decoration-none p-0"
                style={{ fontSize: "0.8rem" }}
              >
                Privacy Policy
              </button>
            </small>
          </Col>

          {/* Right Section */}
          <Col xs={12} md={4} className="text-center text-md-end">
            <h6 className="mb-1">Contact</h6>
            <small className="text-light">biruka414@gmail.com</small>
            <br />
            <small className="text-light">{copyrightText}</small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
