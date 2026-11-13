import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { initLumenAPI } from './utils/webFallbackApi';

// Ensure API is ready for both Electron and Dev/Web environments
initLumenAPI();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
