import React from 'react';
import { HomePage } from './pages/HomePage';
import { ThemeProvider } from './contexts/ThemeContext';
import { SelectedPostsProvider } from './contexts/SelectedPostsContext';
import './styles/globals.css';

function App() {
  return (
    <ThemeProvider>
      <SelectedPostsProvider>
        <HomePage />
      </SelectedPostsProvider>
    </ThemeProvider>
  );
}

export default App;