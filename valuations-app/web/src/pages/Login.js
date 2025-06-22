import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { Container, Button, Card } from 'react-bootstrap';
import { Microsoft } from 'react-bootstrap-icons';
import { loginRequest } from '../authConfig';

function Login() {
    const { instance } = useMsal();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/app';

    const handleLogin = async () => {
        try {
            await instance.loginPopup(loginRequest);
            navigate(from, { replace: true });
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center min-vh-100">
            <Card className="p-4 shadow" style={{ width: '400px' }}>
                <Card.Body className="text-center">
                    <h2 className="mb-4">Valuations App</h2>
                    <p className="mb-4">Please sign in to continue</p>
                    <Button
                        variant="primary"
                        onClick={handleLogin}
                        className="w-100 d-flex align-items-center justify-content-center gap-2"
                    >
                        <Microsoft size={20} />
                        Sign in with Microsoft
                    </Button>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default Login; 