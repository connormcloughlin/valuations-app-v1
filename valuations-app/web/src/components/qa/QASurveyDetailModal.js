import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Tabs, Tab, Alert, Spinner } from 'react-bootstrap';
import qaApi from '../../services/qaApi';

const QASurveyDetailModal = ({ show, onHide, surveyId }) => {
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewData, setReviewData] = useState({
    score: '',
    comments: '',
    status: 'approved',
    itemIssues: [],
    photoIssues: []
  });

  useEffect(() => {
    const fetchSurveyDetails = async () => {
      if (!surveyId) return;
      try {
        setLoading(true);
        const response = await qaApi.getSurveyDetails(surveyId);
        setSurvey(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load survey details');
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      fetchSurveyDetails();
    }
  }, [surveyId, show]);

  const handleSubmitReview = async () => {
    try {
      await qaApi.reviewSurvey(surveyId, reviewData);
      onHide();
    } catch (err) {
      setError('Failed to submit review');
    }
  };

  const handleInputChange = (field, value) => {
    setReviewData(prev => ({ ...prev, [field]: value }));
  };

  if (!show) return null;
  if (loading) return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Body className="text-center py-5">
        <Spinner animation="border" />
      </Modal.Body>
    </Modal>
  );

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Survey Review - {survey?.reference}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Row className="mb-4">
          <Col md={6}>
            <p><strong>Surveyor:</strong> {survey?.surveyor}</p>
            <p><strong>Location:</strong> {survey?.location}</p>
            <p><strong>Date:</strong> {new Date(survey?.date).toLocaleDateString()}</p>
          </Col>
          <Col md={6}>
            <p><strong>Items:</strong> {survey?.itemCount}</p>
            <p><strong>Photos:</strong> {survey?.photoCount}</p>
            <p><strong>Duration:</strong> {survey?.duration} minutes</p>
          </Col>
        </Row>

        <Tabs defaultActiveKey="review" className="mb-3">
          <Tab eventKey="review" title="Review">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Quality Score (1-10)</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="10"
                  value={reviewData.score}
                  onChange={(e) => handleInputChange('score', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Review Status</Form.Label>
                <Form.Select
                  value={reviewData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                  <option value="needsRevision">Needs Revision</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Comments</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={reviewData.comments}
                  onChange={(e) => handleInputChange('comments', e.target.value)}
                  placeholder="Enter review comments..."
                />
              </Form.Group>
            </Form>
          </Tab>

          <Tab eventKey="items" title="Items">
            <div className="items-list">
              {survey?.items?.map((item, index) => (
                <div key={item.id} className="border-bottom py-3">
                  <h6>Item {index + 1}: {item.name}</h6>
                  <Row>
                    <Col md={6}>
                      <p><strong>Category:</strong> {item.category}</p>
                      <p><strong>Condition:</strong> {item.condition}</p>
                      <p><strong>Value:</strong> £{item.value}</p>
                    </Col>
                    <Col md={6}>
                      <Form.Check
                        type="checkbox"
                        label="Flag for review"
                        checked={reviewData.itemIssues.includes(item.id)}
                        onChange={(e) => {
                          const issues = e.target.checked
                            ? [...reviewData.itemIssues, item.id]
                            : reviewData.itemIssues.filter(id => id !== item.id);
                          handleInputChange('itemIssues', issues);
                        }}
                      />
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          </Tab>

          <Tab eventKey="photos" title="Photos">
            <div className="photos-grid">
              {survey?.photos?.map((photo, index) => (
                <div key={photo.id} className="border-bottom py-3">
                  <Row>
                    <Col md={4}>
                      <img
                        src={photo.url}
                        alt={`Survey photo ${index + 1}`}
                        className="img-fluid thumbnail"
                      />
                    </Col>
                    <Col md={8}>
                      <p><strong>Type:</strong> {photo.type}</p>
                      <p><strong>Item:</strong> {photo.itemName}</p>
                      <Form.Check
                        type="checkbox"
                        label="Flag photo quality issue"
                        checked={reviewData.photoIssues.includes(photo.id)}
                        onChange={(e) => {
                          const issues = e.target.checked
                            ? [...reviewData.photoIssues, photo.id]
                            : reviewData.photoIssues.filter(id => id !== photo.id);
                          handleInputChange('photoIssues', issues);
                        }}
                      />
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmitReview}
          disabled={!reviewData.score || !reviewData.status}
        >
          Submit Review
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QASurveyDetailModal; 