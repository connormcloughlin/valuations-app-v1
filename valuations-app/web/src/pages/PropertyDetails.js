import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Tabs, Tab, Row, Col, Button, Form, Table } from 'react-bootstrap';
import { Building, Calendar, FileText, Cash } from 'react-bootstrap-icons';

function PropertyDetails() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('details');
    
    // Placeholder data - replace with actual data from API
    const property = {
        id: id,
        address: '123 Main St',
        type: 'Residential',
        status: 'Active',
        description: 'A beautiful 3-bedroom house with a garden',
        size: '2000 sq ft',
        yearBuilt: 1995,
        owner: 'John Doe',
        contact: 'john@example.com',
        phone: '123-456-7890'
    };

    const appointments = [
        {
            id: 1,
            date: '2024-03-20',
            time: '10:00 AM',
            type: 'Inspection',
            status: 'Scheduled'
        },
        {
            id: 2,
            date: '2024-03-25',
            time: '02:00 PM',
            type: 'Valuation',
            status: 'Pending'
        }
    ];

    const bills = [
        {
            id: 1,
            date: '2024-03-15',
            amount: 500,
            status: 'Paid',
            type: 'Inspection Fee'
        },
        {
            id: 2,
            date: '2024-03-20',
            amount: 1000,
            status: 'Pending',
            type: 'Valuation Fee'
        }
    ];

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Property Details</h1>
                <Button variant="primary">Edit Property</Button>
            </div>

            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <h5 className="mb-3">Basic Information</h5>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control plaintext readOnly defaultValue={property.address} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Type</Form.Label>
                                    <Form.Control plaintext readOnly defaultValue={property.type} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Control plaintext readOnly defaultValue={property.status} />
                                </Form.Group>
                            </Form>
                        </Col>
                        <Col md={6}>
                            <h5 className="mb-3">Owner Information</h5>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Owner Name</Form.Label>
                                    <Form.Control plaintext readOnly defaultValue={property.owner} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Contact Email</Form.Label>
                                    <Form.Control plaintext readOnly defaultValue={property.contact} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Phone Number</Form.Label>
                                    <Form.Control plaintext readOnly defaultValue={property.phone} />
                                </Form.Group>
                            </Form>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
            >
                <Tab eventKey="details" title={<><Building className="me-2" />Details</>}>
                    <Card>
                        <Card.Body>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        plaintext
                                        readOnly
                                        defaultValue={property.description}
                                    />
                                </Form.Group>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Size</Form.Label>
                                            <Form.Control plaintext readOnly defaultValue={property.size} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Year Built</Form.Label>
                                            <Form.Control plaintext readOnly defaultValue={property.yearBuilt} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>
                </Tab>
                <Tab eventKey="appointments" title={<><Calendar className="me-2" />Appointments</>}>
                    <Card>
                        <Card.Body>
                            <Table hover>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.map(appointment => (
                                        <tr key={appointment.id}>
                                            <td>{appointment.date}</td>
                                            <td>{appointment.time}</td>
                                            <td>{appointment.type}</td>
                                            <td>
                                                <span className={`badge bg-${appointment.status === 'Scheduled' ? 'success' : 'warning'}`}>
                                                    {appointment.status}
                                                </span>
                                            </td>
                                            <td>
                                                <Button variant="outline-primary" size="sm">
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>
                <Tab eventKey="billing" title={<><Cash className="me-2" />Billing</>}>
                    <Card>
                        <Card.Body>
                            <Table hover>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bills.map(bill => (
                                        <tr key={bill.id}>
                                            <td>{bill.date}</td>
                                            <td>{bill.type}</td>
                                            <td>${bill.amount}</td>
                                            <td>
                                                <span className={`badge bg-${bill.status === 'Paid' ? 'success' : 'warning'}`}>
                                                    {bill.status}
                                                </span>
                                            </td>
                                            <td>
                                                <Button variant="outline-primary" size="sm">
                                                    View Invoice
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </div>
    );
}

export default PropertyDetails; 