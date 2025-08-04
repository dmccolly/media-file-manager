#!/usr/bin/env python3
"""
Idaho Broadcasting Media Upload System - Enhanced Version
Flask application for uploading and managing media files with Cloudinary and Supabase integration
"""

import os
import logging
from datetime import datetime
from flask import Flask, request, render_template, jsonify, redirect, url_for
from flask_cors import CORS
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Cloudinary configuration
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# Initialize Supabase client
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
else:
    logger.warning("Supabase credentials not found")

@app.route('/')
def index():
    """Home page with upload form"""
    return render_template('index_enhanced.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload to Cloudinary and save metadata to Supabase"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Get form data
        title = request.form.get('title', '')
        description = request.form.get('description', '')
        category = request.form.get('category', '')
        station = request.form.get('station', '')
        submitted_by = request.form.get('submitted_by', '')
        tags = request.form.get('tags', '')
        notes = request.form.get('notes', '')
        
        logger.info(f"Processing upload: {file.filename}")
        
        # Upload to Cloudinary
        cloudinary_url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/upload"
        
        files = {'file': (file.filename, file.stream, file.content_type )}
        data = {
            'api_key': CLOUDINARY_API_KEY,
            'timestamp': str(int(datetime.now().timestamp())),
            'folder': 'idaho_broadcasting'
        }
        
        # Generate signature for Cloudinary
        import hashlib
        import hmac
        
        params_to_sign = f"folder=idaho_broadcasting&timestamp={data['timestamp']}"
        signature = hmac.new(
            CLOUDINARY_API_SECRET.encode('utf-8'),
            params_to_sign.encode('utf-8'),
            hashlib.sha1
        ).hexdigest()
        
        data['signature'] = signature
        
        response = requests.post(cloudinary_url, files=files, data=data)
        
        if response.status_code != 200:
            logger.error(f"Cloudinary upload failed: {response.text}")
            return jsonify({'success': False, 'error': 'Upload to Cloudinary failed'}), 500
        
        cloudinary_response = response.json()
        logger.info(f"Cloudinary upload successful: {cloudinary_response.get('public_id')}")
        
        # Save metadata to Supabase
        if supabase:
            media_data = {
                'title': title or file.filename,
                'description': description,
                'category': category,
                'station': station,
                'submitted_by': submitted_by,
                'tags': tags,
                'notes': notes,
                'original_filename': file.filename,
                'cloudinary_public_id': cloudinary_response.get('public_id'),
                'cloudinary_url': cloudinary_response.get('secure_url'),
                'file_type': cloudinary_response.get('resource_type'),
                'file_size': cloudinary_response.get('bytes'),
                'width': cloudinary_response.get('width'),
                'height': cloudinary_response.get('height'),
                'format': cloudinary_response.get('format'),
                'upload_date': datetime.now().isoformat()
            }
            
            result = supabase.table('media_assets').insert(media_data).execute()
            logger.info(f"Metadata saved to Supabase: {result.data}")
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'cloudinary_url': cloudinary_response.get('secure_url'),
            'public_id': cloudinary_response.get('public_id')
        })
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/media')
def list_media():
    """List all media assets from Supabase"""
    try:
        if not supabase:
            return render_template('media_list_enhanced.html', media_items=[], error="Database connection not available")
        
        # Fetch all media from Supabase
        result = supabase.table('media_assets').select("*").order('upload_date', desc=True).execute()
        
        if result.data:
            logger.info(f"Retrieved {len(result.data)} media items")
            return render_template('media_list_enhanced.html', media_items=result.data)
        else:
            return render_template('media_list_enhanced.html', media_items=[], error=None)
            
    except Exception as e:
        logger.error(f"Error fetching media: {str(e)}")
        return render_template('media_list_enhanced.html', media_items=[], error=str(e))

@app.route('/api/media')
def api_media():
    """API endpoint to get all media as JSON"""
    try:
        if not supabase:
            return jsonify({'error': 'Database connection not available'}), 500
        
        result = supabase.table('media_assets').select("*").order('upload_date', desc=True).execute()
        return jsonify(result.data)
        
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/media/<int:media_id>')
def api_media_item(media_id):
    """API endpoint to get specific media item"""
    try:
        if not supabase:
            return jsonify({'error': 'Database connection not available'}), 500
        
        result = supabase.table('media_assets').select("*").eq('id', media_id).execute()
        
        if result.data:
            return jsonify(result.data[0])
        else:
            return jsonify({'error': 'Media not found'}), 404
            
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/delete/<int:media_id>', methods=['DELETE'])
def delete_media(media_id):
    """Delete media item from Supabase and Cloudinary"""
    try:
        if not supabase:
            return jsonify({'error': 'Database connection not available'}), 500
        
        # Get media item first
        result = supabase.table('media_assets').select("*").eq('id', media_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Media not found'}), 404
        
        media_item = result.data[0]
        
        # Delete from Cloudinary
        if media_item.get('cloudinary_public_id'):
            cloudinary_delete_url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/image/destroy"
            
            import hashlib
            import hmac
            
            timestamp = str(int(datetime.now( ).timestamp()))
            params_to_sign = f"public_id={media_item['cloudinary_public_id']}&timestamp={timestamp}"
            signature = hmac.new(
                CLOUDINARY_API_SECRET.encode('utf-8'),
                params_to_sign.encode('utf-8'),
                hashlib.sha1
            ).hexdigest()
            
            delete_data = {
                'public_id': media_item['cloudinary_public_id'],
                'api_key': CLOUDINARY_API_KEY,
                'timestamp': timestamp,
                'signature': signature
            }
            
            requests.post(cloudinary_delete_url, data=delete_data)
        
        # Delete from Supabase
        supabase.table('media_assets').delete().eq('id', media_id).execute()
        
        return jsonify({'success': True, 'message': 'Media deleted successfully'})
        
    except Exception as e:
        logger.error(f"Delete error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/test')
def test_config():
    """Test configuration and connections"""
    config_status = {
        'message': 'Flask app is working!',
        'timestamp': datetime.now().isoformat(),
        'cloudinary_configured': bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET),
        'cloudinary_cloud_name': CLOUDINARY_CLOUD_NAME,
        'supabase_configured': bool(SUPABASE_URL and SUPABASE_KEY),
        'supabase_url': SUPABASE_URL,
        'supabase_connection': 'Connected' if supabase else 'Not connected',
        'cors_enabled': True,
        'max_content_length': app.config.get('MAX_CONTENT_LENGTH')
    }
    
    # Test Supabase connection
    if supabase:
        try:
            result = supabase.table('media_assets').select("count", count="exact").execute()
            config_status['media_count'] = result.count
        except Exception as e:
            config_status['supabase_error'] = str(e)
    
    return jsonify(config_status)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.1.0'
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle internal server errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Check if required environment variables are set
    required_vars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'SUPABASE_URL', 'SUPABASE_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.warning(f"Missing environment variables: {', '.join(missing_vars)}")
        print("Please set these in your .env file or environment")
    else:
        logger.info("All required environment variables are set")
    
    logger.info("Starting Idaho Broadcasting Media Upload Server...")
    
    # Use PORT environment variable for Heroku, fallback to 5001 for local development
    port = int(os.environ.get('PORT', 5001))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
