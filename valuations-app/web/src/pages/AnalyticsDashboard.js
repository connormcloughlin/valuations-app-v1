import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Spinner, Alert, Table } from 'react-bootstrap';
import analyticsApi from '../services/analyticsApi';

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    analyticsApi.getDashboard()
      .then(res => {
        setData(res.data.data);
        setError(null);
      })
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data) return null;

  const { summary, trends } = data;

  return (
    <div>
      <h1 className="mb-4">Analytics Dashboard</h1>
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center mb-3"><Card.Body><h4>{summary.totalOrders}</h4><div>Total Orders</div></Card.Body></Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-3"><Card.Body><h4>{summary.pendingOrders}</h4><div>Pending Orders</div></Card.Body></Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-3"><Card.Body><h4>{summary.completedOrders}</h4><div>Completed Orders</div></Card.Body></Card>
        </Col>
        <Col md={3}>
          <Card className="text-center mb-3"><Card.Body><h4>{summary.totalValue?.toLocaleString()}</h4><div>Total Value (£)</div></Card.Body></Card>
        </Col>
      </Row>
      <h4>Order Volume Trends</h4>
      <Table size="sm" bordered hover>
        <thead><tr><th>Date</th><th>Count</th><th>Value (£)</th></tr></thead>
        <tbody>
          {trends.orderVolume?.map(row => (
            <tr key={row.date}><td>{row.date}</td><td>{row.count}</td><td>{row.value?.toLocaleString()}</td></tr>
          ))}
        </tbody>
      </Table>
      <h4>Quality Metrics Trends</h4>
      <Table size="sm" bordered hover>
        <thead><tr><th>Date</th><th>Avg. Score</th><th>Survey Count</th></tr></thead>
        <tbody>
          {trends.qualityMetrics?.map(row => (
            <tr key={row.date}><td>{row.date}</td><td>{row.averageScore}</td><td>{row.surveyCount}</td></tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AnalyticsDashboard; 