import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './authConfig';
import Layout from './components/Layout';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import NewCustomer from './pages/NewCustomer';
import NewProperty from './pages/NewProperty';
import PropertyDetails from './pages/PropertyDetails';
import NewOrder from './pages/NewOrder';
import OrderDetails from './pages/OrderDetails';
import Appointments from './pages/Appointments';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import EditOrder from './pages/EditOrder';
import Properties from './pages/Properties';
import Orders from './pages/Orders';
import ContentsValuation from './pages/ContentsValuation';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

const msalInstance = new PublicClientApplication(msalConfig);

function App() {
    return (
        <MsalProvider instance={msalInstance}>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/app"
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Dashboard />} />
                        <Route path="customers" element={<Customers />} />
                        <Route path="customers/new" element={<NewCustomer />} />
                        <Route path="customers/:customerId" element={<CustomerDetails />} />
                        <Route path="customers/:customerId/properties/new" element={<NewProperty />} />
                        <Route path="customers/:customerId/properties/:propertyId" element={<PropertyDetails />} />
                        <Route path="customers/:customerId/orders/new" element={<NewOrder />} />
                        <Route path="customers/:customerId/orders/:orderId" element={<OrderDetails />} />
                        <Route path="customers/:customerId/orders/:orderId/edit" element={<EditOrder />} />
                        <Route path="properties" element={<Properties />} />
                        <Route path="properties/new" element={<NewProperty />} />
                        <Route path="properties/:propertyId" element={<PropertyDetails />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="orders/new" element={<NewOrder />} />
                        <Route path="orders/:orderId" element={<OrderDetails />} />
                        <Route path="orders/:orderId/edit" element={<EditOrder />} />
                        <Route path="orders/:orderId/contents-valuation" element={<ContentsValuation />} />
                        <Route path="appointments" element={<Appointments />} />
                        <Route path="billing" element={<Billing />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </MsalProvider>
    );
}

export default App; 