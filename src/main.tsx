import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

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
        <App />
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
