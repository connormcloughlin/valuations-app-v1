import React, { useState, useCallback } from 'react';
import { Form, Button, Container, Row, Col, Card, Table, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import categoryItemsApi from '../services/categoryItemsApi';
import '../styles/ContentsValuation.css';
import { IoFolderOutline, IoFolderOpenOutline, IoDocumentOutline } from 'react-icons/io5';

const ContentsValuation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    assessmentType: 'INVENTORY',
    assessmentNumber: '',
    quantifier: '',
    surveyDate: new Date().toISOString().split('T')[0],
    surveyReason: '',
    capturer: '',
    insurer: '',
    broker: '',
    status: 'COMPLETE',
    totalAssetsValue: '0.00',
    negotiatedAmount: '0.00',
    surname: '',
    title: '',
    initials: '',
    telWork: '',
    telHome: '',
    cell: '',
    email: '',
    officeUse: '',
    requestedBy: '',
    lastUpdated: new Date().toISOString().split('T')[0],
    received: new Date().toISOString().split('T')[0],
    sent: '',
    comments: '',
    billingTemplate: 'Bulk fees 2023',
    riskAddress: '',
    postalAddress: '',
    signedClientDocuments: false
  });

  const [contentsItems, setContentsItems] = useState([
    {
      id: 1,
      category: 'SECTION A - AGREED VALUE',
      isParent: true,
      children: [
        { id: 'a1', category: 'ANTIQUES', items: [], itemsFetched: false },
        { id: 'a2', category: 'VALUABLE ARTWORKS', items: [], itemsFetched: false },
        { id: 'a3', category: 'VALUABLE CARPETS', items: [], itemsFetched: false },
        { id: 'a4', category: 'COLLECTIONS - COINS / STAMPS', items: [], itemsFetched: false },
        { id: 'a5', category: 'VALUABLE ORNAMENTS', items: [], itemsFetched: false },
        { id: 'a6', category: 'FIREARMS, BOWS', items: [], itemsFetched: false },
        { id: 'a7', category: 'CLOTHING (GENTS / BOYS)', items: [], itemsFetched: false },
        { id: 'a8', category: 'CLOTHING (LADIES / GIRLS)', items: [], itemsFetched: false },
        { id: 'a9', category: 'CLOTHING (CHILDREN / BABIES)', items: [], itemsFetched: false },
        { id: 'a10', category: 'JEWELLERY', items: [], itemsFetched: false },
        { id: 'a11', category: 'FURNITURE', items: [], itemsFetched: false },
        { id: 'a12', category: 'LINEN', items: [], itemsFetched: false },
        { id: 'a13', category: 'LUGGAGE CONTAINERS', items: [], itemsFetched: false },
        { id: 'a14', category: 'PERSONAL EFFECTS', items: [], itemsFetched: false },
        { id: 'a15', category: 'SPORTS EQUIPMENT', items: [], itemsFetched: false },
        { id: 'a16', category: 'OUTDOOR EQUIPMENT', items: [], itemsFetched: false }
      ]
    },
    {
      id: 2,
      category: 'SECTION B - REPLACEMENT',
      isParent: true,
      children: [
        { id: 'b1', category: 'DOMESTIC APPLIANCES', items: [], itemsFetched: false },
        { id: 'b2', category: 'KITCHENWARE', items: [], itemsFetched: false },
        { id: 'b3', category: 'PHOTOGRAPHIC EQUIPMENT', items: [], itemsFetched: false },
        { id: 'b4', category: 'POWER TOOLS', items: [], itemsFetched: false },
        { id: 'b5', category: 'VISUAL, SOUND, COMPUTER', items: [], itemsFetched: false },
        { id: 'b6', category: 'HIGH RISK ITEMS', items: [], itemsFetched: false }
      ]
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [itemTypes] = useState([
    { rank: 1, type: 'Deepfreeze' },
    { rank: 2, type: 'Dishwasher' },
    { rank: 3, type: 'Fridge' },
    { rank: 4, type: 'Garden Vacuum' },
    { rank: 5, type: 'Hardwyer / Styler' },
    { rank: 6, type: 'Heaters / Fans' },
    { rank: 7, type: 'Hostess Trolley' },
    { rank: 8, type: 'Lawnmower' },
    { rank: 9, type: 'Microwave' },
    { rank: 10, type: 'Mixer / Blender' },
    { rank: 11, type: 'Overlocking' }
  ]);

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newItem, setNewItem] = useState({
    type: '',
    description: '',
    model: '',
    selection: '',
    price: '',
    location: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add expanded sections state
  const [expandedSections, setExpandedSections] = useState([1, 2]); // Initially expand all sections

  // Add toggle function
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategorySelect = async (category) => {
    console.log('Category selected:', category);
    setSelectedCategory(null); // Reset first to trigger re-render
    setSelectedCategory(category);
    
    if (!category.isParent) {
      // Find the category in the current state
      const currentCategory = contentsItems
        .flatMap(section => section.children)
        .find(cat => cat.id === category.id);

      console.log('Current category state:', currentCategory);

      // Always fetch on first click
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching items for category:', category.id);
        const response = await categoryItemsApi.getCategoryItems(category.id);
        console.log('Fetched items:', response.data);
        
        setContentsItems(prevItems => {
          const newItems = prevItems.map(section => ({
            ...section,
            children: section.children.map(cat => {
              if (cat.id === category.id) {
                return {
                  ...cat,
                  items: response.data,
                  itemsFetched: true
                };
              }
              return cat;
            })
          }));
          console.log('Updated contents items:', newItems);
          return newItems;
        });
      } catch (err) {
        setError('Failed to load category items. Please try again.');
        console.error('Error loading category items:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const calculateTotalValue = () => {
    let total = 0;
    contentsItems.forEach(section => {
      section.children.forEach(category => {
        if (category.items && Array.isArray(category.items)) {
          category.items.forEach(item => {
            total += parseFloat(item.price || 0);
          });
        }
      });
    });
    return total.toFixed(2);
  };

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddNewItem = () => {
    if (selectedCategory && !selectedCategory.isParent) {
      const itemWithId = {
        ...newItem,
        id: Date.now()
      };

      setContentsItems(prev => prev.map(section => ({
        ...section,
        children: section.children.map(category => {
          if (category.id === selectedCategory.id) {
            return {
              ...category,
              items: [...category.items, itemWithId]
            };
          }
          return category;
        })
      })));

      setNewItem({
        type: '',
        description: '',
        model: '',
        selection: '',
        price: '',
        location: ''
      });
      setShowAddItemModal(false);
    }
  };

  const handleItemUpdate = useCallback(async (itemId, field, value) => {
    console.log('Updating item:', { itemId, field, value });
    
    setContentsItems(prevItems => {
      const newItems = prevItems.map(section => ({
        ...section,
        children: section.children.map(category => {
          if (category.id === selectedCategory?.id) {
            const updatedItems = category.items.map(item => {
              if (item.id === itemId) {
                const updatedValue = field === 'quantity' || field === 'price'
                  ? (parseFloat(value) || 0)
                  : value;
                return { ...item, [field]: updatedValue };
              }
              return item;
            });

            // Save updates to API
            categoryItemsApi.saveCategoryItems(category.id, updatedItems)
              .catch(err => console.error('Error saving items:', err));

            return {
              ...category,
              items: updatedItems
            };
          }
          return category;
        })
      }));
      return newItems;
    });
  }, [selectedCategory?.id]);

  const calculateItemTotal = useCallback((item) => {
    return (Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString();
  }, []);

  const calculateCategoryTotal = useCallback((items) => {
    return items.reduce((sum, item) => {
      const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);
      return sum + itemTotal;
    }, 0).toLocaleString();
  }, []);

  const renderSectionSummary = (section) => {
    const getValuedItemCount = (items) => {
      return items.filter(item => 
        (Number(item.price) > 0 && Number(item.quantity) > 0)
      ).length;
    };

    return (
      <Card>
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">{section.category} Summary</h5>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Category</th>
                <th>Items with Values</th>
                <th className="text-end">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {section.children.map(category => {
                const categoryTotal = calculateCategoryTotal(category.items);
                const valuedItemCount = getValuedItemCount(category.items);
                return (
                  <tr key={category.id}>
                    <td>
                      <Button
                        variant="link"
                        className="p-0 text-start text-decoration-none"
                        onClick={() => handleCategorySelect(category)}
                      >
                        {category.category}
                      </Button>
                    </td>
                    <td>{valuedItemCount}</td>
                    <td className="text-end">R {categoryTotal}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" className="text-end"><strong>Section Total:</strong></td>
                <td className="text-end">
                  <strong>
                    R {section.children.reduce((total, category) => {
                      const categoryValue = category.items.reduce((sum, item) => {
                        const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);
                        return sum + itemTotal;
                      }, 0);
                      return total + categoryValue;
                    }, 0).toLocaleString()}
                  </strong>
                </td>
              </tr>
              <tr>
                <td colSpan="2" className="text-end"><strong>Total Items with Values:</strong></td>
                <td className="text-end">
                  <strong>
                    {section.children.reduce((total, category) => 
                      total + getValuedItemCount(category.items), 0
                    )}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </Table>
        </Card.Body>
      </Card>
    );
  };

  const renderItemsTable = () => {
    console.log('Rendering items table. Selected category:', selectedCategory);
    
    if (!selectedCategory) return null;

    if (selectedCategory.isParent) {
      return renderSectionSummary(selectedCategory);
    }

    // Find current category data from state
    const currentCategory = contentsItems
      .flatMap(section => section.children)
      .find(cat => cat.id === selectedCategory.id);

    console.log('Current category data for render:', currentCategory);

    if (loading) {
      return (
        <div className="text-center p-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-5 text-danger">
          <p>{error}</p>
          <Button variant="primary" onClick={() => handleCategorySelect(selectedCategory)}>
            Retry
          </Button>
        </div>
      );
    }

    // Use items from current state instead of selected category
    const items = currentCategory?.items || [];
    console.log('Items to render:', items);

    return (
      <Table className="modern-table" responsive>
        <thead>
          <tr>
            <th style={{ width: '60px' }}>Rank</th>
            <th style={{ minWidth: '150px' }}>Type</th>
            <th style={{ minWidth: '200px' }}>Description</th>
            <th style={{ minWidth: '150px' }}>Model</th>
            <th style={{ minWidth: '150px' }}>Selection</th>
            <th style={{ width: '100px' }}>Quantity</th>
            <th style={{ width: '120px' }}>Price per Item</th>
            <th style={{ width: '120px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.type}</td>
              <td>
                <Form.Control
                  type="text"
                  defaultValue={item.description || ''}
                  onBlur={(e) => handleItemUpdate(item.id, 'description', e.target.value)}
                />
              </td>
              <td>
                <Form.Control
                  type="text"
                  defaultValue={item.model || ''}
                  onBlur={(e) => handleItemUpdate(item.id, 'model', e.target.value)}
                />
              </td>
              <td>
                <Form.Control
                  type="text"
                  defaultValue={item.selection || ''}
                  onBlur={(e) => handleItemUpdate(item.id, 'selection', e.target.value)}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  defaultValue={item.quantity || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    handleItemUpdate(item.id, 'quantity', value);
                  }}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    handleItemUpdate(item.id, 'quantity', value);
                  }}
                  min="0"
                  style={{ width: '80px' }}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  defaultValue={item.price || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    handleItemUpdate(item.id, 'price', value);
                  }}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    handleItemUpdate(item.id, 'price', value);
                  }}
                  min="0"
                  style={{ width: '120px' }}
                />
              </td>
              <td className="text-end">
                <strong>
                  R {calculateItemTotal(item)}
                </strong>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="7" className="text-end"><strong>Category Total:</strong></td>
            <td className="text-end">
              <strong>
                R {calculateCategoryTotal(items)}
              </strong>
            </td>
          </tr>
        </tfoot>
      </Table>
    );
  };

  return (
    <Container fluid>
      <Card className="contents-card">
        <Card.Header>
          <h3 className="mb-0">Contents Valuation Assessment</h3>
        </Card.Header>
        <Card.Body className="px-2 px-md-4">
          <Row className="g-2">
            <Col lg={3} md={6} sm={12}>
              <Form.Group>
                <Form.Label>Assessment Type</Form.Label>
                <Form.Control
                  type="text"
                  name="assessmentType"
                  value={formData.assessmentType}
                  onChange={handleChange}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col lg={3} md={6} sm={12}>
              <Form.Group>
                <Form.Label>Assessment Number</Form.Label>
                <Form.Control
                  type="text"
                  name="assessmentNumber"
                  value={formData.assessmentNumber}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col lg={3} md={6} sm={12}>
              <Form.Group>
                <Form.Label>Quantifier</Form.Label>
                <Form.Select
                  name="quantifier"
                  value={formData.quantifier}
                  onChange={handleChange}
                >
                  <option value="">Select Quantifier</option>
                  <option value="Nicole Ellis">Nicole Ellis</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mt-3 g-2">
            <Col lg={6} md={12}>
              <Form.Group>
                <Form.Label>Risk Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="riskAddress"
                  value={formData.riskAddress}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col lg={6} md={12}>
              <Form.Group>
                <Form.Label>Postal Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="postalAddress"
                  value={formData.postalAddress}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mt-3 g-2">
            <Col lg={3} md={6} sm={12}>
              <Form.Group>
                <Form.Label>Survey Date</Form.Label>
                <Form.Control
                  type="date"
                  name="surveyDate"
                  value={formData.surveyDate}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col lg={3} md={6} sm={12}>
              <Form.Group>
                <Form.Label>Insurer</Form.Label>
                <Form.Control
                  type="text"
                  name="insurer"
                  value={formData.insurer}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col lg={3} md={6} sm={12}>
              <Form.Group>
                <Form.Label>Broker</Form.Label>
                <Form.Control
                  type="text"
                  name="broker"
                  value={formData.broker}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col lg={3} md={6} sm={12}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="COMPLETE">Complete</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mt-3">
            <Col lg={3} md={4} sm={12}>
              <div className="category-sidebar mb-3 mb-md-0">
                <Card className="contents-card">
                  <Card.Header className="py-2">
                    <h6 className="mb-0">Categories</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="tree-view">
                      {contentsItems.map(section => (
                        <div key={section.id} className="tree-item">
                          <div 
                            className={`tree-parent ${selectedCategory?.id === section.id ? 'active' : ''}`}
                            onClick={() => handleCategorySelect(section)}
                          >
                            <span 
                              className="tree-toggle"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSection(section.id);
                              }}
                            >
                              {expandedSections.includes(section.id) ? '▾' : '▸'}
                            </span>
                            {expandedSections.includes(section.id) ? 
                              <IoFolderOpenOutline size={16} className="folder-icon open" /> : 
                              <IoFolderOutline size={16} className="folder-icon" />
                            }
                            <span className="tree-content">{section.category}</span>
                          </div>
                          <div 
                            className="tree-children"
                            style={{
                              maxHeight: expandedSections.includes(section.id) ? '1000px' : '0',
                              opacity: expandedSections.includes(section.id) ? 1 : 0
                            }}
                          >
                            {section.children.map(category => (
                              <div
                                key={category.id}
                                className={`tree-child ${selectedCategory?.id === category.id ? 'active' : ''}`}
                                onClick={() => handleCategorySelect(category)}
                              >
                                <IoDocumentOutline size={14} className="tree-icon" />
                                <span className="tree-content">{category.category}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>
            <Col lg={9} md={8} sm={12}>
              <Card className="contents-card">
                <Card.Header className="d-flex justify-content-between align-items-center py-2">
                  <span className="text-truncate">
                    {selectedCategory?.isParent 
                      ? selectedCategory.category 
                      : `${selectedCategory?.category || 'Select a Category'}`}
                  </span>
                  {selectedCategory && !selectedCategory.isParent && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="action-button"
                      onClick={() => setShowAddItemModal(true)}
                    >
                      Add Item
                    </Button>
                  )}
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    {loading ? (
                      <div className="text-center p-3">
                        <div className="loading-spinner" />
                      </div>
                    ) : (
                      renderItemsTable()
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mt-3 g-2">
            <Col md={6} sm={12}>
              <Form.Group>
                <Form.Label>Total Assets Value</Form.Label>
                <Form.Control
                  type="number"
                  name="totalAssetsValue"
                  value={calculateTotalValue()}
                  readOnly
                  className="price-input"
                />
              </Form.Group>
            </Col>
            <Col md={6} sm={12}>
              <Form.Group>
                <Form.Label>Negotiated Amount</Form.Label>
                <Form.Control
                  type="number"
                  name="negotiatedAmount"
                  value={formData.negotiatedAmount}
                  onChange={handleChange}
                  className="price-input"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="secondary" onClick={() => navigate(-1)} className="action-button">
              Cancel
            </Button>
            <Button variant="primary" onClick={() => {}} className="action-button">
              Save
            </Button>
            <Button variant="success" onClick={() => {}} className="action-button">
              Complete
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Add Item Modal */}
      <Modal show={showAddItemModal} onHide={() => setShowAddItemModal(false)}>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Add Item to {selectedCategory?.category}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                name="type"
                value={newItem.type}
                onChange={handleNewItemChange}
                required
              >
                <option value="">Select Type</option>
                {itemTypes.map(type => (
                  <option key={type.rank} value={type.type}>
                    {type.type}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={newItem.description}
                onChange={handleNewItemChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Model</Form.Label>
              <Form.Control
                type="text"
                name="model"
                value={newItem.model}
                onChange={handleNewItemChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Selection</Form.Label>
              <Form.Control
                type="text"
                name="selection"
                value={newItem.selection}
                onChange={handleNewItemChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={newItem.price}
                onChange={handleNewItemChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={newItem.location}
                onChange={handleNewItemChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowAddItemModal(false)} className="action-button">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddNewItem} className="action-button">
            Add Item
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Item Modal */}
      <Modal show={showEditItemModal} onHide={() => setShowEditItemModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Control
                type="text"
                name="type"
                value={newItem.type}
                onChange={handleNewItemChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={newItem.description}
                onChange={handleNewItemChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Model</Form.Label>
              <Form.Control
                type="text"
                name="model"
                value={newItem.model}
                onChange={handleNewItemChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Selection</Form.Label>
              <Form.Control
                type="text"
                name="selection"
                value={newItem.selection}
                onChange={handleNewItemChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={newItem.price}
                onChange={handleNewItemChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={newItem.location}
                onChange={handleNewItemChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditItemModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => {}}>
            Update Item
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirmation} onHide={() => setShowDeleteConfirmation(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this item?
          {selectedItem && (
            <div className="mt-2">
              <strong>Type:</strong> {selectedItem.type}<br />
              <strong>Description:</strong> {selectedItem.description}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirmation(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => {}}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ContentsValuation; 