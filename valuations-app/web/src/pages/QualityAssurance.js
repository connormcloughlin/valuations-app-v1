import React, { useEffect, useState } from 'react';
import { Row, Col, Spinner, Alert, Container } from 'react-bootstrap';
import qaApi from '../services/qaApi';
import QAMetrics from '../components/qa/QAMetrics';
import QASurveyTable from '../components/qa/QASurveyTable';
import QASurveyDetailModal from '../components/qa/QASurveyDetailModal';
import QASurveyPhotoModal from '../components/qa/QASurveyPhotoModal';
import QASurveyItemModal from '../components/qa/QASurveyItemModal';

const QualityAssurance = () => {
  const [surveys, setSurveys] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', surveyor: '', search: '' });
  // Photo modal state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedSurveyPhotos, setSelectedSurveyPhotos] = useState([]);
  // Item modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      qaApi.getSurveys(),
      qaApi.getMetrics()
    ])
      .then(([surveysRes, metricsRes]) => {
        setSurveys(surveysRes.data.data.surveys || []);
        setMetrics(metricsRes.data.data || null);
        setError(null);
      })
      .catch((err) => {
        setError('Failed to load QA data.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleViewSurvey = (id) => {
    setSelectedSurveyId(id);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedSurveyId(null);
  };

  const handleApprove = async (id) => {
    setLoadingAction(true);
    try {
      await qaApi.reviewSurvey(id, { status: 'approved' });
      setSurveys((prev) => prev.map(s => s.id === id ? { ...s, reviewStatus: 'approved' } : s));
      setActionMsg('Survey approved.');
    } catch {
      setActionMsg('Failed to approve survey.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReject = async (id) => {
    setLoadingAction(true);
    try {
      await qaApi.reviewSurvey(id, { status: 'rejected' });
      setSurveys((prev) => prev.map(s => s.id === id ? { ...s, reviewStatus: 'rejected' } : s));
      setActionMsg('Survey rejected.');
    } catch {
      setActionMsg('Failed to reject survey.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Photo modal handlers
  const openPhotoModal = (photos, index = 0) => {
    setSelectedSurveyPhotos(photos);
    setSelectedPhotoIndex(index);
    setShowPhotoModal(true);
  };
  const closePhotoModal = (direction) => {
    if (direction === 'prev' && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    } else if (direction === 'next' && selectedPhotoIndex < selectedSurveyPhotos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    } else {
      setShowPhotoModal(false);
    }
  };
  const handleApprovePhoto = (photoId) => {
    // TODO: Call API to approve photo
    setActionMsg('Photo approved (not yet implemented).');
  };
  const handleRejectPhoto = (photoId) => {
    // TODO: Call API to reject photo
    setActionMsg('Photo rejected (not yet implemented).');
  };

  // Item modal handlers
  const openItemModal = (item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };
  const closeItemModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
  };
  const handleApproveItem = (itemId) => {
    // TODO: Call API to approve item
    setActionMsg('Item approved (not yet implemented).');
  };
  const handleRejectItem = (itemId) => {
    // TODO: Call API to reject item
    setActionMsg('Item rejected (not yet implemented).');
  };

  // Client-side filtering for now
  const filteredSurveys = surveys.filter(s => {
    const statusMatch = !filters.status || s.reviewStatus === filters.status;
    const priorityMatch = !filters.priority || (s.priority && s.priority === filters.priority);
    const surveyorMatch = !filters.surveyor || (s.surveyorName && s.surveyorName.toLowerCase().includes(filters.surveyor.toLowerCase()));
    const searchMatch = !filters.search ||
      (s.orderId && s.orderId.toString().includes(filters.search)) ||
      (s.surveyorName && s.surveyorName.toLowerCase().includes(filters.search.toLowerCase()));
    return statusMatch && priorityMatch && surveyorMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="mt-3">{error}</Alert>;
  }

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Quality Assurance</h1>
      
      <QAMetrics metrics={metrics} />
      
      {actionMsg && <Alert variant="info" onClose={() => setActionMsg(null)} dismissible>{actionMsg}</Alert>}
      <QASurveyTable
        surveys={filteredSurveys}
        onView={handleViewSurvey}
        onApprove={handleApprove}
        onReject={handleReject}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      
      <QASurveyDetailModal
        show={showDetail}
        onHide={handleCloseDetail}
        surveyId={selectedSurveyId}
        onApprove={handleApprove}
        onReject={handleReject}
        actionMsg={actionMsg}
        loadingAction={loadingAction}
        onPhotoClick={openPhotoModal}
        onItemClick={openItemModal}
      />
      <QASurveyPhotoModal
        show={showPhotoModal}
        onHide={closePhotoModal}
        photos={selectedSurveyPhotos}
        selectedPhotoIndex={selectedPhotoIndex}
        onApprove={handleApprovePhoto}
        onReject={handleRejectPhoto}
      />
      <QASurveyItemModal
        show={showItemModal}
        onHide={closeItemModal}
        item={selectedItem}
        onApprove={handleApproveItem}
        onReject={handleRejectItem}
      />
    </Container>
  );
};

export default QualityAssurance; 