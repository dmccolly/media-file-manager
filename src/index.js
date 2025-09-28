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
    
    let mountCheckAttempts = 0;
    const maxAttempts = 3;
    
    const checkReactMount = () => {
      mountCheckAttempts++;
      const rootContent = rootElement.innerHTML;
      const loadingIndicator = document.getElementById('loading-indicator');
      
      if (loadingIndicator && loadingIndicator.parentNode === rootElement) {
        console.error(`React mounting attempt ${mountCheckAttempts} failed - loading indicator still present`);
        
        if (mountCheckAttempts < maxAttempts) {
          console.log(`Retrying React mount (attempt ${mountCheckAttempts + 1}/${maxAttempts})...`);
          setTimeout(() => {
            try {
              const newRoot = ReactDOM.createRoot(rootElement);
              newRoot.render(<React.StrictMode><App /></React.StrictMode>);
              setTimeout(checkReactMount, 3000);
            } catch (retryError) {
              console.error('React retry failed:', retryError);
              showFallbackUI();
            }
          }, 1000);
        } else {
          showFallbackUI();
        }
      } else if (rootContent.includes('Loading Media File Manager...')) {
        console.error(`React mounting attempt ${mountCheckAttempts} timeout - still showing loading content`);
        if (mountCheckAttempts < maxAttempts) {
          setTimeout(checkReactMount, 2000);
        } else {
          showFallbackUI();
        }
      } else {
        console.log('React mounted successfully');
      }
    };
    
    const showFallbackUI = () => {
      console.error('All React mounting attempts failed, showing fallback UI');
      rootElement.innerHTML = `
        <div style="padding: 20px; color: white; background: #1a1a1a; font-family: Arial, sans-serif; min-height: 100vh;">
          <h2>Media File Manager</h2>
          <p>The application is experiencing technical difficulties. Please try:</p>
          <ul>
            <li>Refreshing the page (Ctrl+F5 or Cmd+Shift+R)</li>
            <li>Clearing your browser cache</li>
            <li>Using a different browser (Chrome, Firefox, Safari)</li>
            <li>Checking your internet connection</li>
          </ul>
          <p>If the problem persists, please contact support.</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
        </div>
      `;
    };
    
    setTimeout(checkReactMount, 5000);
    
  } catch (error) {
    console.error('React mounting failed:', error);
    rootElement.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial, sans-serif; background: #1a1a1a; min-height: 100vh;"><h2>React Error</h2><p>The React application failed to load due to an error:</p><p style="background: #333; padding: 10px; border-radius: 4px; font-family: monospace;">' + error.message + '</p><p>Stack trace:</p><pre style="background: #333; padding: 10px; border-radius: 4px; font-size: 12px; overflow: auto;">' + (error.stack || 'No stack trace available') + '</pre><p>Please refresh the page or contact support.</p></div>';
  }
}
