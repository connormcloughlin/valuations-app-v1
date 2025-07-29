import React, { useState } from 'react';
import { Form, Button, Table, Spinner, Alert, Row, Col } from 'react-bootstrap';
import pricingApi from '../../services/pricingApi';

const ArtworkPricingTool = () => {
  const [search, setSearch] = useState({ artist: '', title: '', medium: '', year: '' });
  const [results, setResults] = useState([]);
  const [evaluateData, setEvaluateData] = useState({ artist: '', title: '', medium: '', dimensions: '', year: '', condition: '', provenance: '', photos: [] });
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await pricingApi.getArtwork(search);
      setResults(res.data.data.items || []);
    } catch (err) {
      setError('Failed to fetch artwork.');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await pricingApi.evaluateArtwork(evaluateData);
      setEvaluation(res.data.data);
    } catch (err) {
      setError('Failed to evaluate artwork.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4>Search Artwork</h4>
      <Form onSubmit={handleSearch} className="mb-3">
        <Row>
          <Col md={3}><Form.Control placeholder="Artist" value={search.artist} onChange={e => setSearch(s => ({ ...s, artist: e.target.value }))} /></Col>
          <Col md={3}><Form.Control placeholder="Title" value={search.title} onChange={e => setSearch(s => ({ ...s, title: e.target.value }))} /></Col>
          <Col md={3}><Form.Control placeholder="Medium" value={search.medium} onChange={e => setSearch(s => ({ ...s, medium: e.target.value }))} /></Col>
          <Col md={3}><Form.Control placeholder="Year" value={search.year} onChange={e => setSearch(s => ({ ...s, year: e.target.value }))} /></Col>
        </Row>
        <Button type="submit" className="mt-2">Search</Button>
      </Form>
      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}
      {results.length > 0 && (
        <Table size="sm" bordered hover>
          <thead>
            <tr><th>Artist</th><th>Title</th><th>Medium</th><th>Year</th><th>Current Price</th></tr>
          </thead>
          <tbody>
            {results.map(item => (
              <tr key={item.id}>
                <td>{item.artist}</td>
                <td>{item.title}</td>
                <td>{item.medium}</td>
                <td>{item.year}</td>
                <td>£{item.currentPrice?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <hr />
      <h4>Evaluate Artwork</h4>
      <Form onSubmit={handleEvaluate} className="mb-3">
        <Row>
          <Col md={3}><Form.Control placeholder="Artist" value={evaluateData.artist} onChange={e => setEvaluateData(s => ({ ...s, artist: e.target.value }))} /></Col>
          <Col md={3}><Form.Control placeholder="Title" value={evaluateData.title} onChange={e => setEvaluateData(s => ({ ...s, title: e.target.value }))} /></Col>
          <Col md={3}><Form.Control placeholder="Medium" value={evaluateData.medium} onChange={e => setEvaluateData(s => ({ ...s, medium: e.target.value }))} /></Col>
          <Col md={3}><Form.Control placeholder="Dimensions" value={evaluateData.dimensions} onChange={e => setEvaluateData(s => ({ ...s, dimensions: e.target.value }))} /></Col>
        </Row>
        <Row className="mt-2">
          <Col md={3}><Form.Control placeholder="Year" value={evaluateData.year} onChange={e => setEvaluateData(s => ({ ...s, year: e.target.value }))} /></Col>
          <Col md={3}><Form.Control placeholder="Condition" value={evaluateData.condition} onChange={e => setEvaluateData(s => ({ ...s, condition: e.target.value }))} /></Col>
          <Col md={3}><Form.Control placeholder="Provenance" value={evaluateData.provenance} onChange={e => setEvaluateData(s => ({ ...s, provenance: e.target.value }))} /></Col>
        </Row>
        <Button type="submit" className="mt-2">Evaluate</Button>
      </Form>
      {evaluation && (
        <Alert variant="info">
          <div><strong>Estimated Value:</strong> £{evaluation.estimatedValue?.toLocaleString()}</div>
          <div><strong>Confidence:</strong> {evaluation.confidence}%</div>
          <div><strong>Original Price:</strong> £{evaluation.originalPrice?.toLocaleString()}</div>
          <div><strong>Depreciation:</strong> {evaluation.depreciation}%</div>
        </Alert>
      )}
    </div>
  );
};

export default ArtworkPricingTool; 