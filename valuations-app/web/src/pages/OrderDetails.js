import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Table } from 'react-bootstrap';
import { customerApi } from '../services/api';

const OrderDetails = () => {
  const { customerId, orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await customerApi.getOrderById(customerId, orderId);
        setOrder(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch order details');
        setLoading(false);
      }
    };

    fetchOrder();
  }, [customerId, orderId]);

  const getOrderTypeBadge = (type) => {
    const variants = {
      'building': 'primary',
      'contents': 'success',
      'both': 'info'
    };
    return <Badge bg={variants[type] || 'secondary'}>{type}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      'low': 'secondary',
      'normal': 'info',
      'high': 'danger'
    };
    return <Badge bg={variants[priority] || 'secondary'}>{priority}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      'pending': 'warning',
      'in_progress': 'info',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!order) return <Alert variant="warning">Order not found</Alert>;

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Order Details</h2>
        </Col>
        <Col className="text-end">
          <Button variant="secondary" onClick={() => navigate(`/app/customers/${customerId}`)}>
            Back to Customer
          </Button>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h3>Order Information</h3>
          <div>
            <Button
              variant="primary"
              className="me-2"
              onClick={() => navigate(`/app/orders/${orderId}/contents-valuation`)}
            >
              Contents Valuation
            </Button>
            <Button
              variant="secondary"
              className="me-2"
              onClick={() => navigate(`/app/customers/${customerId}/orders/${orderId}/edit`)}
            >
              Edit Order
            </Button>
            <Button
              variant="danger"
              onClick={() => navigate(`/app/customers/${customerId}/orders/${orderId}/delete`)}
            >
              Delete Order
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h4>Order Information</h4>
              <Table borderless>
                <tbody>
                  <tr>
                    <td><strong>Order Date:</strong></td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Due Date:</strong></td>
                    <td>{new Date(order.dueDate).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Type:</strong></td>
                    <td>{getOrderTypeBadge(order.type)}</td>
                  </tr>
                  <tr>
                    <td><strong>Priority:</strong></td>
                    <td>{getPriorityBadge(order.priority)}</td>
                  </tr>
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td>{getStatusBadge(order.status)}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
            <Col md={6}>
              <h4>Property Details</h4>
              <Table borderless>
                <tbody>
                  <tr>
                    <td><strong>Address:</strong></td>
                    <td>{order.property?.address}</td>
                  </tr>
                  <tr>
                    <td><strong>Building Type:</strong></td>
                    <td>{order.property?.buildingType}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col>
              <h4>References</h4>
              <Table borderless>
                <tbody>
                  <tr>
                    <td><strong>Broker Reference:</strong></td>
                    <td>{order.brokerReference || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Insurer Reference:</strong></td>
                    <td>{order.insurerReference || 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          {order.notes && (
            <Row className="mt-4">
              <Col>
                <h4>Notes</h4>
                <p>{order.notes}</p>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderDetails; 