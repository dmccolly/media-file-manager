// /.netlify/functions/aircheck-tracks.js
// Backend endpoint for storing/retrieving aircheck player track configuration
// This allows tracks to be editable via admin panel while working across all devices

const XANO_API_BASE = process.env.XANO_API_BASE || 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX';
const XANO_API_KEY = process.env.XANO_API_KEY;
const ADMIN_PASSWORD = 'HOIBF###';

// Config is stored in user_submission table with this special title
const CONFIG_TITLE = '__aircheck_player_config__';
// Known config record ID (created in Xano user_submission table)
const CONFIG_RECORD_ID = 3541;

const DEFAULT_TRACKS = [
  { label: 'Track 1', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { label: 'Track 2', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { label: 'Track 3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { label: 'Track 4', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { label: 'Track 5', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { label: 'Track 6', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' }
];

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Password',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // GET - Retrieve current track configuration (public)
    if (event.httpMethod === 'GET') {
      return await getTracks(headers);
    }

    // POST/PUT - Update track configuration (requires admin password)
    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      const adminPassword = event.headers['x-admin-password'] || event.headers['X-Admin-Password'];
      
      if (adminPassword !== ADMIN_PASSWORD) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Unauthorized - Invalid admin password' })
        };
      }

      const body = JSON.parse(event.body);
      return await saveTracks(body.tracks, headers);
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Aircheck tracks error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Server error',
        message: error.message
      })
    };
  }
};

async function getTracks(headers) {
  try {
    // Fetch from Xano user_submission table using the known config record ID
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (XANO_API_KEY) {
      fetchOptions.headers['Authorization'] = `Bearer ${XANO_API_KEY}`;
    }

    // Fetch the specific config record by ID
    const response = await fetch(
      `${XANO_API_BASE}/user_submission/${CONFIG_RECORD_ID}`,
      fetchOptions
    );

    if (response.ok) {
      const record = await response.json();
      
      // The tracks are stored as JSON string in the description field
      if (record && record.description) {
        try {
          const configData = JSON.parse(record.description);
          if (configData && configData.tracks && Array.isArray(configData.tracks)) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ tracks: configData.tracks, source: 'database' })
            };
          }
        } catch (parseError) {
          console.error('Error parsing config JSON:', parseError);
        }
      }
    } else {
      console.log('Xano response not ok:', response.status);
    }

    // If no config found in database, return defaults
    console.log('No valid config found in Xano, returning defaults');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ tracks: DEFAULT_TRACKS, source: 'defaults' })
    };

  } catch (error) {
    console.error('Error fetching tracks from Xano:', error);
    // Return defaults on error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ tracks: DEFAULT_TRACKS, source: 'defaults', error: error.message })
    };
  }
}

async function saveTracks(tracks, headers) {
  try {
    if (!tracks || !Array.isArray(tracks)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid tracks data - must be an array' })
      };
    }

    // Store tracks as JSON in the description field of the user_submission record
    const configData = JSON.stringify({ tracks: tracks });

    const fetchOptions = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: configData
      })
    };

    if (XANO_API_KEY) {
      fetchOptions.headers['Authorization'] = `Bearer ${XANO_API_KEY}`;
    }

    // Update the existing config record in user_submission table
    const response = await fetch(
      `${XANO_API_BASE}/user_submission/${CONFIG_RECORD_ID}`,
      fetchOptions
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Xano save error:', errorData);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to save tracks to database',
          details: errorData
        })
      };
    }

    const savedData = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Tracks saved successfully',
        tracks: tracks
      })
    };

  } catch (error) {
    console.error('Error saving tracks to Xano:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to save tracks',
        message: error.message
      })
    };
  }
}
