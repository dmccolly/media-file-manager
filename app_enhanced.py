#!/usr/bin/env python3
"""
Idaho Broadcasting Media Upload System - Final Corrected Version
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
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')

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
                input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
                button:hover { background: #0056b3; }
                .error { color: red; margin-top: 10px; }
                .success { color: green; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h1>Idaho Broadcasting Media Upload</h1>
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
                    <input type="text" id="station" name="station">
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
                <button type="submit">Upload File</button>
            </form>
            <div id="message"></div>
            
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

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload to Cloudinary"""
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
        description = request.form.get('description', '').strip()
        category = request.form.get('category', '').strip()
        station = request.form.get('station', '').strip()
        submitted_by = request.form.get('submitted_by', '').strip()
        tags = request.form.get('tags', '').strip()
        notes = request.form.get('notes', '').strip()
        
        # Validate required fields
        if not title:
            return jsonify({'success': False, 'error': 'Title is required'}), 400
        if not category:
            return jsonify({'success': False, 'error': 'Category is required'}), 400
        
        logger.info(f"Processing upload: {file.filename}")
        
        # Reset file stream position
        file.stream.seek(0)
        
        # Upload to Cloudinary
        cloudinary_url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/upload"
        
        # Prepare upload data with metadata
        timestamp = str(int(datetime.now().timestamp()))
        
        # Create context with form data (URL encode special characters)
        context_parts = [f"title={quote(title)}", f"category={quote(category)}"]
        if description:
            context_parts.append(f"description={quote(description)}")
        if station:
            context_parts.append(f"station={quote(station)}")
        if submitted_by:
            context_parts.append(f"submitted_by={quote(submitted_by)}")
        
        context = "|".join(context_parts)
        tags_value = tags if tags else category
        
        # Prepare data dictionary with all parameters
        data = {
            'api_key': CLOUDINARY_API_KEY,
            'timestamp': timestamp,
            'folder': 'idaho_broadcasting',
            'context': context,
            'tags': tags_value
        }
        
        # Generate signature with exactly the parameters being sent (alphabetically ordered)
        params_to_sign = f"api_key={data['api_key']}&context={data['context']}&folder={data['folder']}&tags={data['tags']}&timestamp={data['timestamp']}"
        
        signature = hmac.new(
            CLOUDINARY_API_SECRET.encode('utf-8'),
            params_to_sign.encode('utf-8'),
            hashlib.sha1
        ).hexdigest()
        
        data['signature'] = signature
        
        # Prepare file for upload
        files = {'file': (file.filename, file, file.content_type)}
        
        logger.info(f"Uploading to Cloudinary with params: {list(data.keys())}")
        
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
            'public_id': cloudinary_response.get('public_id'),
            'title': title,
            'category': category
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
        'version': '1.2.0',
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

