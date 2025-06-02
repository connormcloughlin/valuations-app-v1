import React from 'react';
import { createTables } from './utils/db';
import HomeScreen from './src/screens/HomeScreen';

function App() {
  React.useEffect(() => {
    createTables().then(() => {
      console.log('SQLite tables created!');
    }).catch(e => {
      console.error('Error creating SQLite tables:', e);
    });
  }, []);

  return (
    <HomeScreen />
  );
}

export default App; 