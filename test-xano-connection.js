import fetch from 'node-fetch';

// Test the Xano API endpoint
const testXanoConnection = async () => {
  console.log('Testing Xano API connection...');
  
  try {
    // Try to access the API endpoint
    const response = await fetch('https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission');
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Data received:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error testing Xano API:', error.message);
  }
};

testXanoConnection();