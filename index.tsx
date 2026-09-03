import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './src/styles/global.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Unable to find the application root element.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
