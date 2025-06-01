/// <reference types="jest" />
import renderer from 'react-test-renderer';
import React from 'react';
import { ThemedText } from '../ThemedText';

describe('ThemedText', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<ThemedText>Test</ThemedText>).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

// If you see a type error for react-test-renderer, run: npm install --save-dev @types/react-test-renderer
