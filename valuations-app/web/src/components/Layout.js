import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { useMsal } from '@azure/msal-react';
import { Building, Calendar, Cash, FileText, Person, BoxArrowRight } from 'react-bootstrap-icons';

const Layout = () => {
  const { instance } = useMsal();
  const location = useLocation();

  const handleLogout = () => {
    instance.logoutPopup();
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/app">
            <Building className="me-2" />
            Valuations App
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <NavDropdown 
                title="Customers" 
                id="customers-dropdown"
                className={isActive('/app/customers')}
              >
                <NavDropdown.Item as={Link} to="/app/customers">
                  All Customers
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/app/customers/new">
                  New Customer
                </NavDropdown.Item>
              </NavDropdown>

              <NavDropdown 
                title="Properties" 
                id="properties-dropdown"
                className={isActive('/app/properties')}
              >
                <NavDropdown.Item as={Link} to="/app/properties">
                  All Properties
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/app/properties/new">
                  New Property
                </NavDropdown.Item>
              </NavDropdown>

              <NavDropdown 
                title="Orders" 
                id="orders-dropdown"
                className={isActive('/app/orders')}
              >
                <NavDropdown.Item as={Link} to="/app/orders">
                  All Orders
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/app/orders/new">
                  New Order
                </NavDropdown.Item>
              </NavDropdown>

              <Nav.Link as={Link} to="/app/appointments" className={isActive('/app/appointments')}>
                <Calendar className="me-1" />
                Appointments
              </Nav.Link>

              <Nav.Link as={Link} to="/app/billing" className={isActive('/app/billing')}>
                <Cash className="me-1" />
                Billing
              </Nav.Link>

              <Nav.Link as={Link} to="/app/reports" className={isActive('/app/reports')}>
                <FileText className="me-1" />
                Reports
              </Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link as={Link} to="/app/profile" className={isActive('/app/profile')}>
                <Person className="me-1" />
                Profile
              </Nav.Link>
              <Nav.Link onClick={handleLogout}>
                <BoxArrowRight className="me-1" />
                Logout
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1">
        <Container>
          <Outlet />
        </Container>
      </main>

      <footer className="bg-dark text-white py-3 mt-auto">
        <Container>
          <div className="text-center">
            <small>© {new Date().getFullYear()} Valuations App. All rights reserved.</small>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Layout; 