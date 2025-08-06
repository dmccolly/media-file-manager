#!/usr/bin/env python3
"""
Idaho Broadcasting Media Upload System - Fixed Version
Flask application for uploading and managing media files
"""

import os
import logging
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
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '').strip()
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '').strip()
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '').strip()

# Validate Cloudinary credentials
if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
    logger.error(
        "Missing Cloudinary credentials. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    )
    CLOUDINARY_CONFIGURED = False
else:
    CLOUDINARY_CONFIGURED = True
    logger.info("Cloudinary credentials configured successfully")

# Allowed extensions and size limit
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
    try:
        return render_template('index.html')
    except Exception as e:
        logger.error(f"Template error: {e}")
        return (
            '<!DOCTYPE html>'
            '<html><head><title>Media Upload</title>'
            '<style>'
            'body { font-family: Arial, sans-serif; max-width:800px; margin:0 auto; padding:20px; }'
            '.form-group { margin-bottom:15px; }'
            'label { display:block; margin-bottom:5px; font-weight:bold; }'
            'input, select, textarea { width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; }'
            'button { background:#007bff; color:#fff; padding:10px 20px; border:none; border-radius:4px; cursor:pointer; width:100%; font-size:16px; }'
            'button:hover { background:#0056b3; }'
            '.error { color:red; padding:10px; background:#f8d7da; border:1px solid #f5c6cb; border-radius:4px; }'
            '.success { color:green; padding:10px; background:#d4edda; border:1px solid #c3e6cb; border-radius:4px; }'
            '.footer-links { margin-top:30px; text-align:center; padding:20px; border-top:1px solid #ddd; }'
            '.footer-links a { color:#007bff; text-decoration:none; margin:0 15px; }'
            '.footer-links a:hover { text-decoration:underline; }'
            '</style></head><body>'
            '<h1>Idaho Broadcasting Media Upload</h1>'
            '<form id="uploadForm" enctype="multipart/form-data">'
            '<div class="form-group"><label for="file">Select Media File:</label><input type="file" id="file" name="file" required></div>'
            '<div class="form-group"><label for="title">Title:</label><input type="text" id="title" name="title" required></div>'
            '<div class="form-group"><label for="description">Description:</label><textarea id="description" name="description" rows="3"></textarea></div>'
            '<div class="form-group"><label for="category">Category:</label><select id="category" name="category" required>'
            '<option value="">Select category</option><option value="audio">Audio</option>'
            '<option value="video">Video</option><option value="photo">Photo</option>'
            '<option value="document">Document</option><option value="other">Other</option>'
            '</select></div>'
            '<div class="form-group"><label for="submitted_by">Submitted By:</label><input type="text" id="submitted_by" name="submitted_by" placeholder="Your name"></div>'
            '<div class="form-group"><label for="station">Station:</label><input type="text" id="station" name="station" placeholder="Comma-separated stations (e.g., KBOI, KTIK)"></div>'
            '<div class="form-group"><label for="tags">Tags:</label><input type="text" id="tags" name="tags" placeholder="Comma-separated tags"></div>'
            '<div class="form-group"><label for="priority">Priority:</label><select id="priority" name="priority">'
            '<option value="normal">Normal</option><option value="high">High</option>'
            '<option value="urgent">Urgent</option></select></div>'
            '<div class="form-group"><label for="notes">Notes:</label><textarea id="notes" name="notes" rows="2" placeholder="Additional notes or comments"></textarea></div>'
            '<button type="submit">Upload Media</button></form>'
            '<div id="message"></div>'
            '<div class="footer-links">'
            'a href="/health">System Status</a><a href="/debug-credentials">Debug Info</a>'
            '<a href="https://cloudinary.com/console" target="_blank">Cloudinary Console</a>'
            '</div>'
            '<script>'
            'document.getElementById("uploadForm").addEventListener("submit", async function(e) {'
            'e.preventDefault(); const formData=new FormData(this); const msg=document.getElementById("message");'
            'msg.innerHTML="Uploading...";'
            'try { const res=await fetch("/upload",{method:"POST",body:formData});'
            'const result=await res.json();'
            "if(result.success){msg.innerHTML=\"<div class='success'>File uploaded successfully!</div>\";this.reset();}"
            "else {msg.innerHTML=\"<div class='error'>Error: \"+result.error+\"</div>\";}"
            "} catch(err){msg.innerHTML=\"<div class='error'>Upload failed: \"+err.message+\"</div>\";} });"
            '</script></body></html>'
        )


@app.route('/debug-credentials')
def debug_credentials():
    return jsonify({
        'api_key_clean': CLOUDINARY_API_KEY,
        'api_key_length': len(CLOUDINARY_API_KEY),
        'cloud_name_clean': CLOUDINARY_CLOUD_NAME,
        'cloud_name_length': len(CLOUDINARY_CLOUD_NAME),
        'secret_length': len(CLOUDINARY_API_SECRET) if CLOUDINARY_API_SECRET else 0,
        'configured': CLOUDINARY_CONFIGURED
    })

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if not CLOUDINARY_CONFIGURED:
            return jsonify({'success': False, 'error': 'Cloudinary not configured'}), 500
        file = request.files.get('file')
        if not file or file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'File type not allowed'}), 400
        if not validate_file_size(file):
            return jsonify({'success': False, 'error': 'File size too large (max 50MB)'}), 400

        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        category = request.form.get('category', '').strip()
        submitted_by = request.form.get('submitted_by', '').strip()
        station = request.form.get('station', '').strip()
        tags = request.form.get('tags', '').strip()
        priority = request.form.get('priority', 'normal').strip()
        notes = request.form.get('notes', '').strip()
        if not title or not category:
            return jsonify({'success': False, 'error': 'Title and category are required'}), 400

        logger.info(f"Processing upload: {file.filename}")
        file.stream.seek(0)
        cloudinary_url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/upload"
        data = {'upload_preset': 'idaho-broadcasting-unsigned', 'context': f'title={title}|category={category}'}
        data['tags'] = tags if tags else category
        response = requests.post(cloudinary_url, files={'file': (file.filename, file, file.content_type)}, data=data)
        if response.status_code != 200:
            file.stream.seek(0)
            data_fallback = {'upload_preset': 'ml_default', 'folder': 'idaho_broadcasting'}
            data_fallback['tags'] = tags if tags else category
            response = requests.post(cloudinary_url, files={'file': (file.filename, file, file.content_type)}, data=data_fallback)
        if response.status_code != 200:
            return jsonify({'success': False, 'error': f'Upload failed: {response.text}'}), 500

        cloudinary_response = response.json()
        logger.info(f"Upload successful: {cloudinary_response.get('public_id')}")

        # Sync to Webflow CMS
        webflow_token = os.getenv('WEBFLOW_API_TOKEN')
        webflow_site = os.getenv('WEBFLOW_SITE_ID')
        webflow_collection = os.getenv('WEBFLOW_COLLECTION_ID')
        if webflow_token and webflow_site and webflow_collection:
            wf_headers = {'Authorization': f'Bearer {webflow_token}', 'Content-Type': 'application/json'}
            wf_data = {
                'fields': {
                    'name': title,
                    'alt': title,
                    'url': cloudinary_response.get('secure_url'),
                    'file-size': cloudinary_response.get('bytes', 0),
                    'mime-type': file.content_type,
                    'width': cloudinary_response.get('width'),
                    'height': cloudinary_response.get('height'),
                    'category': category,
                    'tags': tags or '',
                    'cloudinary-public-id': cloudinary_response.get('public_id'),
                    'submitted-by': submitted_by or '',
                    'station': station or '',
                    'priority': priority or 'normal',
                    'notes': notes or '',
                    'description': description or ''
                }
            }
            wf_url = f'https://api.webflow.com/v2/collections/{webflow_collection}/items'
            wf_resp = requests.post(wf_url, headers=wf_headers, json=wf_data)
            if wf_resp.status_code == 201:
                logger.info(f"Synced to Webflow CMS: {wf_resp.json()}")
            else:
                logger.error(f"Webflow sync failed: {wf_resp.status_code} - {wf_resp.text}")

        return jsonify({'success': True, 'cloudinary_url': cloudinary_response.get('secure_url')}), 200
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat(), 'configured': CLOUDINARY_CONFIGURED}), 200


@app.errorhandler(404)
def not_found(e):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal server error: {e}")
    return jsonify({'success': False, 'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting server on port {port}...")
    app.run(host='0.0.0.0', port=port)
