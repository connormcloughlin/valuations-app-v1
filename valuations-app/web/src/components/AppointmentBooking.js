import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Button, 
  Card, 
  Row, 
  Col, 
  InputGroup,
  Dropdown,
  Alert,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import { Calendar, X, Search, PeopleFill, Whatsapp } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { appointmentApi, orderApi, customerApi } from '../services/api';
import whatsappApi from '../services/whatsappApi';

const AppointmentBooking = ({ orderId, onClose, onSave, hideCustomerFields = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Form data - simplified to only contain appointment-specific fields
  const [appointment, setAppointment] = useState({
    orderId: orderId || '',
    surveyor: '',
    activateEvent: false,
    startDate: new Date().toISOString().split('T')[0],
    startTime: '12:00',
    endTime: '13:00',
    outOfTown: 'No',
    inviteStatus: 'New',
    meetingStatus: '',
    description: '',
    location: '',
    followUpDate: '',
    comments: '',
    arrivalTime: ''
  });
  
  const [orderData, setOrderData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [surveyTypes, setSurveyTypes] = useState([]);
  const [selectedSurveyTypes, setSelectedSurveyTypes] = useState([]);

  // Fetch order data if orderId is provided, just to get property location
  useEffect(() => {
    if (orderId) {
      setLoading(true);
      orderApi.getById(orderId)
        .then(data => {
          setOrderData(data);
          setAppointment(prev => ({
            ...prev,
            orderId: orderId,
            location: data.propertyAddress || data.property?.address || '',
          }));
          
          // Get customer data for WhatsApp notification
          return customerApi.getById(data.customerId);
        })
        .then(customer => {
          setCustomerData(customer);
          
          // Set survey types based on order type
          setSurveyTypes([
            { id: 1, name: 'Building Valuation' },
            { id: 2, name: 'Contents Valuation' },
            { id: 3, name: 'Specialty Items Valuation' }
          ]);
          
          // Pre-select survey type based on order.type if available
          if (orderData?.type === 'building') {
            setSelectedSurveyTypes([{ id: 1, name: 'Building Valuation' }]);
          } else if (orderData?.type === 'contents') {
            setSelectedSurveyTypes([{ id: 2, name: 'Contents Valuation' }]);
          } else if (orderData?.type === 'both') {
            setSelectedSurveyTypes([
              { id: 1, name: 'Building Valuation' },
              { id: 2, name: 'Contents Valuation' }
            ]);
          }
          
          setLoading(false);
        })
        .catch(err => {
          setError('Error loading order data');
          setLoading(false);
          console.error(err);
        });
    }
  }, [orderId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppointment(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSurveyTypeToggle = (surveyType) => {
    if (selectedSurveyTypes.some(type => type.id === surveyType.id)) {
      setSelectedSurveyTypes(selectedSurveyTypes.filter(type => type.id !== surveyType.id));
    } else {
      setSelectedSurveyTypes([...selectedSurveyTypes, surveyType]);
    }
  };
  
  const sendWhatsAppConfirmation = async (appointmentData) => {
    try {
      if (!customerData || !customerData.phone) {
        throw new Error('Customer phone number not available');
      }
      
      // Create order details object with customer info
      const orderDetails = {
        ...orderData,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customer: customerData
      };
      
      // Send WhatsApp confirmation
      const result = await whatsappApi.sendAppointmentConfirmation(appointmentData, orderDetails);
      
      // Show success toast
      setToastMessage('WhatsApp confirmation sent successfully!');
      setShowToast(true);
      
      return result;
    } catch (error) {
      console.error('Failed to send WhatsApp confirmation:', error);
      setToastMessage('Could not send WhatsApp confirmation. Please try again.');
      setShowToast(true);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Create appointment data with only the relevant fields
      const appointmentData = {
        ...appointment,
        surveyTypes: selectedSurveyTypes,
        status: 'scheduled'
      };
      
      // Create the appointment
      const response = await appointmentApi.create(appointmentData);
      
      // Send WhatsApp confirmation if activated
      if (appointment.activateEvent) {
        try {
          await sendWhatsAppConfirmation({
            ...appointmentData,
            id: response.id
          });
        } catch (whatsappError) {
          // Continue even if WhatsApp fails
          console.error('WhatsApp notification failed:', whatsappError);
        }
      }
      
      setSuccess(true);
      setLoading(false);
      
      // Call the onSave callback if provided
      if (onSave) {
        onSave(response);
      }
      
      // Navigate or close based on component usage
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setTimeout(() => {
          navigate(`/app/appointments`);
        }, 1500);
      }
    } catch (err) {
      setError('Failed to create appointment. Please try again.');
      setLoading(false);
      console.error(err);
    }
  };

  return (
    <>
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Book Appointment</h5>
          {onClose && (
            <Button variant="outline-secondary" size="sm" onClick={onClose}>
              <X />
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {loading && <p>Loading...</p>}
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">Appointment created successfully!</Alert>}
          
          {!loading && !success && (
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Surveyor *</Form.Label>
                    <InputGroup>
                      <Form.Control
                        required
                        type="text"
                        name="surveyor"
                        value={appointment.surveyor}
                        onChange={handleChange}
                        placeholder="Enter users separated with semicolons"
                      />
                      <Button variant="outline-secondary">
                        <PeopleFill />
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Survey Types</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {surveyTypes.map(type => (
                        <Button
                          key={type.id}
                          variant={selectedSurveyTypes.some(t => t.id === type.id) ? "primary" : "outline-primary"}
                          onClick={() => handleSurveyTypeToggle(type)}
                          size="sm"
                        >
                          {type.name}
                        </Button>
                      ))}
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <InputGroup className="align-items-center">
                      <Form.Check
                        type="checkbox"
                        id="activateEvent"
                        name="activateEvent"
                        checked={appointment.activateEvent}
                        onChange={handleChange}
                      />
                      <Form.Label className="mb-0 ms-2" htmlFor="activateEvent">
                        Activate the event to send invitations and updates. 
                        {customerData?.phone && (
                          <span className="text-success ms-2">
                            <Whatsapp className="mb-1" /> WhatsApp notification will be sent to {customerData.phone}
                          </span>
                        )}
                      </Form.Label>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Date *</Form.Label>
                    <InputGroup>
                      <Form.Control
                        required
                        type="date"
                        name="startDate"
                        value={appointment.startDate}
                        onChange={handleChange}
                      />
                      <Button variant="outline-secondary">
                        <Calendar />
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Time</Form.Label>
                    <InputGroup>
                      <Form.Select
                        name="startTime"
                        value={appointment.startTime.split(':')[0]}
                        onChange={(e) => setAppointment(prev => ({
                          ...prev,
                          startTime: `${e.target.value}:${appointment.startTime.split(':')[1]}`
                        }))}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i < 10 ? `0${i}` : i}>{i < 10 ? `0${i}` : i}</option>
                        ))}
                      </Form.Select>
                      <Form.Select
                        onChange={(e) => setAppointment(prev => ({
                          ...prev,
                          startTime: `${appointment.startTime.split(':')[0]}:${e.target.value}`
                        }))}
                        value={appointment.startTime.split(':')[1]}
                      >
                        <option value="00">00</option>
                        <option value="15">15</option>
                        <option value="30">30</option>
                        <option value="45">45</option>
                      </Form.Select>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>End Time</Form.Label>
                    <InputGroup>
                      <Form.Select
                        name="endTime"
                        value={appointment.endTime.split(':')[0]}
                        onChange={(e) => setAppointment(prev => ({
                          ...prev,
                          endTime: `${e.target.value}:${appointment.endTime.split(':')[1]}`
                        }))}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i < 10 ? `0${i}` : i}>{i < 10 ? `0${i}` : i}</option>
                        ))}
                      </Form.Select>
                      <Form.Select
                        onChange={(e) => setAppointment(prev => ({
                          ...prev,
                          endTime: `${appointment.endTime.split(':')[0]}:${e.target.value}`
                        }))}
                        value={appointment.endTime.split(':')[1]}
                      >
                        <option value="00">00</option>
                        <option value="15">15</option>
                        <option value="30">30</option>
                        <option value="45">45</option>
                      </Form.Select>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Out Of Town</Form.Label>
                    <Form.Select
                      name="outOfTown"
                      value={appointment.outOfTown}
                      onChange={handleChange}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Invite Status</Form.Label>
                    <Form.Select
                      name="inviteStatus"
                      value={appointment.inviteStatus}
                      onChange={handleChange}
                    >
                      <option value="New">New</option>
                      <option value="Sent">Sent</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Declined">Declined</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Meeting Status</Form.Label>
                    <Form.Control
                      type="text"
                      name="meetingStatus"
                      value={appointment.meetingStatus}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={appointment.description}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      name="location"
                      value={appointment.location}
                      onChange={handleChange}
                      placeholder="1335 WALTER AVENUE WAVERLEY PRETORIA GAUTENG"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Follow Up Date</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="date"
                        name="followUpDate"
                        value={appointment.followUpDate}
                        onChange={handleChange}
                      />
                      <Button variant="outline-secondary">
                        <Calendar />
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Order ID *</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      name="orderId"
                      value={appointment.orderId}
                      onChange={handleChange}
                      placeholder="48 898"
                      disabled={!!orderId}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Comments</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="comments"
                      value={appointment.comments}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-muted">
                      Click for help about adding basic HTML formatting.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Arrival Time</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="time"
                        name="arrivalTime"
                        value={appointment.arrivalTime}
                        onChange={handleChange}
                      />
                      <Button variant="outline-secondary">
                        <Calendar />
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
              
              <div className="d-flex justify-content-end mt-4">
                {onClose && (
                  <Button variant="outline-secondary" className="me-2" onClick={onClose}>
                    Cancel
                  </Button>
                )}
                <Button variant="primary" type="submit" disabled={loading}>
                  Save
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
        <Card.Footer className="text-muted">
          <small>Version: 1.0</small>
        </Card.Footer>
      </Card>
      
      <ToastContainer position="top-end" className="p-3">
        <Toast 
          onClose={() => setShowToast(false)} 
          show={showToast} 
          delay={5000} 
          autohide
          bg={toastMessage.includes('success') ? 'success' : 'danger'}
        >
          <Toast.Header>
            <strong className="me-auto">
              <Whatsapp className="me-2" />
              WhatsApp Notification
            </strong>
          </Toast.Header>
          <Toast.Body className={toastMessage.includes('success') ? 'text-white' : ''}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default AppointmentBooking; 