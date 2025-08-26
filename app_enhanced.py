#!/usr/bin/env python3
"""
Unified Idaho Broadcasting Media Upload System
Uploads files to Xano and syncs with Webflow CMS
Compatible with VoxPro Manager search
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

# Environment variables
XANO_API_BASE = os.getenv('XANO_API_BASE', 'https://x8ki-letl-twmt.n7.xano.io/api:pYeQctVX')
WEBFLOW_API_TOKEN = os.getenv('WEBFLOW_API_TOKEN', '')
WEBFLOW_SITE_ID = os.getenv('WEBFLOW_SITE_ID', '')

# File validation
ALLOWED_EXTENSIONS = {
    'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi',
    'mp3', 'wav', 'pdf', 'doc', 'docx'
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

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
                .success { color: green; padding: 10px; background: #f0f8f0; border-radius: 4px; }
                .error { color: red; padding: 10px; background: #f8f0f0; border-radius: 4px; }
            </style>
        </head>
        <body>
            <h1>Idaho Broadcasting Media Upload</h1>
            <form action="/upload" method="post" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="file">Select Media File:</label>
                    <input type="file" id="file" name="file" required accept=".png,.jpg,.jpeg,.gif,.mp4,.mov,.avi,.mp3,.wav,.pdf,.doc,.docx">
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
                
                <button type="submit">Upload Media</button>
            </form>
        </body>
        </html>
        '''

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload to Xano and sync to Webflow"""
    try:
        # Validate file
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'File type not allowed'}), 400
        
        if not validate_file_size(file):
            return jsonify({'success': False, 'error': 'File size too large (max 50MB)'}), 400
        
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
        
        logger.info(f"Processing upload: {file.filename}")
        
        # Upload file to Xano
        xano_upload_url = f"{XANO_API_BASE}/upload/attachment"
        
        # Prepare file for Xano upload
        file.seek(0)  # Reset file pointer
        files = {'file': (file.filename, file, file.content_type)}
        
        # Upload to Xano file storage
        upload_response = requests.post(xano_upload_url, files=files)
        
        if upload_response.status_code != 200:
            logger.error(f"Xano upload failed: {upload_response.status_code} - {upload_response.text}")
            return jsonify({'success': False, 'error': f'Upload failed: {upload_response.text}'}), 500
        
        upload_data = upload_response.json()
        logger.info(f"Xano upload successful: {upload_data}")
        
        # Create media record in Xano database
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
            'file_size': len(file.read()),
            'database_url': upload_data,  # Store the Xano file reference
            'created_at': int(datetime.now().timestamp() * 1000),
            'is_featured': False
        }
        
        # Reset file pointer after reading size
        file.seek(0)
        
        # Save media record to Xano
        media_create_url = f"{XANO_API_BASE}/voxpro"
        media_response = requests.post(media_create_url, json=media_data)
        
        if media_response.status_code not in [200, 201]:
            logger.error(f"Xano media record creation failed: {media_response.status_code} - {media_response.text}")
            return jsonify({'success': False, 'error': f'Media record creation failed: {media_response.text}'}), 500
        
        media_record = media_response.json()
        logger.info(f"Xano media record created: {media_record}")
        
        # Sync to Webflow CMS (if configured)
        webflow_success = True
        if WEBFLOW_API_TOKEN and WEBFLOW_SITE_ID:
            try:
                webflow_data = {
                    'fields': {
                        'name': title,
                        'slug': title.lower().replace(' ', '-').replace('_', '-'),
                        'title': title,
                        'description': description,
                        'station': station,
                        'category': category,
                        'tags': tags,
                        'submitted-by': submitted_by,
                        'priority': priority,
                        'notes': notes,
                        'file-type': file.content_type,
                        'xano-id': str(media_record.get('id', ''))
                    }
                }
                
                webflow_url = f"https://api.webflow.com/v2/sites/{WEBFLOW_SITE_ID}/cms/collections/media-assets/items"
                webflow_headers = {
                    'Authorization': f'Bearer {WEBFLOW_API_TOKEN}',
                    'Content-Type': 'application/json'
                }
                
                webflow_response = requests.post(webflow_url, headers=webflow_headers, json=webflow_data)
                
                if webflow_response.status_code in [200, 201]:
                    logger.info(f"Webflow sync successful")
                else:
                    logger.error(f"Webflow sync failed: {webflow_response.status_code} - {webflow_response.text}")
                    webflow_success = False
                    
            except Exception as webflow_error:
                logger.error(f"Webflow sync error: {webflow_error}")
                webflow_success = False
        
        return jsonify({
            'success': True,
            'message': 'Upload successful!',
            'xano_id': media_record.get('id'),
            'webflow_synced': webflow_success,
            'file_url': upload_data.get('url', ''),
            'redirect': '/'
        }), 200
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'xano_configured': bool(XANO_API_BASE),
        'webflow_configured': bool(WEBFLOW_API_TOKEN and WEBFLOW_SITE_ID)
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

