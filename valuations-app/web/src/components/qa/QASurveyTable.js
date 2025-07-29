import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import qaApi from '../../services/qaApi';

const QASurveyTable = ({ onViewDetails }) => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'pending',
    search: '',
    page: 1,
    limit: 10
  });

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const response = await qaApi.getSurveys(filters);
      setSurveys(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [filters]);

  const handleStatusChange = (e) => {
    setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }));
  };

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      inProgress: 'info',
      completed: 'success',
      rejected: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <Row className="mb-3">
        <Col md={4}>
          <Form.Select value={filters.status} onChange={handleStatusChange}>
            <option value="pending">Pending Review</option>
            <option value="inProgress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="all">All Surveys</option>
          </Form.Select>
        </Col>
        <Col md={8}>
          <InputGroup>
            <Form.Control
              placeholder="Search by surveyor, location, or reference..."
              value={filters.search}
              onChange={handleSearch}
            />
          </InputGroup>
        </Col>
      </Row>

      <Table responsive hover>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Date</th>
            <th>Surveyor</th>
            <th>Location</th>
            <th>Status</th>
            <th>Items</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {surveys.map(survey => (
            <tr key={survey.id}>
              <td>{survey.reference}</td>
              <td>{new Date(survey.date).toLocaleDateString()}</td>
              <td>{survey.surveyor}</td>
              <td>{survey.location}</td>
              <td>{getStatusBadge(survey.status)}</td>
              <td>{survey.itemCount}</td>
              <td>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => onViewDetails(survey.id)}
                >
                  Review
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="d-flex justify-content-between align-items-center">
        <div>
          Showing {surveys.length} surveys
        </div>
        <div>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={filters.page === 1}
            onClick={() => handlePageChange(filters.page - 1)}
          >
            Previous
          </Button>
          <span className="mx-2">Page {filters.page}</span>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={surveys.length < filters.limit}
            onClick={() => handlePageChange(filters.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QASurveyTable; 