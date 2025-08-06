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
                        '<div class="form-group"><label for="station">Station:</label><select id="station" name="station">'
                        '<option value="">Select station</option><option value="KBOI">KBOI</option>'
                        '<option value="KTIK">KTIK</option><option value="KQFC">KQFC</option>'
                        '<option value="KIZN">KIZN</option></select></div>'
                        '<div class="form-group"><label for="tags">Tags:</label><input type="text" id="tags" name="tags" placeholder="Comma-separated tags"></div>'
                        '<div class="form-group"><label for="priority">Priority:</label><select id="priority" name="priority">'
                        '<option value="normal">Normal</option><option value="high">High</option>'
                        '<option value="urgent">Urgent</option></select></div>'
                        '<div class="form-group"><label for="notes">Notes:</label><textarea id="notes" name="notes" rows="3"></textarea></div>'
                        '<button type="submit">Upload Media</button></form>'
                        '<div id="message"></div>'
                        '<div class="footer-links">'
                        '<a href="/health">System Status</a><a href="/debug-credentials">Debug Info</a>'
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
                    if not title or
