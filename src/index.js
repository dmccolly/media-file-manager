import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';


const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found');
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial, sans-serif; background: #1a1a1a; min-height: 100vh;"><h2>Critical Error</h2><p>Root element not found. The HTML structure may be corrupted.</p><p>Please refresh the page.</p></div>';
} else {
  let mountCheckAttempts = 0;
  const maxAttempts = 3;
  
  const checkReactMount = () => {
    mountCheckAttempts++;
    const rootContent = rootElement.innerHTML;
    const loadingIndicator = document.getElementById('loading-indicator');
    
    const hasReactContent = rootContent.includes('HOIBF File Manager') || 
                           rootContent.includes('Choose Files') || 
                           rootContent.includes('Upload Files') ||
                           rootContent.includes('Storage Used') ||
                           rootContent.includes('QUICK ACCESS');
    
    const hasLoadingIndicator = loadingIndicator && loadingIndicator.parentNode === rootElement;
    const hasLoadingText = rootContent.includes('Loading Media File Manager...');
    
    const hasRawHTML = rootContent.includes('<') && rootContent.includes('>') && 
                      !hasReactContent && !hasLoadingText && !hasLoadingIndicator;
    
    console.log(`Mount check ${mountCheckAttempts}/${maxAttempts}: hasReactContent=${hasReactContent}, hasLoadingIndicator=${hasLoadingIndicator}, hasLoadingText=${hasLoadingText}, hasRawHTML=${hasRawHTML}`);
    console.log(`Root content length: ${rootContent.length}, first 200 chars: ${rootContent.substring(0, 200)}`);
    
    if (hasReactContent && !hasLoadingIndicator && !hasLoadingText) {
      console.log('✅ React mounted successfully with content verification');
      return;
    }
    
    if (hasRawHTML) {
      console.error(`🚨 Raw HTML detected instead of React content - this is the reported issue!`);
      console.error(`Raw HTML content: ${rootContent.substring(0, 1000)}`);
      
      if (mountCheckAttempts < maxAttempts) {
        console.log(`Attempting to fix raw HTML issue (attempt ${mountCheckAttempts + 1}/${maxAttempts})...`);
        setTimeout(() => {
          try {
            rootElement.innerHTML = '';
            setTimeout(() => {
              rootElement.innerHTML = '<div id="loading-indicator" style="padding: 20px; color: white; background: #1a1a1a; text-align: center;">Fixing React mounting...</div>';
              
              if (typeof ReactDOM.createRoot !== 'undefined') {
                const newRoot = ReactDOM.createRoot(rootElement);
                newRoot.render(<React.StrictMode><App /></React.StrictMode>);
              } else if (typeof ReactDOM.render !== 'undefined') {
                ReactDOM.render(<React.StrictMode><App /></React.StrictMode>, rootElement);
              } else {
                throw new Error('No React rendering method available');
              }
              
              setTimeout(checkReactMount, 3000);
            }, 500);
          } catch (retryError) {
            console.error('React retry failed:', retryError);
            showFallbackUI();
          }
        }, 1000);
      } else {
        showFallbackUI();
      }
      return;
    }
    
    if (hasLoadingIndicator || hasLoadingText) {
      console.error(`React mounting attempt ${mountCheckAttempts} failed - still showing loading state`);
      
      if (mountCheckAttempts < maxAttempts) {
        console.log(`Retrying React mount (attempt ${mountCheckAttempts + 1}/${maxAttempts})...`);
        setTimeout(() => {
          try {
            rootElement.innerHTML = '<div id="loading-indicator" style="padding: 20px; color: white; background: #1a1a1a; text-align: center;">Loading Media File Manager...</div>';
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
    } else if (!hasReactContent && rootContent.length > 0) {
      console.error(`React mounting failed - unexpected content detected: ${rootContent.substring(0, 500)}`);
      if (mountCheckAttempts < maxAttempts) {
        setTimeout(checkReactMount, 2000);
      } else {
        showFallbackUI();
      }
    } else if (rootContent.length === 0) {
      console.error(`React mounting failed - empty root element`);
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
    rootElement.innerHTML = `
      <div style="padding: 20px; color: white; background: #1a1a1a; font-family: Arial, sans-serif; min-height: 100vh;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Media File Manager</h2>
        <div style="background: #2d2d2d; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #ef4444; margin-bottom: 15px;">Application Loading Failed</h3>
          <p>The React application failed to initialize properly. This is typically caused by:</p>
          <ul style="margin: 15px 0; padding-left: 20px;">
            <li>Browser compatibility issues with modern JavaScript</li>
            <li>Network connectivity problems</li>
            <li>JavaScript execution being blocked</li>
            <li>Insufficient browser resources</li>
          </ul>
        </div>
        
        <div style="background: #2d2d2d; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #10b981; margin-bottom: 15px;">Troubleshooting Steps:</h3>
          <ol style="margin: 15px 0; padding-left: 20px;">
            <li><strong>Hard Refresh:</strong> Press Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)</li>
            <li><strong>Clear Browser Data:</strong> Clear cache, cookies, and site data</li>
            <li><strong>Try Different Browser:</strong> Use Chrome 60+, Firefox 55+, Safari 12+, or Edge 79+</li>
            <li><strong>Disable Extensions:</strong> Temporarily disable ad blockers and other extensions</li>
            <li><strong>Check JavaScript:</strong> Ensure JavaScript is enabled in browser settings</li>
            <li><strong>Private Mode:</strong> Try opening in incognito/private browsing mode</li>
          </ol>
        </div>
        
        <div style="margin: 20px 0;">
          <button onclick="window.location.reload()" style="padding: 12px 24px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; margin: 5px; font-size: 16px;">Retry Loading</button>
          <button onclick="window.location.href='/fallback.html'" style="padding: 12px 24px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; margin: 5px; font-size: 16px;">Fallback Page</button>
          <button onclick="window.location.href='/?cache=' + Date.now()" style="padding: 12px 24px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; margin: 5px; font-size: 16px;">Force Refresh</button>
        </div>
        
        <div style="background: #333; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; margin-top: 20px;">
          <strong>Debug Information:</strong><br>
          User Agent: ` + navigator.userAgent + `<br>
          Timestamp: ` + new Date().toISOString() + `<br>
          Mount Attempts: ` + mountCheckAttempts + `/` + maxAttempts + `<br>
          Error: React mounting failed after multiple attempts
        </div>
      </div>
    `;
  };

  try {
    console.log('Creating React root...');
    
    if (typeof ReactDOM === 'undefined' || typeof ReactDOM.createRoot === 'undefined') {
      console.error('ReactDOM.createRoot not available - using legacy render');
      if (typeof ReactDOM.render !== 'undefined') {
        console.log('Falling back to ReactDOM.render...');
        ReactDOM.render(<React.StrictMode><App /></React.StrictMode>, rootElement);
      } else {
        throw new Error('No React rendering method available');
      }
    } else {
      const root = ReactDOM.createRoot(rootElement);
      console.log('Rendering React app...');
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    }
    
    setTimeout(checkReactMount, 5000);
    
  } catch (error) {
    console.error('React mounting failed:', error);
    showFallbackUI();
  }
}
