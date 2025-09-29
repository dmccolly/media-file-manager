#!/usr/bin/env python3
import os
import logging
import json
from datetime import datetime
from flask import Flask, request, render_template, jsonify, send_from_directory
from flask_cors import CORS
import requests
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url

app = Flask(__name__, static_folder='src/build/static', static_url_path='/static')
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['MAX_CONTENT_LENGTH'] = 250 * 1024 * 1024  # 250MB limit
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# USE THE SAME XANO WORKSPACE AS VOXPRO
XANO_API_BASE = 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX'

cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', 'dzrw8nopf'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)

WEBFLOW_API_KEY = os.environ.get('WEBFLOW_API_KEY')
WEBFLOW_SITE_ID = os.environ.get('WEBFLOW_SITE_ID', 'default-site-id')

def sync_to_webflow(media_record, cloudinary_url):
    """Sync media record to Webflow CMS"""
    if not WEBFLOW_API_KEY:
        return False
    
    try:
        webflow_headers = {
            'Authorization': f'Bearer {WEBFLOW_API_KEY}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        webflow_data = {
            'name': media_record.get('title', 'Untitled'),
            'slug': f"media-{media_record.get('id', 'unknown')}",
            'fields': {
                'title': media_record.get('title', ''),
                'description': media_record.get('description', ''),
                'media-url': cloudinary_url,
                'category': media_record.get('category', ''),
                'tags': media_record.get('tags', ''),
                'station': media_record.get('station', ''),
                'file-type': media_record.get('file_type', ''),
                'file-size': media_record.get('file_size', 0),
                'created-date': datetime.now().isoformat()
            }
        }
        
        webflow_url = f"https://api.webflow.com/sites/{WEBFLOW_SITE_ID}/collections/media/items"
        response = requests.post(webflow_url, headers=webflow_headers, json=webflow_data, timeout=10)
        
        if response.status_code in [200, 201]:
            logger.info(f"Successfully synced to Webflow: {response.json()}")
            return True
        else:
            logger.warning(f"Webflow sync failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Webflow sync error: {e}")
        return False

ALLOWED_EXTENSIONS = set()  # Allow all file types

MAX_FILE_SIZE = 250 * 1024 * 1024  # 250MB

def allowed_file(filename):
    return '.' in filename and len(filename.rsplit('.', 1)[1]) > 0

def validate_file_size(file):
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    return size <= MAX_FILE_SIZE

@app.route('/')
def index():
    return render_template('upload.html')

@app.route('/manager')
def file_manager():
    """Serve the React file manager interface"""
    return send_from_directory('src/build', 'index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve React static files"""
    return send_from_directory('src/build/static', filename)

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
        
        try:
            cloudinary_result = cloudinary.uploader.upload(
                file,
                folder="HIBF_assets",
                resource_type="auto",
                public_id=f"{int(datetime.now().timestamp())}_{file.filename}"
            )
            cloudinary_file_url = cloudinary_result['secure_url']
            logger.info(f"File uploaded to Cloudinary: {cloudinary_file_url}")
        except Exception as cloudinary_error:
            logger.error(f"Cloudinary upload failed: {cloudinary_error}")
            return jsonify({'success': False, 'error': f'File upload failed: {str(cloudinary_error)}'}), 500
        
        # Reset file pointer for size calculation
        file.seek(0)
        file_size = len(file.read())
        file.seek(0)
        
        # Create media record in VoxPro's Xano workspace with Cloudinary URL
        media_data = {
            'title': title,
            'description': description,
            'station': station,
            'category': category,
            'tags': tags,
            'submitted_by': submitted_by,
            'priority': priority,
            'notes': notes,
            'cloudinary_url': cloudinary_file_url,
            'file_url': cloudinary_file_url,
            'thumbnail_url': cloudinary_file_url,
            'file_type': file.content_type,
            'file_size': file_size,
            'created_at': datetime.now().isoformat(),
            'is_featured': False
        }
        
        # Save to VoxPro's Xano database (/voxpro endpoint)
        xano_headers = {
            'Authorization': f'Bearer {os.environ.get("XANO_API_KEY")}',
            'Content-Type': 'application/json'
        }
        media_create_url = f"{XANO_API_BASE}/user_submission"
        media_response = requests.post(media_create_url, json=media_data, headers=xano_headers, timeout=30)
        
        if media_response.status_code in [200, 201]:
            media_record = media_response.json()
            logger.info(f"Media record created successfully: {media_record.get('id')}")
            
            webflow_synced = False
            try:
                if WEBFLOW_API_KEY:
                    webflow_synced = sync_to_webflow(media_record, cloudinary_file_url)
            except Exception as webflow_error:
                logger.warning(f"Webflow sync failed: {webflow_error}")
            
            return jsonify({
                'success': True,
                'message': f'Upload successful! File: {file.filename}',
                'xano_id': media_record.get('id'),
                'file_size': media_data['file_size'],
                'cloudinary_url': cloudinary_file_url,
                'webflow_synced': webflow_synced,
                'redirect': '/'
            }), 200
        else:
            logger.error(f"Media record creation failed: {media_response.status_code} - {media_response.text}")
            return jsonify({'success': False, 'error': f'Database save failed: {media_response.status_code}'}), 500
    
    except Exception as upload_error:
        logger.error(f"Upload failed: {upload_error}")
        return jsonify({'success': False, 'error': f'Upload failed: {str(upload_error)}'}), 500

@app.route('/media')
def media_library():
    """Display media library with files from Xano database"""
    try:
        xano_headers = {
            'Authorization': f'Bearer {os.environ.get("XANO_API_KEY")}',
            'Content-Type': 'application/json'
        }
        media_list_url = f"{XANO_API_BASE}/user_submission"
        response = requests.get(media_list_url, headers=xano_headers, timeout=30)
        
        if response.status_code == 200:
            media_records = response.json()
            return render_template('media_list_enhanced.html', media_records=media_records)
        else:
            logger.error(f"Failed to fetch media records: {response.status_code}")
            return render_template('media_list_enhanced.html', media_records=[], error="Failed to load media library")
    except Exception as e:
        logger.error(f"Media library error: {e}")
        return render_template('media_list_enhanced.html', media_records=[], error=str(e))

@app.route('/test')
def system_status():
    """System status and health check"""
    try:
        xano_status = "OK"
        try:
            xano_headers = {
                'Authorization': f'Bearer {os.environ.get("XANO_API_KEY")}',
                'Content-Type': 'application/json'
            }
            test_url = f"{XANO_API_BASE}/user_submission"
            test_response = requests.get(test_url, headers=xano_headers, timeout=10)
            if test_response.status_code != 200:
                xano_status = f"Error: {test_response.status_code}"
        except Exception as e:
            xano_status = f"Connection failed: {str(e)}"
        
        cloudinary_status = "OK" if cloudinary.config().cloud_name else "Not configured"
        
        webflow_status = "OK" if WEBFLOW_API_KEY else "Not configured"
        
        status_data = {
            'xano_database': xano_status,
            'cloudinary_storage': cloudinary_status,
            'webflow_cms': webflow_status,
            'max_file_size': f"{MAX_FILE_SIZE / (1024*1024)}MB",
            'allowed_extensions': list(ALLOWED_EXTENSIONS),
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(status_data)
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'System check failed'}), 500

@app.route('/webflow/collections')
def webflow_collections():
    """Display Webflow collections and sync status"""
    if not WEBFLOW_API_KEY:
        return jsonify({'error': 'Webflow API key not configured'}), 400
    
    try:
        webflow_headers = {
            'Authorization': f'Bearer {WEBFLOW_API_KEY}',
            'Accept': 'application/json'
        }
        
        collections_url = f"https://api.webflow.com/sites/{WEBFLOW_SITE_ID}/collections"
        response = requests.get(collections_url, headers=webflow_headers, timeout=10)
        
        if response.status_code == 200:
            collections = response.json()
            return jsonify({
                'status': 'Connected to Webflow',
                'site_id': WEBFLOW_SITE_ID,
                'collections': collections,
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'error': f'Webflow API error: {response.status_code}',
                'message': response.text
            }), response.status_code
            
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'Webflow connection failed'}), 500

@app.route('/debug-info')
def debug_info():
    return jsonify({
        'xano_api_base': XANO_API_BASE,
        'max_file_size': f"{MAX_FILE_SIZE / (1024*1024)}MB",
        'allowed_extensions': list(ALLOWED_EXTENSIONS),
        'status': 'File Manager using same Xano workspace as VoxPro',
        'deployment_status': 'React frontend integrated'
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
