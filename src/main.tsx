import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import App from './App';
import AppBoundary from './AppBoundary';

// Wait for the DOM to be fully loaded before mounting the React app. This
// prevents a potential race condition where React tries to hydrate before the
// root element is available, which can result in a blank page.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}

/**
 * Renders the root React component into the DOM. If the root element
 * cannot be found, logs an error instead of throwing. Wrapping the
 * application in AppBoundary ensures that any uncaught exceptions during
 * rendering or lifecycle methods are contained and result in a friendly
 * error message instead of a white screen.
 */
function renderApp() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <AppBoundary>
          <App />
        </AppBoundary>
      </StrictMode>,
    );
  } else {
    console.error('Failed to find the root element');
  }
}
