import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Container, Row, Col, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { orderApi } from '../services/api';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await orderApi.getAll();
                setOrders(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch orders');
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getStatusBadge = (status) => {
        const variants = {
            'pending': 'warning',
            'in_progress': 'info',
            'completed': 'success',
            'cancelled': 'danger'
        };
        return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
    };

    const getPriorityBadge = (priority) => {
        const variants = {
            'low': 'secondary',
            'normal': 'primary',
            'high': 'danger'
        };
        return <Badge bg={variants[priority] || 'secondary'}>{priority}</Badge>;
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
                    <h2>Orders</h2>
                </Col>
                <Col className="text-end">
                    <Button variant="primary" onClick={() => navigate('/app/orders/new')}>
                        New Order
                    </Button>
                </Col>
            </Row>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Reference</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td>{order.brokerReference}</td>
                            <td>{order.type}</td>
                            <td>{getStatusBadge(order.status)}</td>
                            <td>{getPriorityBadge(order.priority)}</td>
                            <td>{new Date(order.dueDate).toLocaleDateString()}</td>
                            <td>
                                <Button
                                    variant="info"
                                    size="sm"
                                    onClick={() => navigate(`/app/orders/${order.id}`)}
                                    className="me-2"
                                >
                                    View
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => navigate(`/app/orders/${order.id}/contents-valuation`)}
                                >
                                    Contents
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => navigate(`/app/orders/${order.id}/edit`)}
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

export default Orders; 