import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner, Modal, Table, InputGroup } from 'react-bootstrap';
import { orderApi, customerApi, propertyApi, insurerBrokerApi, __testHelpers } from '../services/api';
import riskTemplateApi from '../services/riskTemplateApi';

// Immediately run a test of the mock API
(async () => {
  try {
    console.log('======= INITIALIZATION TEST ========');
    console.log('DIRECT TEST - Mock risk templates:', __testHelpers.getMockRiskTemplates());
    const mockApiResponse = await __testHelpers.testGetRiskTemplates();
    console.log('DIRECT TEST - Mock API response:', mockApiResponse);
    console.log('======= END INITIALIZATION TEST ======');
  } catch (err) {
    console.error('DIRECT TEST - Error testing mock API:', err);
  }
})();

const NewOrder = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerId: '',
    propertyId: '',
    type: 'building',
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    priority: 'normal',
    status: 'pending',
    brokerReference: '',
    insurerReference: '',
    brokerId: '',
    insurerId: '',
    notes: '',
    riskTemplates: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [insurerBrokers, setInsurerBrokers] = useState([]);
  const [riskTemplates, setRiskTemplates] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewInsurerBrokerModal, setShowNewInsurerBrokerModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [newInsurerBrokerData, setNewInsurerBrokerData] = useState({
    name: '',
    type: 'broker',
    contactEmail: '',
    contactPhone: ''
  });
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Wrap staticTemplates in useMemo to avoid recreation on each render
  const staticTemplates = useMemo(() => [
    { id: 'static-1', name: 'INVENTORY', description: 'Detailed inventory of household items' },
    { id: 'static-2', name: 'DOMESTIC RISK', description: 'Residential property risk assessment' },
    { id: 'static-3', name: 'BUILDING', description: 'Building structure assessment' },
    { id: 'static-4', name: 'CONTENTS', description: 'Contents valuation' }
  ], []);

  // Add state to track if templates are loading
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersData, propertiesData, insurerBrokersData] = await Promise.all([
          customerApi.getAll(),
          propertyApi.getAll(),
          insurerBrokerApi.getAll()
        ]);
        setCustomers(customersData);
        setProperties(propertiesData);
        setInsurerBrokers(insurerBrokersData);
        setLoadingData(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (customerSearch) {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.phone.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.address.toLowerCase().includes(customerSearch.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customerSearch, customers]);

  useEffect(() => {
    // Prevent multiple API calls
    let isMounted = true;
    
    const fetchRiskTemplates = async () => {
      // Skip if already loading
      if (templatesLoading) return;
      
      try {
        // Set loading state to prevent duplicate calls
        setTemplatesLoading(true);
        console.log('====== FETCHING RISK TEMPLATES ======');
        console.log('Fetching risk templates from API at:', `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/risk-templates`);
        
        // Try to get templates from the API
        const templates = await riskTemplateApi.getAll();
        console.log('====== RECEIVED TEMPLATES ======');
        console.log('API Response Type:', Array.isArray(templates) ? 'Array' : typeof templates);
        console.log('Template Count:', templates ? templates.length : 0);
        console.log('Fetched risk templates from API:', templates);
        
        // Only update state if component is still mounted
        if (isMounted) {
          if (templates && templates.length > 0) {
            console.log('====== SETTING TEMPLATES FROM API ======');
            console.log('Setting templates from API:', templates);
            setRiskTemplates(templates);
          } else {
            // API returned empty data, use static templates as fallback
            console.log('====== FALLING BACK TO STATIC TEMPLATES ======');
            console.log('No templates from API, using static templates as fallback');
            setRiskTemplates(staticTemplates);
          }
        }
      } catch (err) {
        console.error('====== API ERROR ======');
        console.error('Failed to fetch risk templates:', err);
        console.error('Error details:', err.message);
        console.error('Stack:', err.stack);
        // Use static templates on error
        if (isMounted) {
          console.log('Error fetching templates, using static templates as fallback');
          setRiskTemplates(staticTemplates);
        }
      } finally {
        // Reset loading state
        if (isMounted) {
          console.log('====== TEMPLATES LOADING COMPLETE ======');
          setTemplatesLoading(false);
        }
      }
    };

    // Only fetch if we don't already have templates and aren't currently loading
    if (riskTemplates.length === 0 && !templatesLoading) {
      console.log('====== STARTING TEMPLATE FETCH ======');
      fetchRiskTemplates();
    } else {
      console.log('====== SKIPPING TEMPLATE FETCH ======');
      console.log('Templates already loaded or loading in progress');
      console.log('Current template count:', riskTemplates.length);
      console.log('Loading state:', templatesLoading);
    }
    
    // Cleanup function to prevent state updates if unmounted
    return () => {
      isMounted = false;
    };
  }, [staticTemplates, riskTemplates.length, templatesLoading]);

  useEffect(() => {
    console.log('====== TEMPLATES STATE UPDATED ======');
    console.log('Risk templates state updated:', riskTemplates);
    
    // Debug each template to verify the structure
    if (riskTemplates && riskTemplates.length > 0) {
      console.log(`Loaded ${riskTemplates.length} templates`);
      riskTemplates.forEach((template, index) => {
        console.log(`====== TEMPLATE ${index + 1} ======`);
        console.log('Full template object:', template);
        console.log('Template properties:', Object.keys(template).join(', '));
        console.log(`Display name:`, template.templatename || template.name || `Template ${index + 1}`);
        console.log(`ID:`, template.risktemplateid || template.id || `template-${index}`);
      });
    } else {
      console.log('====== NO TEMPLATES AVAILABLE ======');
    }
  }, [riskTemplates]);

  // FOR TESTING: Force some templates to be available if API fails  
  useEffect(() => {
    // If after 3 seconds we still don't have templates, add some test ones
    const timer = setTimeout(() => {
      if (riskTemplates.length === 0 && !templatesLoading) {
        console.log('====== ADDING TEST TEMPLATES ======');
        console.log('API templates not loaded after timeout, adding test templates');
        
        const testTemplates = [
          { risktemplateid: 'test-1', templatename: 'RESIDENTIAL BUILDING VALUATION', description: 'For residential properties' },
          { risktemplateid: 'test-2', templatename: 'INVENTORY', description: 'Detailed inventory assessment' },
          { risktemplateid: 'test-3', templatename: 'VEHICLE INSPECTION', description: 'Vehicle condition assessment' },
          { risktemplateid: 'test-4', templatename: 'DOMESTIC RISK', description: 'Home risk assessment' },
          { risktemplateid: 'test-5', templatename: 'HIGH SECURITY SURVEY', description: 'Advanced security assessment' }
        ];
        
        setRiskTemplates(testTemplates);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [riskTemplates.length, templatesLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewInsurerBrokerChange = (e) => {
    const { name, value } = e.target;
    setNewInsurerBrokerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateNewCustomer = async () => {
    try {
      const newCustomer = await customerApi.create(newCustomerData);
      setCustomers(prevCustomers => {
        if (!prevCustomers.some(customer => customer.id === newCustomer.id)) {
          return [...prevCustomers, newCustomer];
        }
        return prevCustomers;
      });
      setFormData(prev => ({
        ...prev,
        customerId: newCustomer.id
      }));
      setShowNewCustomerModal(false);
      setNewCustomerData({
        name: '',
        email: '',
        phone: '',
        address: ''
      });
    } catch (err) {
      setError('Failed to create new customer');
    }
  };

  const handleCreateNewInsurerBroker = async () => {
    try {
      const newInsurerBroker = await insurerBrokerApi.create(newInsurerBrokerData);
      setInsurerBrokers(prev => {
        if (!prev.some(item => item.id === newInsurerBroker.id)) {
          return [...prev, newInsurerBroker];
        }
        return prev;
      });
      setShowNewInsurerBrokerModal(false);
      setNewInsurerBrokerData({
        name: '',
        type: 'broker',
        contactEmail: '',
        contactPhone: ''
      });
    } catch (err) {
      setError('Failed to create new insurer/broker');
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerId: customer.id
    }));
    setShowCustomerModal(false);
  };

  const handleRiskTemplateChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    console.log('Selected template options:', selectedOptions);
    setFormData(prev => ({
      ...prev,
      riskTemplates: selectedOptions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await orderApi.create(formData);
      navigate('/app/orders');
    } catch (err) {
      setError('Failed to create order');
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Create New Order</h2>
        </Col>
        <Col className="text-end">
          <Button variant="secondary" onClick={() => navigate('/app/orders')}>
            Back to Orders
          </Button>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Customer</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      value={selectedCustomer ? selectedCustomer.name : ''}
                      placeholder="Select a customer"
                      readOnly
                      required
                    />
                    <Button
                      variant="outline-primary"
                      onClick={() => setShowCustomerModal(true)}
                    >
                      Select
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={() => setShowNewCustomerModal(true)}
                    >
                      New
                    </Button>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Property</Form.Label>
                  <Form.Select
                    name="propertyId"
                    value={formData.propertyId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a property</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.address}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Assessment Types</Form.Label>
                  <div className="mb-2">
                    <small className="text-muted">
                      {riskTemplates.length} templates available
                    </small>
                    {templatesLoading && (
                      <span className="ms-2">
                        <Spinner animation="border" size="sm" role="status" />
                        <small className="ms-1 text-primary">Loading templates...</small>
                      </span>
                    )}
                  </div>
                  
                  {/* React Bootstrap Form.Select */}
                  <Form.Select
                    name="riskTemplates"
                    value={formData.riskTemplates}
                    onChange={handleRiskTemplateChange}
                    required
                    multiple
                    size={4}
                    style={{ 
                      color: '#000', 
                      backgroundColor: '#fff',
                      border: '1px solid #ced4da',
                      borderRadius: '0.25rem',
                      padding: '0.375rem 0.75rem',
                      fontSize: '1rem',
                      lineHeight: '1.5'
                    }}
                    className="mb-3"
                    disabled={templatesLoading}
                  >
                    {/* Remove all hardcoded options */}
                    
                    {/* Render risk templates directly */}
                    {riskTemplates && riskTemplates.length > 0 ? (
                      riskTemplates.map((template, index) => {
                        // Use the 'templatename' property from the API response
                        const displayName = template.templatename || template.name || `Template ${index + 1}`;
                        const templateId = template.risktemplateid || template.id || `template-${index}`;
                        
                        return (
                          <option 
                            key={templateId} 
                            value={templateId}
                            style={{ 
                              padding: '10px', 
                              color: '#000',
                              fontWeight: 'bold',
                              backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                            }}
                          >
                            {displayName}
                          </option>
                        );
                      })
                    ) : (
                      <option disabled>{templatesLoading ? 'Loading assessment types...' : 'No assessment types available'}</option>
                    )}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Hold Ctrl (or Cmd on Mac) to select multiple assessment types
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Order Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="orderDate"
                    value={formData.orderDate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Broker</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Select
                      name="brokerId"
                      value={formData.brokerId}
                      onChange={handleChange}
                      required
                      className="flex-grow-1"
                    >
                      <option value="">Select a broker</option>
                      {insurerBrokers
                        .filter(item => item.type === 'broker')
                        .map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </Form.Select>
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        setNewInsurerBrokerData(prev => ({ ...prev, type: 'broker' }));
                        setShowNewInsurerBrokerModal(true);
                      }}
                    >
                      New
                    </Button>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Insurer</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Select
                      name="insurerId"
                      value={formData.insurerId}
                      onChange={handleChange}
                      required
                      className="flex-grow-1"
                    >
                      <option value="">Select an insurer</option>
                      {insurerBrokers
                        .filter(item => item.type === 'insurer')
                        .map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </Form.Select>
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        setNewInsurerBrokerData(prev => ({ ...prev, type: 'insurer' }));
                        setShowNewInsurerBrokerModal(true);
                      }}
                    >
                      New
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Broker Reference</Form.Label>
                  <Form.Control
                    type="text"
                    name="brokerReference"
                    value={formData.brokerReference}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Insurer Reference</Form.Label>
                  <Form.Control
                    type="text"
                    name="insurerReference"
                    value={formData.insurerReference}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="text-end">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Order'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* New Insurer/Broker Modal */}
      <Modal show={showNewInsurerBrokerModal} onHide={() => setShowNewInsurerBrokerModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New {newInsurerBrokerData.type === 'broker' ? 'Broker' : 'Insurer'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newInsurerBrokerData.name}
                onChange={handleNewInsurerBrokerChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contact Email</Form.Label>
              <Form.Control
                type="email"
                name="contactEmail"
                value={newInsurerBrokerData.contactEmail}
                onChange={handleNewInsurerBrokerChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contact Phone</Form.Label>
              <Form.Control
                type="tel"
                name="contactPhone"
                value={newInsurerBrokerData.contactPhone}
                onChange={handleNewInsurerBrokerChange}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewInsurerBrokerModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateNewInsurerBroker}>
            Create {newInsurerBrokerData.type === 'broker' ? 'Broker' : 'Insurer'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Customer Selection Modal */}
      <Modal 
        show={showCustomerModal} 
        onHide={() => setShowCustomerModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Select Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search customers by name, email, phone, or address"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </InputGroup>
          
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <Table striped hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.address}</td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        Select
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center">No customers found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCustomerModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* New Customer Modal */}
      <Modal show={showNewCustomerModal} onHide={() => setShowNewCustomerModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newCustomerData.name}
                onChange={handleNewCustomerChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={newCustomerData.email}
                onChange={handleNewCustomerChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="tel"
                name="phone"
                value={newCustomerData.phone}
                onChange={handleNewCustomerChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={newCustomerData.address}
                onChange={handleNewCustomerChange}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewCustomerModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateNewCustomer}>
            Create Customer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default NewOrder; 