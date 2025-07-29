import React, { useState } from 'react';
import { Form, Button, Table, Spinner, Alert, Row, Col } from 'react-bootstrap';
import pricingApi from '../../services/pricingApi';

const ElectronicsPricingTool = () => {
  const [search, setSearch] = useState({ brand: '', model: '', category: '', condition: '' });
  const [results, setResults] = useState([]);
  const [evaluateData, setEvaluateData] = useState({ brand: '', model: '', condition: '', purchaseDate: '' });
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await pricingApi.getElectronics(search);
      setResults(res.data.data.items || []);
    } catch (err) {
      setError('Failed to fetch electronics.');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await pricingApi.evaluateElectronics(evaluateData);
      setEvaluation(res.data.data);
    } catch (err) {
      setError('Failed to evaluate item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4>Search Electronics</h4>
      <Form onSubmit={handleSearch} className="mb-3">
        <Row>
          <Col md={3}><Form.Control placeholder="Brand" value={search.brand} onChange={e => setSearch(s => ({ ...s, brand: e.target.value }))} /></Col>
          <Col md={3}><Form.Control placeholder="Model" value={search.model} onChange={e => setSearch(s => ({ ...s, model: e.target.value }))} /></Col>
          <Col md={3}><Form.Control placeholder="Category" value={search.category} onChange={e => setSearch(s => ({ ...s, category: e.target.value }))} /></Col>
          <Col md={3}><Form.Control placeholder="Condition" value={search.condition} onChange={e => setSearch(s => ({ ...s, condition: e.target.value }))} /></Col>
        </Row>
        <Button type="submit" className="mt-2">Search</Button>
      </Form>
      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}
      {results.length > 0 && (
        <Table size="sm" bordered hover>
          <thead>
            <tr><th>Brand</th><th>Model</th><th>Category</th><th>Current Price</th><th>Condition</th></tr>
          </thead>
          <tbody>
            {results.map(item => (
              <tr key={item.id}>
                <td>{item.brand}</td>
                <td>{item.model}</td>
                <td>{item.category}</td>
                <td>£{item.currentPrice?.toLocaleString()}</td>
                <td>{item.condition}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <hr />
      <h4>Evaluate Electronics Item</h4>
      <Form onSubmit={handleEvaluate} className="mb-3">
        <Row>
          <Col md={3}><Form.Control placeholder="Brand" value={evaluateData.brand} onChange={e => setEvaluateData(s => ({ ...s, brand: e.target.value }))} /></Col>
          <Col md={3}><Form.Control placeholder="Model" value={evaluateData.model} onChange={e => setEvaluateData(s => ({ ...s, model: e.target.value }))} /></Col>
          <Col md={3}><Form.Control placeholder="Condition" value={evaluateData.condition} onChange={e => setEvaluateData(s => ({ ...s, condition: e.target.value }))} /></Col>
          <Col md={3}><Form.Control type="date" placeholder="Purchase Date" value={evaluateData.purchaseDate} onChange={e => setEvaluateData(s => ({ ...s, purchaseDate: e.target.value }))} /></Col>
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

export default ElectronicsPricingTool; 