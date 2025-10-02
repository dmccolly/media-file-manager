import fetch from 'node-fetch';

// Test the Xano API endpoint
const testXanoAPI = async () => {
  console.log('Testing Xano API endpoint...');
  
  try {
    // Try to access the API endpoint without authentication first
    const response = await fetch('https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission');
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Data received:', data);
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error testing Xano API:', error.message);
  }
};

testXanoAPI();