import React from 'react';

type State = { hasError: boolean };

export default class AppBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: unknown, info: unknown) {
    // You can wire this to a logger if you want
    console.error('UI crash', err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: 640, margin: '10vh auto', padding: 16,
          border: '1px solid #ddd', borderRadius: 12, background: '#fff'
        }}>
          <h2 style={{ marginTop: 0 }}>Couldn’t load the File Manager</h2>
          <p>Check <code>/api/media</code> and your environment variables.</p>
          <p style={{ fontSize: 14, color: '#666' }}>
            If this persists, open DevTools → Network and look for failing requests.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
