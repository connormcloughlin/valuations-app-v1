import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import qaApi from '../../services/qaApi';

const QAMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await qaApi.getMetrics();
        setMetrics(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load QA metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!metrics) return null;

  return (
    <div className="mb-4">
      <h3>Quality Assurance Metrics</h3>
      <Row>
        <Col md={3}>
          <Card className="text-center mb-3">
            <Card.Body>
              <h4>{metrics.pendingReviews}</h4>
              <div>Pending Reviews</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-3">
            <Card.Body>
              <h4>{metrics.completedReviews}</h4>
              <div>Completed Reviews</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-3">
            <Card.Body>
              <h4>{metrics.averageScore?.toFixed(1)}</h4>
              <div>Average Score</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-3">
            <Card.Body>
              <h4>{metrics.issuesIdentified}</h4>
              <div>Issues Identified</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default QAMetrics; 