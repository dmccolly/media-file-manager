#!/usr/bin/env python3
"""
Fixed Idaho Broadcasting Media Upload System
Properly uploads files to Xano with correct file references
Increased file size limit to 250MB
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
app.config['MAX_CONTENT_LENGTH'] = 250 * 1024 * 1024  # 250MB limit
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
XANO_API_BASE = os.getenv('XANO_API_BASE', 'https://x8ki-letl-twmt.n7.xano.io/api:pYeQctVX')
WEBFLOW_API_TOKEN = os.getenv('WEBFLOW_API_TOKEN', '')
WEBFLOW_SITE_ID = os.getenv('WEBFLOW_SITE_ID', '')

# File validation
ALLOWED_EXTENSIONS = {
    'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi',
    'mp3', 'wav', 'pdf', 'doc', 'docx', 'mkv', 'wmv', 'flv'
}
MAX_FILE_SIZE = 250 * 1024 * 1024  # 250MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file):
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    return size <= MAX_FILE_SIZE

@app.route('/')
def index():
    """Main upload form"""
    try:
        return render_template('upload_form.html')
    except Exception as e:
        logger.error(f"Template error: {e}")
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Idaho Broadcasting Media Upload</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .form-group { margin-bottom: 15px; }
                label { display: block; margin-bottom: 5px; font-weight: bold; }
                input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                button { background: #007fff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
                button:hover { background: #0056b3; }
                .success { color: green; padding: 10px; background: #f0f8f0; border-radius: 4px; margin: 10px 0; }
                .error { color: red; padding: 10px; background: #f8f0f0; border-radius: 4px; margin: 10px 0; }
                .file-info { font-size: 12px; color: #666; margin-top: 5px; }
            </style>
        </head>
        <body>
            <h1>Idaho Broadcasting Media Upload</h1>
            <p><strong>Maximum file size: 250MB</strong></p>
            
            <form action="/upload" method="post" enctype="multipart/form-data" id="uploadForm">
                <div class="form-group">
                    <label for="file">Select Media File:</label>
                    <input type="file" id="file" name="file" required accept=".png,.jpg,.jpeg,.gif,.mp4,.mov,.avi,.mp3,.wav,.pdf,.doc,.docx,.mkv,.wmv,.flv">
                    <div class="file-info">Supported formats: Video (MP4, MOV, AVI, MKV, WMV, FLV), Audio (MP3, WAV), Images (PNG, JPG, GIF), Documents (PDF, DOC, DOCX)</div>
                </div>
                
                <div class="form-group">
                    <label for="title">Title:</label>
                    <input type="text" id="title" name="title" required>
                </div>
                
                <div class="form-group">
                    <label for="station">Station:</label>
                    <input type="text" id="station" name="station" placeholder="e.g., KIVI, KNIN">
                </div>
                
                <div class="form-group">
                    <label for="category">Category:</label>
                    <select id="category" name="category" required>
                        <option value="">Select Category</option>
                        <option value="news">News</option>
                        <option value="sports">Sports</option>
                        <option value="weather">Weather</option>
                        <option value="commercial">Commercial</option>
                        <option value="promo">Promo</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="description">Description:</label>
                    <textarea id="description" name="description" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="tags">Tags:</label>
                    <input type="text" id="tags" name="tags" placeholder="Comma-separated tags">
                </div>
                
                <div class="form-group">
                    <label for="submitted_by">Submitted By:</label>
                    <input type="text" id="submitted_by" name="submitted_by">
                </div>
                
                <div class="form-group">
                    <label for="priority">Priority:</label>
                    <select id="priority" name="priority">
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="notes">Notes:</label>
                    <textarea id="notes" name="notes" rows="2"></textarea>
                </div>
                
                <button type="submit" id="submitBtn">Upload Media</button>
                <div id="uploadStatus"></div>
            </form>
            
            <script>
                document.getElementById('uploadForm').addEventListener('submit', function(e) {
                    const submitBtn = document.getElementById('submitBtn');
                    const status = document.getElementById('uploadStatus');
                    
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Uploading...';
                    status.innerHTML = '<div style="color: blue;">Uploading file, please wait...</div>';
                });
                
                document.getElementById('file').addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                        const status = document.getElementById('uploadStatus');
                        if (file.size > 250 * 1024 * 1024) {
                            status.innerHTML = '<div class="error">File too large! Maximum size is 250MB. Your file is ' + sizeMB + 'MB.</div>';
                        } else {
                            status.innerHTML = '<div style="color: green;">File selected: ' + file.name + ' (' + sizeMB + 'MB)</div>';
                        }
                    }
                });
            </script>
        </body>
        </html>
        '''

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload to Xano with proper file storage"""
    try:
        logger.info("=== STARTING FILE UPLOAD ===")
        
        # Validate file
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'File type not allowed'}), 400
        
        if not validate_file_size(file):
            return jsonify({'success': False, 'error': 'File size too large (max 250MB)'}), 400
        
        # Get form data
        title = request.form.get('title', '').strip()
        category = request.form.get('category', '').strip()
        tags = request.form.get('tags', '').strip()
        submitted_by = request.form.get('submitted_by', '').strip()
        station = request.form.get('station', '').strip()
        priority = request.form.get('priority', 'normal').strip()
        notes = request.form.get('notes', '').strip()
        description = request.form.get('description', '').strip()
        
        if not title or not category:
            return jsonify({'success': False, 'error': 'Title and category are required'}), 400
        
        logger.info(f"Processing upload: {file.filename} ({file.content_type})")
        
        # Get file size
        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)
        logger.info(f"File size: {file_size} bytes")
        
        # Method 1: Try Xano file upload endpoint
        try:
            logger.info("Attempting Xano file upload...")
            xano_upload_url = f"{XANO_API_BASE}/upload/attachment"
            
            # Prepare file for upload
            files = {'file': (file.filename, file.read(), file.content_type)}
            file.seek(0)  # Reset for potential retry
            
            upload_response = requests.post(xano_upload_url, files=files, timeout=60)
            logger.info(f"Xano upload response: {upload_response.status_code}")
            
            if upload_response.status_code == 200:
                upload_data = upload_response.json()
                logger.info(f"Xano upload successful: {upload_data}")
                
                # Create media record with proper file reference
                media_data = {
                    'title': title,
                    'description': description,
                    'station': station,
                    'category': category,
                    'tags': tags,
                    'submitted_by': submitted_by,
                    'priority': priority,
                    'notes1': notes,
                    'notes2': '',
                    'file_type': file.content_type,
                    'file_size': file_size,
                    'database_url': upload_data,  # This should contain the proper file reference
                    'created_at': int(datetime.now().timestamp() * 1000),
                    'is_featured': False
                }
                
                # Save to Xano database
                media_create_url = f"{XANO_API_BASE}/voxpro"
                media_response = requests.post(media_create_url, json=media_data, timeout=30)
                
                if media_response.status_code in [200, 201]:
                    media_record = media_response.json()
                    logger.info(f"Media record created successfully: {media_record.get('id')}")
                    
                    return jsonify({
                        'success': True,
                        'message': f'Upload successful! File: {file.filename}',
                        'xano_id': media_record.get('id'),
                        'file_size': file_size,
                        'file_url': upload_data.get('url', ''),
                        'redirect': '/'
                    }), 200
                else:
                    logger.error(f"Media record creation failed: {media_response.status_code} - {media_response.text}")
                    return jsonify({'success': False, 'error': f'Database save failed: {media_response.text}'}), 500
            else:
                logger.error(f"Xano upload failed: {upload_response.status_code} - {upload_response.text}")
                
        except Exception as upload_error:
            logger.error(f"Xano upload error: {upload_error}")
        
        # Method 2: Try alternative Xano endpoints
        alternative_endpoints = [
            f"{XANO_API_BASE}/upload",
            f"{XANO_API_BASE}/file/upload",
            f"{XANO_API_BASE}/media/upload"
        ]
        
        for endpoint in alternative_endpoints:
            try:
                logger.info(f"Trying alternative endpoint: {endpoint}")
                file.seek(0)
                files = {'file': (file.filename, file.read(), file.content_type)}
                
                alt_response = requests.post(endpoint, files=files, timeout=60)
                if alt_response.status_code == 200:
                    logger.info(f"Alternative endpoint successful: {endpoint}")
                    upload_data = alt_response.json()
                    
                    # Create media record
                    media_data = {
                        'title': title,
                        'description': description,
                        'station': station,
                        'category': category,
                        'tags': tags,
                        'submitted_by': submitted_by,
                        'priority': priority,
                        'notes1': notes,
                        'file_type': file.content_type,
                        'file_size': file_size,
                        'database_url': upload_data,
                        'created_at': int(datetime.now().timestamp() * 1000),
                        'is_featured': False
                    }
                    
                    media_create_url = f"{XANO_API_BASE}/voxpro"
                    media_response = requests.post(media_create_url, json=media_data, timeout=30)
                    
                    if media_response.status_code in [200, 201]:
                        media_record = media_response.json()
                        return jsonify({
                            'success': True,
                            'message': f'Upload successful via {endpoint}!',
                            'xano_id': media_record.get('id'),
                            'file_size': file_size,
                            'redirect': '/'
                        }), 200
                        
            except Exception as alt_error:
                logger.error(f"Alternative endpoint {endpoint} failed: {alt_error}")
                continue
        
        # If all upload methods fail, create record without file
        logger.warning("All file upload methods failed, creating metadata-only record")
        
        media_data = {
            'title': f"{title} (UPLOAD FAILED)",
            'description': f"{description}\n\nNOTE: File upload failed - {file.filename}",
            'station': station,
            'category': category,
            'tags': tags,
            'submitted_by': submitted_by,
            'priority': priority,
            'notes1': f"{notes}\nOriginal filename: {file.filename}",
            'file_type': file.content_type,
            'file_size': file_size,
            'database_url': {'error': 'upload_failed', 'filename': file.filename},
            'created_at': int(datetime.now().timestamp() * 1000),
            'is_featured': False
        }
        
        media_create_url = f"{XANO_API_BASE}/voxpro"
        media_response = requests.post(media_create_url, json=media_data, timeout=30)
        
        if media_response.status_code in [200, 201]:
            media_record = media_response.json()
            return jsonify({
                'success': False,
                'error': 'File upload failed, but metadata saved',
                'message': 'Upload failed - check Xano configuration',
                'xano_id': media_record.get('id'),
                'redirect': '/'
            }), 500
        else:
            return jsonify({
                'success': False,
                'error': 'Complete upload failure',
                'message': 'Both file upload and metadata save failed'
            }), 500
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'max_file_size': '250MB',
        'xano_configured': bool(XANO_API_BASE),
        'webflow_configured': bool(WEBFLOW_API_TOKEN and WEBFLOW_SITE_ID)
    })

@app.route('/test-xano')
def test_xano():
    """Test Xano connectivity"""
    try:
        test_url = f"{XANO_API_BASE}/voxpro"
        response = requests.get(test_url, timeout=10)
        return jsonify({
            'xano_status': response.status_code,
            'xano_response': response.text[:200],
            'api_base': XANO_API_BASE
        })
    except Exception as e:
        return jsonify({
            'xano_status': 'error',
            'error': str(e),
            'api_base': XANO_API_BASE
        })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(413)
def file_too_large(error):
    return jsonify({'error': 'File too large - maximum size is 250MB'}), 413

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

