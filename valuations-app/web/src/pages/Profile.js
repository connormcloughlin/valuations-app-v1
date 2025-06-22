import React from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { useMsal } from '@azure/msal-react';

function Profile() {
    const { accounts } = useMsal();
    const account = accounts[0];

    return (
        <div>
            <h1 className="mb-4">Profile</h1>
            <Card>
                <Card.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={account?.name || ''}
                                readOnly
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={account?.username || ''}
                                readOnly
                            />
                        </Form.Group>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}

export default Profile; 