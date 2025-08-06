#!/usr/bin/env python3
"""
Idaho Broadcasting Media Upload System
Flask application for uploading and managing media files
"""

import os
import logging
from datetime import datetime
from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import requests

# Initialize Flask app
app = Flask(__name__, template_folder='templates')
app.config['TEMPLATES_AUTO_RELOAD'] = True
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
CLOUDINARY_CLOUD_NAME    = os.getenv('CLOUDINARY_CLOUD_NAME', '').strip()
CLOUDINARY_API_KEY       = os.getenv('CLOUDINARY_API_KEY', '').strip()
CLOUDINARY_API_SECRET    = os.getenv('CLOUDINARY_API_SECRET', '').strip()
WEBFLOW_API_TOKEN        = os.getenv('WEBFLOW_API_TOKEN', '').strip()
WEBFLOW_COLLECTION_ID    = os.getenv('WEBFLOW_COLLECTION_ID', '').strip()

# Validate Cloudinary credentials
if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
    logger.error(
        "Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
    )
    CLOUDINARY_CONFIGURED = False
else:
    CLOUDINARY_CONFIGURED = True
    logger.info("Cloudinary credentials configured successfully")

# Allowed file types and size
ALLOWED_EXTENSIONS = {
    'png','jpg','jpeg','gif','mp4','mov','avi','mp3','wav','pdf','doc','docx'
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.',1)[1].lower() in ALLOWED_EXTENSIONS


def validate_file_size(f):
    f.seek(0,2)
    size = f.tell()
    f.seek(0)
    return size <= MAX_FILE_SIZE


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/debug-credentials')
def debug_credentials():
    return jsonify({
        'api_key_clean': CLOUDINARY_API_KEY,
        'api_key_length': len(CLOUDINARY_API_KEY),
        'cloud_name_clean': CLOUDINARY_CLOUD_NAME,
        'cloud_name_length': len(CLOUDINARY_CLOUD_NAME),
        'secret_length': len(CLOUDINARY_API_SECRET),
        'configured': CLOUDINARY_CONFIGURED
    })


@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if not CLOUDINARY_CONFIGURED:
            return jsonify(success=False, error='Cloudinary not configured'), 500

        file = request.files.get('file')
        if not file or file.filename == '':
            return jsonify(success=False, error='No file selected'), 400
        if not allowed_file(file.filename):
            return jsonify(success=False, error='File type not allowed'), 400
        if not validate_file_size(file):
            return jsonify(success=False, error='File size too large (max 50MB)'), 400

        # Gather form fields
        title        = request.form.get('title','').strip()
        category     = request.form.get('category','').strip()
        tags         = request.form.get('tags','').strip() or category
        submitted_by = request.form.get('submitted_by','').strip()
        station      = request.form.get('station','').strip()
        priority     = request.form.get('priority','normal').strip()
        notes        = request.form.get('notes','').strip()
        description  = request.form.get('description','').strip()

        if not title or not category:
            return jsonify(success=False, error='Title and category are required'), 400

        logger.info(f"Uploading {file.filename}")
        file.stream.seek(0)

        # Build Cloudinary payload
        cloudinary_url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/upload"
        context_parts = [f"title={title}", f"category={category}"]
        for k,v in ("submitted_by", submitted_by), ("station", station), ("priority", priority):
            if v:
                context_parts.append(f"{k}={v}")

        data = {
            'upload_preset': 'idaho-broadcasting-unsigned',
            'context': '|'.join(context_parts),
            'tags': tags
        }
        response = requests.post(
            cloudinary_url,
            files={'file': (file.filename, file, file.content_type)},
            data=data
        )
        # Fallback unsigned preset if needed
        if response.status_code != 200:
            data_fallback = {
                'upload_preset': 'ml_default',
                'folder': 'idaho_broadcasting',
                'tags': tags
            }
            response = requests.post(
                cloudinary_url,
                files={'file': (file.filename, file, file.content_type)},
                data=data_fallback
            )

        if response.status_code != 200:
            return jsonify(success=False, error=f"Upload failed: {response.text}"), 500

        result = response.json()
        public_url = result.get('secure_url')
        logger.info(f"Uploaded → {public_url}")

        # Sync to Webflow CMS
        if WEBFLOW_API_TOKEN and WEBFLOW_COLLECTION_ID:
            wf_headers = {
                'Authorization':   f'Bearer {WEBFLOW_API_TOKEN}',
                'Content-Type':    'application/json',
                'Accept-Version':  '1.0.0'
            }
            wf_payload = {
                'fields': {
                    'name':                 title,
                    'slug':                 None,  # let Webflow auto-generate
                    'alt':                  title,
                    'url':                  public_url,
                    'file-size':            result.get('bytes', 0),
                    'mime-type':            file.content_type,
                    'width':                result.get('width'),
                    'height':               result.get('height'),
                    'category':             category,
                    'tags':                 tags,
                    'cloudinary-public-id': result.get('public_id'),
                    'submitted-by':         submitted_by,
                    'station':              station,
                    'priority':             priority,
                    'notes':                notes,
                    'description':          description
                }
            }
            wf_url = f"https://api.webflow.com/collections/{WEBFLOW_COLLECTION_ID}/items?live=true"
            wf_resp = requests.post(wf_url, headers=wf_headers, json=wf_payload)
            logger.info(f"Webflow sync → status {wf_resp.status_code}")
            logger.debug(f"Webflow response body: {wf_resp.text}")
            if wf_resp.status_code not in (200, 201):
                logger.error(f"Webflow sync failed: {wf_resp.text}")

        return jsonify(success=True, cloudinary_url=public_url), 200

    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify(success=False, error=str(e)), 500


@app.route('/health')
def health_check():
    return jsonify(status='healthy', timestamp=datetime.utcnow().isoformat(), configured=CLOUDINARY_CONFIGURED), 200


@app.errorhandler(404)
def not_found(e):
    return jsonify(success=False, error='Endpoint not found'), 404


@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal error: {e}")
    return jsonify(success=False, error='Internal server error'), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port)
