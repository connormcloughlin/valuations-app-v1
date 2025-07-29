import React from 'react';
import { Modal, Button, Table } from 'react-bootstrap';

const QASurveyItemModal = ({ show, onHide, item, onApprove, onReject }) => {
  if (!item) return null;
  return (
    <Modal show={show} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title>Item Review</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table size="sm" bordered>
          <tbody>
            <tr><th>Category</th><td>{item.category}</td></tr>
            <tr><th>Name</th><td>{item.name}</td></tr>
            <tr><th>Description</th><td>{item.description}</td></tr>
            <tr><th>Room</th><td>{item.room}</td></tr>
            <tr><th>Value</th><td>£{item.estimatedValue?.toLocaleString()}</td></tr>
            <tr><th>Condition</th><td>{item.condition}</td></tr>
            <tr><th>Notes</th><td>{item.notes}</td></tr>
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
        <Button variant="outline-primary" onClick={() => onApprove(item.id)}>Approve</Button>
        <Button variant="outline-danger" onClick={() => onReject(item.id)}>Reject</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QASurveyItemModal; 