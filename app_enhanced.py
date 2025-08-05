#!/usr/bin/env python3
"""
Idaho Broadcasting Media Upload System - Fixed Version
Flask application for uploading and managing media files
"""

import os
import logging
import hashlib
import hmac
from datetime import datetime
from urllib.parse import quote
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

# Environment variables validation
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '').strip()
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '').strip()
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '').strip()

# Validate Cloudinary credentials at startup
if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
    logger.error("Missing Cloudinary credentials. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.")
    CLOUDINARY_CONFIGURED = False
else:
    CLOUDINARY_CONFIGURED = True
    logger.info("Cloudinary credentials configured successfully")

# Allowed file extensions and max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'mp3', 'wav', 'pdf', 'doc', 'docx'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file):
    """Check if file size is within limits"""
    file.seek(0, 2)  # Seek to end
    size = file.tell()
    file.seek(0)  # Reset to beginning
    return size <= MAX_FILE_SIZE

@app.route('/')
def index():
    """Home page with upload form"""
    try:
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Template error: {e}")
        # Fallback HTML if template is missing
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Media Upload</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
                button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%; font-size: 16px; }
                button:hover { background: #0056b3; }
                .error { color: red; margin-top: 10px; padding: 10px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; }
                .success { color: green; margin-top: 10px; padding: 10px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; }
                .footer-links { margin-top: 30px; text-align: center; padding: 20px; border-top: 1px solid #ddd; }
                .footer-links a { color: #007bff; text-decoration: none; margin: 0 15px; }
                .footer-links a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <h1>Idaho Broadcasting Media Upload</h1>
            <p style="color: #666; font-size: 12px; margin-bottom: 20px;">Version 1.5.0 - Updated UI</p>
            <form id="uploadForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="file">Select Media File:</label>
                    <input type="file" id="file" name="file" required>
                </div>
                <div class="form-group">
                    <label for="title">Title:</label>
                    <input type="text" id="title" name="title" required>
                </div>
                <div class="form-group">
                    <label for="description">Description:</label>
                    <textarea id="description" name="description" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="category">Category:</label>
                    <select id="category" name="category" required>
                        <option value="">Select category</option>
                        <option value="audio">Audio</option>
                        <option value="video">Video</option>
                        <option value="photo">Photo</option>
                        <option value="document">Document</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="station">Station:</label>
                    <input type="text" id="station" name="station" placeholder="Enter station identifier">
                </div>
                <div class="form-group">
                    <label for="submitted_by">Submitted By:</label>
                    <input type="text" id="submitted_by" name="submitted_by">
                </div>
                <div class="form-group">
                    <label for="tags">Tags:</label>
                    <input type="text" id="tags" name="tags" placeholder="Separate tags with commas">
                </div>
                <div class="form-group">
                    <label for="notes">Notes:</label>
                    <textarea id="notes" name="notes" rows="3"></textarea>
                </div>
                <button type="submit">Upload Media</button>
            </form>
            <div id="message"></div>
            
            <div class="footer-links">
                <a href="/health">System Status</a>
                <a href="/debug-credentials">Debug Info</a>
                <a href="https://cloudinary.com/console" target="_blank">Cloudinary Console</a>
            </div>
            
            <script>
                document.getElementById('uploadForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const formData = new FormData(this);
                    const messageDiv = document.getElementById('message');
                    
                    messageDiv.innerHTML = 'Uploading...';
                    
                    try {
                        const response = await fetch('/upload', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            messageDiv.innerHTML = '<div class="success">File uploaded successfully!</div>';
                            this.reset();
                        } else {
                            messageDiv.innerHTML = '<div class="error">Error: ' + result.error + '</div>';
                        }
                    } catch (error) {
                        messageDiv.innerHTML = '<div class="error">Upload failed: ' + error.message + '</div>';
                    }
                });
            </script>
        </body>
        </html>
        '''

@app.route('/debug-credentials')
def debug_credentials():
    """Debug the actual credential values"""
    return jsonify({
        'api_key_clean': CLOUDINARY_API_KEY,  # Clean version without repr()
        'api_key_length': len(CLOUDINARY_API_KEY),
        'cloud_name_clean': CLOUDINARY_CLOUD_NAME,  # Clean version
        'cloud_name_length': len(CLOUDINARY_CLOUD_NAME),
        'secret_length': len(CLOUDINARY_API_SECRET) if CLOUDINARY_API_SECRET else 0,
        'configured': CLOUDINARY_CONFIGURED
    })

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload to Cloudinary with proper signed upload"""
    try:
        # Check if Cloudinary is configured
        if not CLOUDINARY_CONFIGURED:
            return jsonify({'success': False, 'error': 'Cloudinary not configured'}), 500
        
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Validate file extension
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'File type not allowed'}), 400
        
        # Validate file size
        if not validate_file_size(file):
            return jsonify({'success': False, 'error': 'File size too large (max 50MB)'}), 400
        
        # Get form data
        title = request.form.get('title', '').strip()
        category = request.form.get('category', '').strip()
        tags = request.form.get('tags', '').strip()
        
        # Validate required fields
        if not title:
            return jsonify({'success': False, 'error': 'Title is required'}), 400
        if not category:
            return jsonify({'success': False, 'error': 'Category is required'}), 400
        
        logger.info(f"Processing upload: {file.filename}")
        
        # Reset file stream position
        file.stream.seek(0)
        
        # Try unsigned upload first (recommended for most use cases)
        cloudinary_url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/upload"
        
        # Use unsigned upload with our custom preset
        data = {
            'upload_preset': 'idaho-broadcasting-unsigned',  # Match the actual preset name
            'context': f'title={title}|category={category}'
        }
        
        # Add tags if provided
        if tags:
            data['tags'] = tags
        else:
            data['tags'] = category
        
        logger.info(f"Trying unsigned upload with preset: idaho-broadcasting-unsigned")
        logger.info(f"Upload data: {data}")
        
        # Prepare file for upload
        files = {'file': (file.filename, file, file.content_type)}
        
        # Make the request
        response = requests.post(cloudinary_url, files=files, data=data)
        
        logger.info(f"Unsigned upload response status: {response.status_code}")
        logger.info(f"Unsigned upload response: {response.text}")
        
        # If unsigned upload fails, try with ml_default as fallback
        if response.status_code != 200:
            logger.info("Custom preset failed, trying ml_default...")
            
            # Reset file stream
            file.stream.seek(0)
            
            # Try with ml_default
            data_fallback = {
                'upload_preset': 'ml_default',
                'folder': 'idaho_broadcasting'
            }
            
            if tags:
                data_fallback['tags'] = tags
            else:
                data_fallback['tags'] = category
            
            files = {'file': (file.filename, file, file.content_type)}
            response = requests.post(cloudinary_url, files=files, data=data_fallback)
            
            logger.info(f"ml_default response status: {response.status_code}")
            logger.info(f"ml_default response: {response.text}")
        
        if response.status_code != 200:
            return jsonify({
                'success': False, 
                'error': f'Both unsigned uploads failed: {response.text}',
                'status_code': response.status_code
            }), 500
        
        cloudinary_response = response.json()
        logger.info(f"Upload successful: {cloudinary_response.get('public_id')})"
        (
        # Sync to Webflow CMS Media Assets
        try:
            webflow_api_token = os.getenv('WEBFLOW_API_TOKEN')
            webflow_site_id = os.getenv('WEBFLOW_SITE_ID')
            
            if webflow_api_token and webflow_site_id:
                # Create asset in Webflow CMS
                webflow_headers = {
                    'Authorization': f'Bearer {webflow_api_token}',
                    'Content-Type': 'application/json'
                }
                
                webflow_data = {
                    'fields': {
                        'name': title,
                        'alt': title,
                        'url': cloudinary_response.get('secure_url'),
                        'file-size': cloudinary_response.get('bytes', 0),
                        'mime-type': file.content_type,
                        'width': cloudinary_response.get('width'),
                        'height': cloudinary_response.get('height'),
                        'category': category,
                        'tags': tags if tags else '',
                        'cloudinary-public-id': cloudinary_response.get('public_id')
                    }
                }
                
                webflow_url = f'https://api.webflow.com/v2/sites/{webflow_site_id}/cms/collections/media-assets/items'
                webflow_response = requests.post(webflow_url, headers=webflow_headers, json=webflow_data)
                
                if webflow_response.status_code == 201:
                    logger.info(f"Successfully synced to Webflow CMS: {webflow_response.json()}")
                else:
                    logger.error(f"Failed to sync to Webflow CMS: {webflow_response.status_code} - {webflow_response.text}")
            else:
                logger.warning("Webflow API credentials not configured - skipping CMS sync")
        except Exception as webflow_error:
            logger.error(f"Webflow sync error: {str(webflow_error)}")
            # Don't fail the upload if Webflow sync fails
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'cloudinary_url': cloudinary_response.get('secure_url'),
            'public_id': cloudinary_response.get('public_id'),
            'title': title,
            'category': category
        })
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/test')
def test_config():
    """Test configuration and connections"""
    config_status = {
        'message': 'Flask app is working!',
        'timestamp': datetime.now().isoformat(),
        'cloudinary_configured': CLOUDINARY_CONFIGURED,
        'cloudinary_cloud_name': CLOUDINARY_CLOUD_NAME if CLOUDINARY_CONFIGURED else 'Not configured'
    }
    
    return jsonify(config_status)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.4.0',
        'cloudinary_configured': CLOUDINARY_CONFIGURED
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
