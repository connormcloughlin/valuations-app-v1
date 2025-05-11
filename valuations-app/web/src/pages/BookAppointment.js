import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Row, Col, Table, Badge } from 'react-bootstrap';
import AppointmentBooking from '../components/AppointmentBooking';
import { orderApi, customerApi } from '../services/api';

const BookAppointment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId) {
      setLoading(true);
      orderApi.getById(orderId)
        .then(data => {
          setOrder(data);
          return customerApi.getById(data.customerId);
        })
        .then(customerData => {
          setCustomer(customerData);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching order:', err);
          setError('Could not load order details. Please try again later.');
          setLoading(false);
        });
    }
  }, [orderId]);

  const handleAppointmentSaved = () => {
    // Navigate back to order details after saving
    setTimeout(() => {
      navigate(`/app/orders/${orderId}`);
    }, 1500);
  };

  return (
    <Container>
      <h1 className="mb-4">Book Appointment</h1>
      
      {loading && <p>Loading order details...</p>}
      
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}
      
      {!loading && order && customer && (
        <>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Order Summary</Card.Title>
              
              <Row className="mb-3">
                <Col md={6}>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td><strong>Order ID:</strong></td>
                        <td>{order.id}</td>
                      </tr>
                      <tr>
                        <td><strong>Customer:</strong></td>
                        <td>{customer.name || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Property:</strong></td>
                        <td>{order.propertyAddress || order.property?.address || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Type:</strong></td>
                        <td>
                          <Badge bg={
                            order.type === 'building' ? 'primary' : 
                            order.type === 'contents' ? 'success' : 
                            'info'
                          }>
                            {order.type || 'N/A'}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Status:</strong></td>
                        <td>
                          <Badge bg={
                            order.status === 'pending' ? 'warning' : 
                            order.status === 'in_progress' ? 'primary' : 
                            order.status === 'completed' ? 'success' : 
                            'secondary'
                          }>
                            {order.status || 'N/A'}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td><strong>Client E-mail:</strong></td>
                        <td>{customer.email || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Client Phone:</strong></td>
                        <td>{customer.phone || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Client Cell:</strong></td>
                        <td>{customer.phone || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Category:</strong></td>
                        <td>Inventory</td>
                      </tr>
                      <tr>
                        <td><strong>Broker:</strong></td>
                        <td>{order.brokerReference || 'DISCOVERY DIRECT'}</td>
                      </tr>
                      <tr>
                        <td><strong>Insurer:</strong></td>
                        <td>{order.insurerReference || 'DISCOVERY INSURE - CONTENTS'}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <AppointmentBooking 
            orderId={orderId}
            customer={customer}
            order={order}
            hideCustomerFields={true}
            onSave={handleAppointmentSaved}
          />
        </>
      )}
    </Container>
  );
};

export default BookAppointment; 