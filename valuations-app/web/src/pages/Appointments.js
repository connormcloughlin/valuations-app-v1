import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Row, Col, InputGroup, Badge, Modal } from 'react-bootstrap';
import { Calendar, Search, Plus, PencilFill, TrashFill } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { appointmentApi } from '../services/api';
import AppointmentBooking from '../components/AppointmentBooking';

function Appointments() {
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState('list'); // 'list' or 'calendar'
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    
    useEffect(() => {
        fetchAppointments();
    }, []);
    
    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const data = await appointmentApi.getAll();
            setAppointments(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError('Failed to load appointments. Please try again.');
            setLoading(false);
        }
    };
    
    const handleDeleteAppointment = async (id) => {
        if (window.confirm('Are you sure you want to delete this appointment?')) {
            try {
                await appointmentApi.delete(id);
                fetchAppointments();
            } catch (err) {
                console.error('Error deleting appointment:', err);
                setError('Failed to delete appointment. Please try again.');
            }
        }
    };
    
    const handleEditAppointment = (appointment) => {
        setSelectedAppointment(appointment);
        setShowBookingModal(true);
    };
    
    const handleCloseBookingModal = () => {
        setShowBookingModal(false);
        setSelectedAppointment(null);
    };
    
    const handleSaveAppointment = () => {
        fetchAppointments();
        setShowBookingModal(false);
        setSelectedAppointment(null);
    };

    const filteredAppointments = appointments.filter(appointment =>
        (appointment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.orderId?.toString().includes(searchTerm))
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

                    {loading ? (
                        <p>Loading appointments...</p>
                    ) : error ? (
                        <div className="alert alert-danger">{error}</div>
                    ) : view === 'list' ? (
                        <Table hover responsive>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Location</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Survey Types</th>
                                    <th>Surveyor</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center">No appointments found</td>
                                    </tr>
                                ) : (
                                    filteredAppointments.map(appointment => (
                                        <tr key={appointment.id}>
                                            <td>{appointment.orderId}</td>
                                            <td>{appointment.customerName}</td>
                                            <td>{appointment.location}</td>
                                            <td>{appointment.startDate}</td>
                                            <td>{appointment.startTime}</td>
                                            <td>
                                                {appointment.surveyTypes?.map(type => (
                                                    <Badge 
                                                        key={type.id} 
                                                        bg="info" 
                                                        className="me-1"
                                                    >
                                                        {type.name}
                                                    </Badge>
                                                ))}
                                            </td>
                                            <td>{appointment.surveyor}</td>
                                            <td>
                                                <Badge 
                                                    bg={
                                                        appointment.status === 'scheduled' ? 'success' : 
                                                        appointment.status === 'completed' ? 'secondary' : 
                                                        appointment.status === 'cancelled' ? 'danger' : 
                                                        'warning'
                                                    }
                                                >
                                                    {appointment.status}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleEditAppointment(appointment)}
                                                >
                                                    <PencilFill />
                                                </Button>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => handleDeleteAppointment(appointment.id)}
                                                >
                                                    <TrashFill />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
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
            
            {/* Appointment Booking Modal */}
            <Modal 
                show={showBookingModal} 
                onHide={handleCloseBookingModal}
                size="xl"
                centered
            >
                <Modal.Body>
                    <AppointmentBooking 
                        orderId={selectedAppointment?.orderId}
                        onClose={handleCloseBookingModal}
                        onSave={handleSaveAppointment}
                    />
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default Appointments; 