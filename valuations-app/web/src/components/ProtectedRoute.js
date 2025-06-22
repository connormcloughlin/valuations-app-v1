import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';

function ProtectedRoute({ children }) {
  const { accounts } = useMsal();
  const location = useLocation();

  if (!accounts || accounts.length === 0) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute; 