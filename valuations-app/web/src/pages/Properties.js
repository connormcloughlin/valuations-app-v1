import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Container, Row, Col, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { propertyApi } from '../services/api';

const Properties = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const data = await propertyApi.getAll();
                setProperties(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch properties');
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    const getStatusBadge = (status) => {
        const variants = {
            'active': 'success',
            'inactive': 'danger',
            'pending': 'warning'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="mt-3">
                {error}
            </Alert>
        );
    }

    return (
        <Container>
            <Row className="mb-4">
                <Col>
                    <h2>Properties</h2>
                </Col>
                <Col className="text-end">
                    <Button variant="primary" onClick={() => navigate('/app/properties/new')}>
                        Add New Property
                    </Button>
                </Col>
            </Row>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Address</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {properties.map((property) => (
                        <tr key={property.id}>
                            <td>{property.address}</td>
                            <td>{property.type}</td>
                            <td>{getStatusBadge(property.status)}</td>
                            <td>
                                <Button
                                    variant="info"
                                    size="sm"
                                    onClick={() => navigate(`/app/properties/${property.id}`)}
                                    className="me-2"
                                >
                                    View
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => navigate(`/app/properties/${property.id}/edit`)}
                                >
                                    Edit
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
};

export default Properties; 