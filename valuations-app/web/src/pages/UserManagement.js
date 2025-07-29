import React, { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import userApi from '../services/userApi';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: '' });

  useEffect(() => {
    setLoading(true);
    Promise.all([userApi.getUsers(), userApi.getRoles()])
      .then(([usersRes, rolesRes]) => {
        setUsers(usersRes.data.data || []);
        setRoles(rolesRes.data.data || []);
        setError(null);
      })
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  const openModal = (user = null) => {
    setEditingUser(user);
    setForm(user ? { name: user.name, email: user.email, role: user.role } : { name: '', email: '', role: '' });
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };
  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleSave = async () => {
    setLoading(true);
    try {
      if (editingUser) {
        await userApi.updateUser(editingUser.id, form);
      } else {
        await userApi.createUser(form);
      }
      const usersRes = await userApi.getUsers();
      setUsers(usersRes.data.data || []);
      closeModal();
    } catch {
      setError('Failed to save user.');
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await userApi.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch {
      setError('Failed to delete user.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h1 className="mb-4">User Management</h1>
      <Button className="mb-3" onClick={() => openModal()}>Add User</Button>
      <Table bordered hover size="sm">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <Button size="sm" variant="outline-primary" onClick={() => openModal(user)}>Edit</Button>{' '}
                <Button size="sm" variant="outline-danger" onClick={() => handleDelete(user.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal show={showModal} onHide={closeModal}>
        <Modal.Header closeButton><Modal.Title>{editingUser ? 'Edit User' : 'Add User'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Name</Form.Label>
              <Form.Control name="name" value={form.name} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control name="email" value={form.email} onChange={handleChange} type="email" />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Role</Form.Label>
              <Form.Select name="role" value={form.role} onChange={handleChange}>
                <option value="">Select Role</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>{editingUser ? 'Save' : 'Add'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement; 