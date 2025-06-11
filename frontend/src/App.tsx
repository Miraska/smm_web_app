import React from 'react';
import { HomePage } from './pages/HomePage';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/globals.css';

function App() {
  return (
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>
  );
}

export default App;