import React from 'react';

/**
 * Error boundary component that gracefully handles uncaught exceptions in
 * the React component tree. When an error is detected, this component
 * renders a simple fallback UI instead of letting the entire app white‑screen.
 */
type State = { hasError: boolean };

export default class AppBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  /**
   * React lifecycle method that is triggered when a child component throws
   * an error. Returning a new state here will cause the boundary to render
   * the fallback UI.
   */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * Lifecycle hook for logging the error details. In a production setting
   * this could be wired up to an external logging service instead of
   * simply printing to the console.
   */
  componentDidCatch(err: unknown, info: unknown) {
    console.error('UI crash', err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            maxWidth: 640,
            margin: '10vh auto',
            padding: 16,
            border: '1px solid #ddd',
            borderRadius: 12,
            background: '#fff'
          }}
        >
          <h2 style={{ marginTop: 0 }}>Couldn’t load the File Manager</h2>
          <p>
            Check <code>/api/media</code> and your environment variables.
          </p>
          <p style={{ fontSize: 14, color: '#666' }}>
            Open DevTools → Network and look for failing requests.
          </p>
        </div>
      );
    }
    // When no error is present, simply render the children as expected.
    return this.props.children;
  }
}
