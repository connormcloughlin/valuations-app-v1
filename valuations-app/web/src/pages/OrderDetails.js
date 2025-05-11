import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Table } from 'react-bootstrap';
import { appointmentApi } from '../services/api';
import orderFormApi from '../services/orderFormApi';
import { Calendar } from 'react-bootstrap-icons';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching order details for ID:', orderId);
        // Fetch order details using the new API
        const orderData = await orderFormApi.getOrderById(orderId);
        console.log('Order data received:', orderData);
        
        if (orderData.error) {
          throw new Error(orderData.errorMessage || 'Failed to fetch order details');
        }
        
        setOrder(orderData);
        
        // Fetch appointments for this order
        const allAppointments = await appointmentApi.getAll();
        const orderAppointments = allAppointments.filter(
          appointment => appointment.orderId === orderId
        );
        setAppointments(orderAppointments);
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch order details:', err);
        setError('Failed to fetch order details. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

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

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
  
  if (error) return (
    <Alert variant="danger" className="mt-3">
      <Alert.Heading>Error Loading Order Details</Alert.Heading>
      <p>{error}</p>
      <hr />
      <div className="d-flex justify-content-end">
        <Button onClick={() => window.location.reload()} variant="outline-danger">
          Retry
        </Button>
      </div>
    </Alert>
  );
  
  if (!order) return (
    <Alert variant="warning">
      <Alert.Heading>Order Not Found</Alert.Heading>
      <p>The requested order could not be found. It may have been deleted or you may not have permission to view it.</p>
      <hr />
      <div className="d-flex justify-content-end">
        <Button onClick={() => navigate('/app/orders')} variant="outline-primary">
          Back to Orders
        </Button>
      </div>
    </Alert>
  );

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Order Details</h2>
        </Col>
        <Col className="text-end">
          <Button variant="secondary" onClick={() => navigate(`/app/customers/${order.customerId}`)}>
            Back to Customer
          </Button>
        </Col>
      </Row>

      <Card>
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
              variant="success"
              className="me-2"
              onClick={() => navigate(`/app/orders/${orderId}/book-appointment`)}
            >
              <Calendar className="me-1" />
              Book Appointment
            </Button>
            <Button
              variant="secondary"
              className="me-2"
              onClick={() => navigate(`/app/orders/${orderId}/edit`)}
            >
              Edit Order
            </Button>
            <Button
              variant="danger"
              onClick={() => navigate(`/app/orders/${orderId}/delete`)}
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
                    <td>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'Not set'}</td>
                  </tr>
                  <tr>
                    <td><strong>Due Date:</strong></td>
                    <td>{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'Not set'}</td>
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
                    <td>{order.propertyAddress || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Property Type:</strong></td>
                    <td>{order.propertyType || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Year Built:</strong></td>
                    <td>{order.yearBuilt || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Number of Bedrooms:</strong></td>
                    <td>{order.numberOfBedrooms || 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col>
              <h4>Customer Information</h4>
              <Table borderless>
                <tbody>
                  <tr>
                    <td><strong>Customer Name:</strong></td>
                    <td>{order.customerName || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Policy Number:</strong></td>
                    <td>{order.policyNumber || 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
          
          <Row className="mt-4">
            <Col>
              <h4>Occupier Information</h4>
              <Table borderless>
                <tbody>
                  <tr>
                    <td><strong>Occupier Name:</strong></td>
                    <td>{order.occupierName || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Phone Number:</strong></td>
                    <td>{order.occupierPhoneNumber || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Email:</strong></td>
                    <td>{order.occupierEmail || 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col>
              <h4>Insurance Information</h4>
              <Table borderless>
                <tbody>
                  <tr>
                    <td><strong>Buildings Sum Insured:</strong></td>
                    <td>£{order.buildingSumInsured ? parseFloat(order.buildingSumInsured).toLocaleString() : '0'}</td>
                  </tr>
                  <tr>
                    <td><strong>Contents Sum Insured:</strong></td>
                    <td>£{order.contentsSumInsured ? parseFloat(order.contentsSumInsured).toLocaleString() : '0'}</td>
                  </tr>
                  <tr>
                    <td><strong>Broker Reference:</strong></td>
                    <td>{order.brokerReference || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Broker Name:</strong></td>
                    <td>{order.brokerName || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Insurer Reference:</strong></td>
                    <td>{order.insurerReference || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Insurer Name:</strong></td>
                    <td>{order.insurerName || 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          {appointments.length > 0 && (
            <Row className="mt-4">
              <Col>
                <h4>Scheduled Appointments</h4>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Surveyor</th>
                      <th>Survey Types</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{new Date(appointment.date).toLocaleDateString()}</td>
                        <td>{appointment.time}</td>
                        <td>{appointment.surveyor || 'TBD'}</td>
                        <td>{appointment.surveyTypes || order.type}</td>
                        <td>
                          <Badge bg={appointment.status === 'completed' ? 'success' : 'primary'}>
                            {appointment.status}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => navigate(`/app/appointments/${appointment.id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
          )}

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