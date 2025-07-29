import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';

const QASurveyPhotoModal = ({ show, onHide, photos, selectedPhotoIndex, onApprove, onReject }) => {
  if (!photos || photos.length === 0) return null;
  const photo = photos[selectedPhotoIndex] || photos[0];

  return (
    <Modal show={show} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title>Photo Review</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-3">
          <Col className="text-center">
            <img src={photo.url || photo.thumbnail} alt="Survey" className="img-fluid rounded" style={{ maxHeight: 350 }} />
            <div className="mt-2"><small>{photo.room}</small></div>
          </Col>
        </Row>
        <Row>
          <Col className="text-center">
            <Button variant="outline-primary" className="me-2" onClick={() => onApprove(photo.id)}>Approve</Button>
            <Button variant="outline-danger" onClick={() => onReject(photo.id)}>Reject</Button>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
        <Button variant="outline-secondary" onClick={() => onHide('prev')} disabled={selectedPhotoIndex === 0}>Previous</Button>
        <Button variant="outline-secondary" onClick={() => onHide('next')} disabled={selectedPhotoIndex === photos.length - 1}>Next</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QASurveyPhotoModal; 