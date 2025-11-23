/**
 * @file main.tsx
 * @brief Application entry point
 *
 * CRITICAL: Wrap mounting in DOMContentLoaded handler because when using
 * vite-plugin-singlefile with IIFE format, the inline script executes in <head>
 * before the <body> is parsed.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

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
