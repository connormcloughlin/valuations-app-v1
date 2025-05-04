import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Spinner, Alert } from 'react-bootstrap';
import { Building, Calendar, Cash, FileText } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';

function Dashboard() {
    const [summaryData, setSummaryData] = useState({
        properties: 0,
        appointments: 0,
        pendingBills: 0,
        reports: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [summaryResponse, activityResponse] = await Promise.all([
                    dashboardApi.getSummary(),
                    dashboardApi.getRecentActivity()
                ]);
                setSummaryData(summaryResponse.data);
                setRecentActivity(activityResponse.data);
            } catch (err) {
                setError('Failed to load dashboard data');
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
        <div>
            <h1 className="mb-4">Dashboard</h1>
            
            <Row className="mb-4">
                <Col md={3}>
                    <Card as={Link} to="/app/properties" className="text-decoration-none text-dark h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Properties</h6>
                                    <h3>{summaryData.properties}</h3>
                                </div>
                                <Building size={40} className="text-primary" />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card as={Link} to="/app/appointments" className="text-decoration-none text-dark h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Appointments</h6>
                                    <h3>{summaryData.appointments}</h3>
                                </div>
                                <Calendar size={40} className="text-primary" />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card as={Link} to="/app/billing" className="text-decoration-none text-dark h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Pending Bills</h6>
                                    <h3>{summaryData.pendingBills}</h3>
                                </div>
                                <Cash size={40} className="text-primary" />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card as={Link} to="/app/reports" className="text-decoration-none text-dark h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Reports</h6>
                                    <h3>{summaryData.reports}</h3>
                                </div>
                                <FileText size={40} className="text-primary" />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card>
                <Card.Header>
                    <h5 className="mb-0">Recent Activity</h5>
                </Card.Header>
                <Card.Body>
                    <Table hover>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivity.map(activity => (
                                <tr key={activity.id}>
                                    <td>{activity.type}</td>
                                    <td>{activity.description}</td>
                                    <td>{new Date(activity.date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </div>
    );
}

export default Dashboard; 