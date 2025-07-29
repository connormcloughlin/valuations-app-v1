import React, { useState } from 'react';
import { Tabs, Tab, Container } from 'react-bootstrap';
import ElectronicsPricingTool from '../components/pricing/ElectronicsPricingTool';
import ArtworkPricingTool from '../components/pricing/ArtworkPricingTool';

const PricingTools = () => {
  const [key, setKey] = useState('electronics');
  return (
    <Container className="mt-4">
      <h1 className="mb-4">Pricing Tools</h1>
      <Tabs activeKey={key} onSelect={setKey} className="mb-3">
        <Tab eventKey="electronics" title="Electronics">
          <ElectronicsPricingTool />
        </Tab>
        <Tab eventKey="artwork" title="Artwork">
          <ArtworkPricingTool />
        </Tab>
      </Tabs>
    </Container>
  );
};

export default PricingTools; 