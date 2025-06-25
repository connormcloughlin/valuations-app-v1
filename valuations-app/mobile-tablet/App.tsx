import React from 'react';
import HomeScreen from './src/screens/HomeScreen';

function App() {
  // Database initialization is now handled by AuthContext
  // No need to initialize it here as well
  
  return (
    <HomeScreen />
  );
}

export default App; 