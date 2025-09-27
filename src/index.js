import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found');
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial, sans-serif;">Error: Root element not found. Please refresh the page.</div>';
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('React mounting failed:', error);
    rootElement.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial, sans-serif; background: #1a1a1a; min-height: 100vh;"><h2>Error Loading Application</h2><p>The React application failed to load. Please refresh the page.</p><p>Error details: ' + error.message + '</p></div>';
  }
}
