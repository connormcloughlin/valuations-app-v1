import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Container, Row, Col, Button, Badge } from 'react-bootstrap';
import { customerApi } from '../services/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerApi.getAll();
        setCustomers(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch customers');
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Customers</h2>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => navigate('/app/customers/new')}>
            Add New Customer
          </Button>
        </Col>
      </Row>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Properties</th>
            <th>Orders</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
              <td>
                <Badge bg="info">{customer.properties?.length || 0}</Badge>
              </td>
              <td>
                <Badge bg="success">{customer.orders?.length || 0}</Badge>
              </td>
              <td>
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => navigate(`/app/customers/${customer.id}`)}
                  className="me-2"
                >
                  View
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/app/customers/${customer.id}/properties/new`)}
                >
                  Add Property
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default Customers; 