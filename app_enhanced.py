#!/usr/bin/env python3
import os
import logging
import json
from datetime import datetime
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['MAX_CONTENT_LENGTH'] = 250 * 1024 * 1024  # 250MB limit
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# USE THE SAME XANO WORKSPACE AS VOXPRO
XANO_API_BASE = 'https://x8ki-letl-twmt.n7.xano.io/api:pYeqCtV'

ALLOWED_EXTENSIONS = {
    'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi',
    'mp3', 'wav', 'pdf', 'doc', 'docx', 'mkv', 'wmv', 'flv'
}

MAX_FILE_SIZE = 250 * 1024 * 1024  # 250MB

def allowed_file(filename ):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file):
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    return size <= MAX_FILE_SIZE

@app.route('/')
def index():
    return render_template('upload.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        logger.info("File upload started")
        
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'File type not allowed'}), 400
        
        if not validate_file_size(file):
            return jsonify({'success': False, 'error': 'File size exceeds 250MB limit'}), 400
        
        # Get form data
        title = request.form.get('title', '')
        description = request.form.get('description', '')
        station = request.form.get('station', '')
        category = request.form.get('category', '')
        tags = request.form.get('tags', '')
        submitted_by = request.form.get('submitted_by', '')
        priority = request.form.get('priority', '')
        notes = request.form.get('notes', '')
        
        # Create media record directly in VoxPro's Xano workspace
        media_data = {
            'title': title,
            'description': description,
            'station': station,
            'category': category,
            'tags': tags,
            'submitted_by': submitted_by,
            'priority': priority,
            'notes': notes,
            'notes2': '',
            'file_type': file.content_type,
            'file_size': len(file.read()),
            'database_url': f"https://x8ki-letl-twmt.n7.xano.io/vault/{file.filename}",  # Direct file URL
            'created_at': int(datetime.now( ).timestamp() * 1000),
            'is_featured': False
        }
        
        # Reset file pointer
        file.seek(0)
        
        # Save to VoxPro's Xano database (/voxpro endpoint)
        media_create_url = f"{XANO_API_BASE}/voxpro"
        media_response = requests.post(media_create_url, json=media_data, timeout=30)
        
        if media_response.status_code in [200, 201]:
            media_record = media_response.json()
            logger.info(f"Media record created successfully: {media_record.get('id')}")
            
            return jsonify({
                'success': True,
                'message': f'Upload successful! File: {file.filename}',
                'xano_id': media_record.get('id'),
                'file_size': media_data['file_size'],
                'redirect': '/'
            }), 200
        else:
            logger.error(f"Media record creation failed: {media_response.status_code} - {media_response.text}")
            return jsonify({'success': False, 'error': f'Database save failed: {media_response.status_code}'}), 500
    
    except Exception as upload_error:
        logger.error(f"Upload failed: {upload_error}")
        return jsonify({'success': False, 'error': f'Upload failed: {str(upload_error)}'}), 500

@app.route('/debug-info')
def debug_info():
    return jsonify({
        'xano_api_base': XANO_API_BASE,
        'max_file_size': f"{MAX_FILE_SIZE / (1024*1024)}MB",
        'allowed_extensions': list(ALLOWED_EXTENSIONS),
        'status': 'File Manager using same Xano workspace as VoxPro'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
