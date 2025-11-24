/**
 * @file main.tsx
 * @brief React application entry point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

// Wait for DOM to be ready before mounting React
// This is critical because when bundled as IIFE with vite-plugin-singlefile,
// the script may execute before the body's #root div exists
const mount = () => {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } else {
    console.error('Could not find #root element');
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
