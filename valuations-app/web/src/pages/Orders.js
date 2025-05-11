import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Container, Row, Col, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import orderFormApi from '../services/orderFormApi';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        pageSize: 20,
        totalCount: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                console.log('Fetching orders...');
                const response = await orderFormApi.getOrders(pagination.currentPage, pagination.pageSize);
                console.log('Order response:', response);
                
                if (!response || !response.orders) {
                    throw new Error('Invalid response format from API');
                }
                
                setOrders(response.orders);
                setPagination({
                    currentPage: response.currentPage || 1,
                    totalPages: response.totalPages || 1,
                    pageSize: response.pageSize || 20,
                    totalCount: response.totalCount || 0
                });
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch orders:', err);
                // Check for specific error types to provide better messages
                if (err.response) {
                    console.error('Error response data:', err.response.data);
                    console.error('Error response status:', err.response.status);
                    setError(`Failed to fetch orders. Server returned: ${err.response.status} ${err.response.statusText}`);
                } else if (err.request) {
                    console.error('Error request:', err.request);
                    setError('Failed to fetch orders. No response received from the server.');
                } else {
                    console.error('Error message:', err.message);
                    setError(`Failed to fetch orders: ${err.message}`);
                }
                setLoading(false);
            }
        };

        fetchOrders();
    }, [pagination.currentPage, pagination.pageSize]);

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

    // Function to get the reference display - prioritize showing the order ID
    const getOrderReference = (order) => {
        // Ensure we use the order ID as the primary reference
        return order.id ? `#${order.id}` : 'New Order';
    };

    // Function to format customer name appropriately
    const formatCustomerName = (order) => {
        if (!order) return 'Unknown';
        
        // eslint-disable-next-line no-unused-vars
        const { customerName, customerId, id } = order;
        
        // Add debugging information to the console
        console.log(`Formatting name for order #${id}:`, {
            customerName,
            customerId,
            originalData: order.originalData ? 
                Object.keys(order.originalData).filter(k => k.toLowerCase().includes('name')).map(k => 
                    `${k}: ${order.originalData[k]}`) : 'No original data'
        });
        
        // If we have a valid customer name that's not a placeholder, use it
        if (customerName && 
            typeof customerName === 'string' &&
            customerName.trim() !== '' &&
            !customerName.startsWith('Client') && 
            !customerName.startsWith('Unknown') &&
            !customerName.startsWith('Order #')) {
            return customerName;
        }
        
        // Otherwise, use a better fallback that's not "Client [number]"
        return `Order #${id}`;
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
                <Alert.Heading>Error Loading Orders</Alert.Heading>
                <p>{error}</p>
                <hr />
                <div className="d-flex justify-content-end">
                    <Button onClick={() => window.location.reload()} variant="outline-danger">
                        Retry
                    </Button>
                </div>
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

            {/* Debugging Panel - Remove in production */}
            <div style={{background: '#f8f9fa', padding: '10px', marginBottom: '20px', border: '1px solid #ddd'}}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0">Debug Information</h5>
                    <div>
                        <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => {
                                console.clear();
                                console.log("Debug logs cleared");
                            }}
                            className="me-2"
                        >
                            Clear Logs
                        </Button>
                        <Button 
                            size="sm" 
                            variant="outline-secondary"
                            onClick={() => window.location.reload()}
                        >
                            Refresh Data
                        </Button>
                    </div>
                </div>
                <p>First 2 orders customer data:</p>
                <pre style={{fontSize: '12px', maxHeight: '200px', overflowY: 'auto'}}>
                    {JSON.stringify(orders.slice(0, 2).map(o => ({
                        id: o.id,
                        customerId: o.customerId,
                        rawCustomerName: o.customerName,
                        formattedDisplay: formatCustomerName(o),
                        customerIdType: typeof o.customerId,
                        lookupTroubleshooting: {
                            hasCustomerId: !!o.customerId,
                            customerIdIsValidFormat: /^\d+$/.test(String(o.customerId)),
                            customerIdToString: String(o.customerId)
                        }
                    })), null, 2)}
                </pre>
                <div className="mt-2">
                    <p className="mb-1"><strong>Current customerId lookup process:</strong></p>
                    <ol className="ps-3" style={{fontSize: '12px'}}>
                        <li>orderFormApi extracts customerId from order data</li>
                        <li>orderFormApi calls entitiesApi.getCustomerByIdCached(customerId)</li>
                        <li>entitiesApi tries 3 endpoints: /entities/:id, /api/order-form/client/:id, and orders lookup</li>
                        <li>Customer name is returned to the UI and displayed in the table</li>
                    </ol>
                </div>
            </div>

            {orders.length === 0 ? (
                <Alert variant="info">
                    No orders found. Create a new order to get started.
                </Alert>
            ) : (
                <>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
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
                                    <td>{getOrderReference(order)}</td>
                                    <td>{formatCustomerName(order)}</td>
                                    <td>{order.type}</td>
                                    <td>{getStatusBadge(order.status)}</td>
                                    <td>{getPriorityBadge(order.priority)}</td>
                                    <td>{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'Not set'}</td>
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
                                            className="me-2"
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

                    {pagination.totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Button
                                variant="outline-primary"
                                disabled={pagination.currentPage === 1}
                                onClick={() => setPagination({...pagination, currentPage: pagination.currentPage - 1})}
                                className="me-2"
                            >
                                Previous
                            </Button>
                            <span className="align-self-center mx-2">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline-primary"
                                disabled={pagination.currentPage === pagination.totalPages}
                                onClick={() => setPagination({...pagination, currentPage: pagination.currentPage + 1})}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
};

export default Orders; 