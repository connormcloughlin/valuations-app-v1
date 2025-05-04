import React, { useState } from 'react';
import { Card, Table, Button, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { Calendar, Search, Plus } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';

function Appointments() {
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState('list'); // 'list' or 'calendar'
    
    // Placeholder data - replace with actual data from API
    const appointments = [
        {
            id: 1,
            property: '123 Main St',
            date: '2024-03-20',
            time: '10:00 AM',
            type: 'Inspection',
            status: 'Scheduled',
            client: 'John Doe'
        },
        {
            id: 2,
            property: '456 Oak Ave',
            date: '2024-03-22',
            time: '02:00 PM',
            type: 'Valuation',
            status: 'Pending',
            client: 'Jane Smith'
        },
        {
            id: 3,
            property: '789 Pine Rd',
            date: '2024-03-25',
            time: '11:00 AM',
            type: 'Inspection',
            status: 'Completed',
            client: 'Bob Johnson'
        }
    ];

    const filteredAppointments = appointments.filter(appointment =>
        appointment.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.client.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Appointments</h1>
                <Button as={Link} to="/app/appointments/new" variant="primary">
                    <Plus className="me-2" />
                    Schedule Appointment
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
                                    placeholder="Search appointments..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={6}>
                            <div className="d-flex justify-content-end">
                                <Button
                                    variant={view === 'list' ? 'primary' : 'outline-primary'}
                                    className="me-2"
                                    onClick={() => setView('list')}
                                >
                                    List View
                                </Button>
                                <Button
                                    variant={view === 'calendar' ? 'primary' : 'outline-primary'}
                                    onClick={() => setView('calendar')}
                                >
                                    Calendar View
                                </Button>
                            </div>
                        </Col>
                    </Row>

                    {view === 'list' ? (
                        <Table hover responsive>
                            <thead>
                                <tr>
                                    <th>Property</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Type</th>
                                    <th>Client</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.map(appointment => (
                                    <tr key={appointment.id}>
                                        <td>{appointment.property}</td>
                                        <td>{appointment.date}</td>
                                        <td>{appointment.time}</td>
                                        <td>{appointment.type}</td>
                                        <td>{appointment.client}</td>
                                        <td>
                                            <span className={`badge bg-${appointment.status === 'Scheduled' ? 'success' : appointment.status === 'Pending' ? 'warning' : 'info'}`}>
                                                {appointment.status}
                                            </span>
                                        </td>
                                        <td>
                                            <Button variant="outline-primary" size="sm">
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <div className="text-center py-5">
                            <Calendar size={48} className="text-muted mb-3" />
                            <h4>Calendar View Coming Soon</h4>
                            <p className="text-muted">We're working on implementing the calendar view feature.</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}

export default Appointments; 