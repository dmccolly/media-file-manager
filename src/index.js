import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';


const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found');
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial, sans-serif; background: #1a1a1a; min-height: 100vh;"><h2>Critical Error</h2><p>Root element not found. The HTML structure may be corrupted.</p><p>Please refresh the page.</p></div>';
} else {
  try {
    console.log('Creating React root...');
    const root = ReactDOM.createRoot(rootElement);
    
    console.log('Rendering React app...');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    setTimeout(() => {
      const rootContent = rootElement.innerHTML;
      const loadingIndicator = document.getElementById('loading-indicator');
      
      if (loadingIndicator && loadingIndicator.parentNode === rootElement) {
        console.error('React failed to mount - loading indicator still present');
        rootElement.innerHTML = '<div style="padding: 20px; color: red; background: #1a1a1a; font-family: Arial, sans-serif; min-height: 100vh;"><h2>React Mounting Failed</h2><p>The React application failed to mount properly.</p><p>This could be due to:</p><ul><li>JavaScript syntax errors</li><li>Missing dependencies</li><li>Browser compatibility issues</li></ul><p>Please try refreshing the page or use a different browser.</p><p>If the problem persists, check the browser console for error details.</p></div>';
      } else if (rootContent.includes('Loading Media File Manager...')) {
        console.error('React failed to mount - still showing loading content');
        rootElement.innerHTML = '<div style="padding: 20px; color: red; background: #1a1a1a; font-family: Arial, sans-serif; min-height: 100vh;"><h2>React Mounting Timeout</h2><p>The React application is taking too long to load.</p><p>Please refresh the page and try again.</p></div>';
      } else {
        console.log('React mounted successfully');
      }
    }, 5000);
    
  } catch (error) {
    console.error('React mounting failed:', error);
    rootElement.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial, sans-serif; background: #1a1a1a; min-height: 100vh;"><h2>React Error</h2><p>The React application failed to load due to an error:</p><p style="background: #333; padding: 10px; border-radius: 4px; font-family: monospace;">' + error.message + '</p><p>Stack trace:</p><pre style="background: #333; padding: 10px; border-radius: 4px; font-size: 12px; overflow: auto;">' + (error.stack || 'No stack trace available') + '</pre><p>Please refresh the page or contact support.</p></div>';
  }
}
