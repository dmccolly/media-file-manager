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
                        
                        if (result.success) {```
logger.info(f"Upload successful: {cloudinary_response.get('public_id')}")
                        messageDiv.innerHTML = '<div class="success">File uploaded successfully!</div>';
                        this.reset();
                    } else {
                        messageDiv.innerHTML = '<div class="error">Error: ' + result.error + '</div>';
                    }
