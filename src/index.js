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
      console.error('All React mounting attempts failed, showing enhanced fallback UI');
      rootElement.innerHTML = 
        '<div style="padding: 20px; color: white; background: #1a1a1a; font-family: Arial, sans-serif; min-height: 100vh;">' +
        '<h2>Media File Manager - Technical Issue</h2>' +
        '<p>The React application failed to mount after multiple attempts. This could be due to:</p>' +
        '<ul>' +
        '<li><strong>Browser Compatibility:</strong> Your browser may not support modern JavaScript features</li>' +
        '<li><strong>Network Issues:</strong> JavaScript files may not have loaded completely</li>' +
        '<li><strong>Extension Conflicts:</strong> Browser extensions might be blocking JavaScript execution</li>' +
        '<li><strong>Cache Issues:</strong> Outdated cached files may be causing conflicts</li>' +
        '</ul>' +
        '<div style="margin: 20px 0; padding: 15px; background: #2d2d2d; border-radius: 8px;">' +
        '<h3>Troubleshooting Steps:</h3>' +
        '<ol>' +
        '<li>Hard refresh: <strong>Ctrl+F5</strong> (Windows) or <strong>Cmd+Shift+R</strong> (Mac)</li>' +
        '<li>Clear browser cache and cookies for this site</li>' +
        '<li>Disable browser extensions temporarily</li>' +
        '<li>Try a different browser (Chrome, Firefox, Safari, Edge)</li>' +
        '<li>Check if JavaScript is enabled in your browser settings</li>' +
        '</ol>' +
        '</div>' +
        '<div style="margin-top: 20px; padding: 15px; background: #333; border-radius: 8px; font-family: monospace; font-size: 12px;">' +
        '<strong>Technical Details:</strong><br>' +
        'User Agent: ' + navigator.userAgent + '<br>' +
        'Timestamp: ' + new Date().toISOString() + '<br>' +
        'React Available: ' + (typeof window.React !== 'undefined') + '<br>' +
        'ReactDOM Available: ' + (typeof window.ReactDOM !== 'undefined') +
        '</div>' +
        '<div style="margin-top: 20px;">' +
        '<button onclick="window.location.reload()" style="padding: 12px 24px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 10px;">Retry</button>' +
        '<button onclick="window.location.href=window.location.href.split(\'?\')[0] + \'?cache=\' + Date.now()" style="padding: 12px 24px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">Force Refresh</button>' +
        '</div>' +
        '</div>';
    };
    
    setTimeout(checkReactMount, 5000);
    
  } catch (error) {
    console.error('React mounting failed:', error);
    rootElement.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial, sans-serif; background: #1a1a1a; min-height: 100vh;"><h2>React Error</h2><p>The React application failed to load due to an error:</p><p style="background: #333; padding: 10px; border-radius: 4px; font-family: monospace;">' + error.message + '</p><p>Stack trace:</p><pre style="background: #333; padding: 10px; border-radius: 4px; font-size: 12px; overflow: auto;">' + (error.stack || 'No stack trace available') + '</pre><p>Please refresh the page or contact support.</p></div>';
  }
}
