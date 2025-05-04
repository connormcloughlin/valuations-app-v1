import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Badge, Tabs, Tab } from 'react-bootstrap';
import { customerApi } from '../services/api';

const CustomerDetails = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [properties, setProperties] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerData, propertiesData, ordersData] = await Promise.all([
          customerApi.getById(customerId),
          customerApi.getProperties(customerId),
          customerApi.getOrders(customerId)
        ]);
        
        setCustomer(customerData);
        setProperties(propertiesData);
        setOrders(ordersData);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch customer data');
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!customer) return <div>Customer not found</div>;

  const getOrderTypeBadge = (type) => {
    const variants = {
      'building': 'primary',
      'contents': 'success',
      'both': 'info'
    };
    return <Badge bg={variants[type] || 'secondary'}>{type}</Badge>;
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Customer Details</h2>
        </Col>
        <Col className="text-end">
          <Button variant="secondary" onClick={() => navigate('/app/customers')}>
            Back to Customers
          </Button>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <h4>{customer.name}</h4>
              <p><strong>Email:</strong> {customer.email}</p>
              <p><strong>Phone:</strong> {customer.phone}</p>
              <p><strong>Address:</strong> {customer.address}</p>
            </Col>
            <Col md={6}>
              <p><strong>Company:</strong> {customer.company}</p>
              <p><strong>Broker:</strong> {customer.broker}</p>
              <p><strong>Insurer:</strong> {customer.insurer}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Tabs defaultActiveKey="properties" className="mb-3">
        <Tab eventKey="properties" title="Properties">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Properties</h4>
            <Button
              variant="primary"
              onClick={() => navigate(`/app/customers/${customerId}/properties/new`)}
            >
              Add Property
            </Button>
          </div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Address</th>
                <th>Building Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id}>
                  <td>{property.address}</td>
                  <td>{property.buildingType}</td>
                  <td>{property.status}</td>
                  <td>
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => navigate(`/app/customers/${customerId}/properties/${property.id}`)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>

        <Tab eventKey="orders" title="Orders">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Orders</h4>
            <Button
              variant="primary"
              onClick={() => navigate(`/app/customers/${customerId}/orders/new`)}
            >
              New Order
            </Button>
          </div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Order Date</th>
                <th>Type</th>
                <th>Property</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td>{getOrderTypeBadge(order.type)}</td>
                  <td>{order.property?.address || 'N/A'}</td>
                  <td>{order.status}</td>
                  <td>
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => navigate(`/app/customers/${customerId}/orders/${order.id}`)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default CustomerDetails; 