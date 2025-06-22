import React, { useState } from 'react';
import { Card, Table, Button, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { FileText, Search, Download } from 'react-bootstrap-icons';

function Reports() {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });
    
    // Placeholder data - replace with actual data from API
    const auditTrail = [
        {
            id: 1,
            action: 'Property Added',
            user: 'John Doe',
            date: '2024-03-15 10:30 AM',
            details: 'Added new property at 123 Main St'
        },
        {
            id: 2,
            action: 'Appointment Scheduled',
            user: 'Jane Smith',
            date: '2024-03-16 02:15 PM',
            details: 'Scheduled inspection for 456 Oak Ave'
        },
        {
            id: 3,
            action: 'Invoice Generated',
            user: 'John Doe',
            date: '2024-03-17 09:45 AM',
            details: 'Generated invoice #INV-2024-001'
        }
    ];

    const reports = [
        {
            id: 1,
            name: 'Monthly Property Report',
            type: 'PDF',
            date: '2024-03-01',
            size: '2.5 MB'
        },
        {
            id: 2,
            name: 'Financial Summary Q1 2024',
            type: 'Excel',
            date: '2024-03-15',
            size: '1.8 MB'
        },
        {
            id: 3,
            name: 'Appointment Analysis',
            type: 'PDF',
            date: '2024-03-20',
            size: '3.2 MB'
        }
    ];

    const filteredAuditTrail = auditTrail.filter(entry =>
        entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.details.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGenerateReport = (type) => {
        // Implement report generation logic
        console.log(`Generating ${type} report...`);
    };

    return (
        <div>
            <h1 className="mb-4">Reports</h1>

            <Row className="mb-4">
                <Col md={4}>
                    <Card>
                        <Card.Body>
                            <h5 className="mb-3">Generate Report</h5>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Report Type</Form.Label>
                                    <Form.Select>
                                        <option>Property Report</option>
                                        <option>Financial Report</option>
                                        <option>Appointment Report</option>
                                        <option>Audit Trail</option>
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date Range</Form.Label>
                                    <Row>
                                        <Col>
                                            <Form.Control
                                                type="date"
                                                name="start"
                                                value={dateRange.start}
                                                onChange={handleDateChange}
                                            />
                                        </Col>
                                        <Col>
                                            <Form.Control
                                                type="date"
                                                name="end"
                                                value={dateRange.end}
                                                onChange={handleDateChange}
                                            />
                                        </Col>
                                    </Row>
                                </Form.Group>
                                <Button variant="primary" className="w-100">
                                    Generate Report
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={8}>
                    <Card>
                        <Card.Body>
                            <h5 className="mb-3">Available Reports</h5>
                            <Table hover>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Date</th>
                                        <th>Size</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map(report => (
                                        <tr key={report.id}>
                                            <td>{report.name}</td>
                                            <td>{report.type}</td>
                                            <td>{report.date}</td>
                                            <td>{report.size}</td>
                                            <td>
                                                <Button variant="outline-primary" size="sm">
                                                    <Download className="me-1" />
                                                    Download
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card>
                <Card.Header>
                    <h5 className="mb-0">Audit Trail</h5>
                </Card.Header>
                <Card.Body>
                    <InputGroup className="mb-3">
                        <InputGroup.Text>
                            <Search />
                        </InputGroup.Text>
                        <Form.Control
                            placeholder="Search audit trail..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    <Table hover responsive>
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>User</th>
                                <th>Date</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAuditTrail.map(entry => (
                                <tr key={entry.id}>
                                    <td>{entry.action}</td>
                                    <td>{entry.user}</td>
                                    <td>{entry.date}</td>
                                    <td>{entry.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </div>
    );
}

export default Reports; 