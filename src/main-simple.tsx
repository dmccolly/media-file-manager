import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Simple test component to verify React is working
function SimpleApp() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '40px',
        borderRadius: '15px',
        textAlign: 'center'
      }}>
        <h1>🎉 React App is Working!</h1>
        <p>Media File Manager is loading...</p>
        <p>Time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}

// Simplified mounting logic
function renderApp() {
  console.log('Attempting to render app...');
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }
  
  console.log('Root element found, creating React root...');
  
  try {
    const root = createRoot(rootElement);
    console.log('React root created, rendering app...');
    
    root.render(
      <StrictMode>
        <SimpleApp />
      </StrictMode>
    );
    
    console.log('App rendered successfully!');
  } catch (error) {
    console.error('Error rendering app:', error);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  console.log('DOM still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  console.log('DOM already loaded, rendering immediately...');
  renderApp();
}