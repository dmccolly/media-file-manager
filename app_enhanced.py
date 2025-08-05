#!/usr/bin/env python3
"""
Idaho Broadcasting Media Upload System - Clean Working Version
Flask application for uploading and managing media files
"""

import os
import logging
import json
from datetime import datetime
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import requests

# Initialize Flask app
app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables (will be set in Heroku)
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')

@app.route('/')
def index():
    """Home page with upload form"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload to Cloudinary"""
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
        
        files = {'file': (file.filename, file.stream, file.content_type)}
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
        
        response_data = {
            'success': True,
            'message': 'File uploaded successfully',
            'cloudinary_url': cloudinary_response.get('secure_url'),
            'public_id': cloudinary_response.get('public_id')
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/test')
def test_config():
    """Test configuration and connections"""
    config_status = {
        'message': 'Flask app is working!',
        'timestamp': datetime.now().isoformat(),
        'cloudinary_configured': bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET),
        'cloudinary_cloud_name': CLOUDINARY_CLOUD_NAME
    }
    
    return jsonify(config_status)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
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
    logger.info("Starting Idaho Broadcasting Media Upload Server...")
    
    # Use PORT environment variable for Heroku
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=False, host='0.0.0.0', port=port)

