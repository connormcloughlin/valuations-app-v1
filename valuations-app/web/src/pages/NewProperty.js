import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { propertyApi } from '../services/api';

function NewProperty() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        address: '',
        buildingType: 'Residential',
        status: 'active'
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await propertyApi.create({
                ...formData,
                updatedAt: new Date().toISOString()
            });
            navigate('/app/properties');
        } catch (err) {
            setError('Failed to create property');
            console.error('Error creating property:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Add New Property</h1>
                <Button variant="secondary" onClick={() => navigate('/app/properties')}>
                    Back to Properties
                </Button>
            </div>

            <Card>
                <Card.Body>
                    {error && (
                        <Alert variant="danger" className="mb-3">
                            {error}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                                placeholder="Enter property address"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Building Type</Form.Label>
                            <Form.Select
                                name="buildingType"
                                value={formData.buildingType}
                                onChange={handleChange}
                                required
                            >
                                <option value="Residential">Residential</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Industrial">Industrial</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                            >
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="inactive">Inactive</option>
                            </Form.Select>
                        </Form.Group>

                        <div className="d-flex justify-content-end">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Creating...
                                    </>
                                ) : (
                                    'Create Property'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}

export default NewProperty; 