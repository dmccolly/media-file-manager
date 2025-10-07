import { useState } from 'react'

function App() {
  const [message, setMessage] = useState('Media File Manager Loading...')

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '40px',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', textAlign: 'center' }}>
          📁 Media File Manager
        </h1>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h2>🎉 React App Successfully Loaded!</h2>
          <p>{message}</p>
          <button 
            onClick={() => setMessage('Button clicked! React is working perfectly.')}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Test React State
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginTop: '30px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <h3>📂 Folders</h3>
            <p>Folder management will be here</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <h3>📁 Files</h3>
            <p>File management will be here</p>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '20px',
            borderRadius: '10px'
          }}>
            <h3>⚙️ Settings</h3>
            <p>Settings will be here</p>
          </div>
        </div>
        
        <div style={{ marginTop: '30px', textAlign: 'center', opacity: 0.8 }}>
          <p>Time: {new Date().toLocaleString()}</p>
          <p>Status: ✅ React App Working</p>
        </div>
      </div>
    </div>
  )
}

export default App