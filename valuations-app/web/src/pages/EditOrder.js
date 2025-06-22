import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { customerApi } from '../services/api';

const EditOrder = () => {
  const { customerId, orderId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    propertyId: '',
    type: 'building',
    orderDate: '',
    dueDate: '',
    priority: 'normal',
    notes: '',
    brokerReference: '',
    insurerReference: '',
    status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await customerApi.getOrderById(customerId, orderId);
        setFormData({
          ...data,
          orderDate: data.orderDate.split('T')[0],
          dueDate: data.dueDate.split('T')[0]
        });
      } catch (err) {
        setError('Failed to fetch order details');
      }
    };

    fetchOrder();
  }, [customerId, orderId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await customerApi.updateOrder(customerId, orderId, formData);
      navigate(`/app/customers/${customerId}/orders/${orderId}`);
    } catch (err) {
      setError('Failed to update order');
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Edit Order</h2>
        </Col>
        <Col className="text-end">
          <Button variant="secondary" onClick={() => navigate(`/app/customers/${customerId}/orders/${orderId}`)}>
            Back to Order
          </Button>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valuation Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="building">Building Valuation</option>
                    <option value="contents">Contents Valuation</option>
                    <option value="both">Both Building and Contents</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Order Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="orderDate"
                    value={formData.orderDate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Broker Reference</Form.Label>
                  <Form.Control
                    type="text"
                    name="brokerReference"
                    value={formData.brokerReference}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Insurer Reference</Form.Label>
              <Form.Control
                type="text"
                name="insurerReference"
                value={formData.insurerReference}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="text-end">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Order'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditOrder; 