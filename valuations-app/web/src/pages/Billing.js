import React, { useState } from 'react';
import { Card, Table, Button, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { Cash, Search, Plus } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';

function Billing() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'paid', 'pending'
    
    // Placeholder data - replace with actual data from API
    const invoices = [
        {
            id: 1,
            property: '123 Main St',
            date: '2024-03-15',
            amount: 500,
            type: 'Inspection Fee',
            status: 'Paid',
            client: 'John Doe'
        },
        {
            id: 2,
            property: '456 Oak Ave',
            date: '2024-03-18',
            amount: 1000,
            type: 'Valuation Fee',
            status: 'Pending',
            client: 'Jane Smith'
        },
        {
            id: 3,
            property: '789 Pine Rd',
            date: '2024-03-20',
            amount: 750,
            type: 'Inspection Fee',
            status: 'Overdue',
            client: 'Bob Johnson'
        }
    ];

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = 
            invoice.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.client.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = 
            filter === 'all' || 
            (filter === 'paid' && invoice.status === 'Paid') ||
            (filter === 'pending' && invoice.status !== 'Paid');
        
        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status) => {
        const variants = {
            'Paid': 'success',
            'Pending': 'warning',
            'Overdue': 'danger'
        };
        return variants[status] || 'secondary';
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Billing</h1>
                <Button as={Link} to="/app/billing/new" variant="primary">
                    <Plus className="me-2" />
                    Create Invoice
                </Button>
            </div>

            <Card>
                <Card.Body>
                    <Row className="mb-4">
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <Search />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search invoices..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={6}>
                            <Form.Select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All Invoices</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                            </Form.Select>
                        </Col>
                    </Row>

                    <Table hover responsive>
                        <thead>
                            <tr>
                                <th>Property</th>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(invoice => (
                                <tr key={invoice.id}>
                                    <td>{invoice.property}</td>
                                    <td>{invoice.date}</td>
                                    <td>{invoice.client}</td>
                                    <td>{invoice.type}</td>
                                    <td>${invoice.amount}</td>
                                    <td>
                                        <span className={`badge bg-${getStatusBadge(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td>
                                        <Button variant="outline-primary" size="sm" className="me-2">
                                            View
                                        </Button>
                                        {invoice.status !== 'Paid' && (
                                            <Button variant="outline-success" size="sm">
                                                Mark as Paid
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Row className="mt-4">
                <Col md={4}>
                    <Card className="text-white bg-success">
                        <Card.Body>
                            <h6 className="text-uppercase">Total Paid</h6>
                            <h3>$1,500</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-white bg-warning">
                        <Card.Body>
                            <h6 className="text-uppercase">Pending Payments</h6>
                            <h3>$1,000</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-white bg-danger">
                        <Card.Body>
                            <h6 className="text-uppercase">Overdue</h6>
                            <h3>$750</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default Billing; 