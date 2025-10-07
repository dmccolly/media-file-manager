import { useState } from 'react'

function TestApp() {
  const [count, setCount] = useState(0)

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>📁 Media File Manager - Test Version</h1>
      <p>React is working! Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Click me ({count})
      </button>
    </div>
  )
}

export default TestApp