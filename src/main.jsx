import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.jsx';
import './shared/styles/tokens.css';
import './shared/styles/global.css';
import './shared/styles/layout.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

