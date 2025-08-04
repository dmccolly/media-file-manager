#!/usr/bin/env python3
"""
Idaho Broadcasting Media Upload System - Enhanced Version with Webflow CMS Integration
Flask application for uploading and managing media files with Cloudinary, Supabase, and Webflow integration
"""

import os
import logging
import json
from datetime import datetime
from flask import Flask, request, render_template, jsonify, redirect, url_for
from flask_cors import CORS
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Cloudinary configuration
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# Webflow configuration
WEBFLOW_API_TOKEN = os.getenv('WEBFLOW_API_TOKEN')
WEBFLOW_SITE_ID = os.getenv('WEBFLOW_SITE_ID')
WEBFLOW_COLLECTION_ID = os.getenv('WEBFLOW_COLLECTION_ID')  # Media collection ID

# Initialize Supabase client
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
else:
    logger.warning("Supabase credentials not found")

class WebflowAPI:
    """Webflow API client for CMS operations"""
    
    def __init__(self, api_token, site_id):
        self.api_token = api_token
        self.site_id = site_id
        self.base_url = "https://api.webflow.com"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    
    def get_collections(self ):
        """Get all collections for the site"""
        try:
            url = f"{self.base_url}/sites/{self.site_id}/collections"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching Webflow collections: {e}")
            return None
    
    def get_collection_items(self, collection_id):
        """Get all items from a collection"""
        try:
            url = f"{self.base_url}/collections/{collection_id}/items"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching collection items: {e}")
            return None
    
    def create_collection_item(self, collection_id, item_data):
        """Create a new item in a collection"""
        try:
            url = f"{self.base_url}/collections/{collection_id}/items"
            payload = {
                "fields": item_data
            }
            response = requests.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error creating Webflow item: {e}")
            return None
    
    def update_collection_item(self, collection_id, item_id, item_data):
        """Update an existing item in a collection"""
        try:
            url = f"{self.base_url}/collections/{collection_id}/items/{item_id}"
            payload = {
                "fields": item_data
            }
            response = requests.put(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error updating Webflow item: {e}")
            return None
    
    def delete_collection_item(self, collection_id, item_id):
        """Delete an item from a collection"""
        try:
            url = f"{self.base_url}/collections/{collection_id}/items/{item_id}"
            response = requests.delete(url, headers=self.headers)
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Error deleting Webflow item: {e}")
            return False
    
    def publish_site(self, domain_names=None):
        """Publish the site to make changes live"""
        try:
            url = f"{self.base_url}/sites/{self.site_id}/publish"
            payload = {}
            if domain_names:
                payload["domains"] = domain_names
            
            response = requests.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error publishing Webflow site: {e}")
            return None

# Initialize Webflow API client
webflow_api = None
if WEBFLOW_API_TOKEN and WEBFLOW_SITE_ID:
    webflow_api = WebflowAPI(WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID)
    logger.info("Webflow API client initialized successfully")
else:
    logger.warning("Webflow credentials not found")

def sync_to_webflow(media_data):
    """Sync uploaded media to Webflow CMS"""
    if not webflow_api or not WEBFLOW_COLLECTION_ID:
        logger.warning("Webflow not configured, skipping sync")
        return None
    
    try:
        # Prepare Webflow item data
        webflow_item = {
            "name": media_data.get('title', 'Untitled Media'),
            "slug": media_data.get('title', 'untitled-media').lower().replace(' ', '-').replace('_', '-'),
            "media-url": media_data.get('cloudinary_url'),
            "description": media_data.get('description', ''),
            "category": media_data.get('category', ''),
            "station": media_data.get('station', ''),
            "submitted-by": media_data.get('submitted_by', ''),
            "tags": media_data.get('tags', ''),
            "file-type": media_data.get('file_type', ''),
            "file-size": media_data.get('file_size', 0),
            "upload-date": media_data.get('upload_date'),
            "cloudinary-public-id": media_data.get('cloudinary_public_id', ''),
            "_archived": False,
            "_draft": False
        }
        
        # Create item in Webflow
        result = webflow_api.create_collection_item(WEBFLOW_COLLECTION_ID, webflow_item)
        
        if result:
            logger.info(f"Successfully synced to Webflow: {result.get('_id')}")
            return result.get('_id')
        else:
            logger.error("Failed to sync to Webflow")
            return None
            
    except Exception as e:
        logger.error(f"Error syncing to Webflow: {e}")
        return None

@app.route('/')
def index():
    """Home page with upload form"""
    return render_template('index_enhanced.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload to Cloudinary, save metadata to Supabase, and sync to Webflow"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Get form data
        title = request.form.get('title', '')
        description = request.form.get('description', '')
        category = request.form.get('category', '')
        station = request.form.get('station', '')
        submitted_by = request.form.get('submitted_by', '')
        tags = request.form.get('tags', '')
        notes = request.form.get('notes', '')
        
        logger.info(f"Processing upload: {file.filename}")
        
        # Upload to Cloudinary
        cloudinary_url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/upload"
        
        files = {'file': (file.filename, file.stream, file.content_type )}
        data = {
            'api_key': CLOUDINARY_API_KEY,
            'timestamp': str(int(datetime.now().timestamp())),
            'folder': 'idaho_broadcasting'
        }
        
        # Generate signature for Cloudinary
        import hashlib
        import hmac
        
        params_to_sign = f"folder=idaho_broadcasting&timestamp={data['timestamp']}"
        signature = hmac.new(
            CLOUDINARY_API_SECRET.encode('utf-8'),
            params_to_sign.encode('utf-8'),
            hashlib.sha1
        ).hexdigest()
        
        data['signature'] = signature
        
        response = requests.post(cloudinary_url, files=files, data=data)
        
        if response.status_code != 200:
            logger.error(f"Cloudinary upload failed: {response.text}")
            return jsonify({'success': False, 'error': 'Upload to Cloudinary failed'}), 500
        
        cloudinary_response = response.json()
        logger.info(f"Cloudinary upload successful: {cloudinary_response.get('public_id')}")
        
        # Prepare media data
        media_data = {
            'title': title or file.filename,
            'description': description,
            'category': category,
            'station': station,
            'submitted_by': submitted_by,
            'tags': tags,
            'notes': notes,
            'original_filename': file.filename,
            'cloudinary_public_id': cloudinary_response.get('public_id'),
            'cloudinary_url': cloudinary_response.get('secure_url'),
            'file_type': cloudinary_response.get('resource_type'),
            'file_size': cloudinary_response.get('bytes'),
            'width': cloudinary_response.get('width'),
            'height': cloudinary_response.get('height'),
            'format': cloudinary_response.get('format'),
            'upload_date': datetime.now().isoformat()
        }
        
        # Save metadata to Supabase
        supabase_id = None
        if supabase:
            result = supabase.table('media_assets').insert(media_data).execute()
            if result.data:
                supabase_id = result.data[0].get('id')
                logger.info(f"Metadata saved to Supabase: {supabase_id}")
        
        # Sync to Webflow CMS
        webflow_id = sync_to_webflow(media_data)
        
        # Update Supabase with Webflow ID if successful
        if supabase_id and webflow_id:
            supabase.table('media_assets').update({'webflow_item_id': webflow_id}).eq('id', supabase_id).execute()
        
        response_data = {
            'success': True,
            'message': 'File uploaded and synced to Webflow successfully',
            'cloudinary_url': cloudinary_response.get('secure_url'),
            'public_id': cloudinary_response.get('public_id'),
            'supabase_id': supabase_id,
            'webflow_id': webflow_id,
            'webflow_synced': bool(webflow_id)
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/media')
def list_media():
    """List all media assets from Supabase"""
    try:
        if not supabase:
            return render_template('media_list_enhanced.html', media_items=[], error="Database connection not available")
        
        # Fetch all media from Supabase
        result = supabase.table('media_assets').select("*").order('upload_date', desc=True).execute()
        
        if result.data:
            logger.info(f"Retrieved {len(result.data)} media items")
            return render_template('media_list_enhanced.html', media_items=result.data)
        else:
            return render_template('media_list_enhanced.html', media_items=[], error=None)
            
    except Exception as e:
        logger.error(f"Error fetching media: {str(e)}")
        return render_template('media_list_enhanced.html', media_items=[], error=str(e))

@app.route('/webflow/collections')
def webflow_collections():
    """Get Webflow collections for configuration"""
    if not webflow_api:
        return jsonify({'error': 'Webflow not configured'}), 400
    
    collections = webflow_api.get_collections()
    return jsonify(collections)

@app.route('/webflow/sync/<int:media_id>')
def sync_media_to_webflow(media_id):
    """Manually sync a specific media item to Webflow"""
    try:
        if not supabase:
            return jsonify({'error': 'Database not available'}), 500
        
        # Get media item from Supabase
        result = supabase.table('media_assets').select("*").eq('id', media_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Media not found'}), 404
        
        media_data = result.data[0]
        
        # Sync to Webflow
        webflow_id = sync_to_webflow(media_data)
        
        if webflow_id:
            # Update Supabase with Webflow ID
            supabase.table('media_assets').update({'webflow_item_id': webflow_id}).eq('id', media_id).execute()
            
            return jsonify({
                'success': True,
                'message': 'Media synced to Webflow successfully',
                'webflow_id': webflow_id
            })
        else:
            return jsonify({'error': 'Failed to sync to Webflow'}), 500
            
    except Exception as e:
        logger.error(f"Sync error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/webflow/publish')
def publish_webflow_site():
    """Publish Webflow site to make changes live"""
    if not webflow_api:
        return jsonify({'error': 'Webflow not configured'}), 400
    
    result = webflow_api.publish_site()
    
    if result:
        return jsonify({
            'success': True,
            'message': 'Site published successfully',
            'result': result
        })
    else:
        return jsonify({'error': 'Failed to publish site'}), 500

@app.route('/api/media')
def api_media():
    """API endpoint to get all media as JSON"""
    try:
        if not supabase:
            return jsonify({'error': 'Database connection not available'}), 500
        
        result = supabase.table('media_assets').select("*").order('upload_date', desc=True).execute()
        return jsonify(result.data)
        
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/media/<int:media_id>')
def api_media_item(media_id):
    """API endpoint to get specific media item"""
    try:
        if not supabase:
            return jsonify({'error': 'Database connection not available'}), 500
        
        result = supabase.table('media_assets').select("*").eq('id', media_id).execute()
        
        if result.data:
            return jsonify(result.data[0])
        else:
            return jsonify({'error': 'Media not found'}), 404
            
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/delete/<int:media_id>', methods=['DELETE'])
def delete_media(media_id):
    """Delete media item from Supabase, Cloudinary, and Webflow"""
    try:
        if not supabase:
            return jsonify({'error': 'Database connection not available'}), 500
        
        # Get media item first
        result = supabase.table('media_assets').select("*").eq('id', media_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Media not found'}), 404
        
        media_item = result.data[0]
        
        # Delete from Webflow if synced
        if media_item.get('webflow_item_id') and webflow_api and WEBFLOW_COLLECTION_ID:
            webflow_api.delete_collection_item(WEBFLOW_COLLECTION_ID, media_item['webflow_item_id'])
            logger.info(f"Deleted from Webflow: {media_item['webflow_item_id']}")
        
        # Delete from Cloudinary
        if media_item.get('cloudinary_public_id'):
            cloudinary_delete_url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/image/destroy"
            
            import hashlib
            import hmac
            
            timestamp = str(int(datetime.now( ).timestamp()))
            params_to_sign = f"public_id={media_item['cloudinary_public_id']}&timestamp={timestamp}"
            signature = hmac.new(
                CLOUDINARY_API_SECRET.encode('utf-8'),
                params_to_sign.encode('utf-8'),
                hashlib.sha1
            ).hexdigest()
            
            delete_data = {
                'public_id': media_item['cloudinary_public_id'],
                'api_key': CLOUDINARY_API_KEY,
                'timestamp': timestamp,
                'signature': signature
            }
            
            requests.post(cloudinary_delete_url, data=delete_data)
            logger.info(f"Deleted from Cloudinary: {media_item['cloudinary_public_id']}")
        
        # Delete from Supabase
        supabase.table('media_assets').delete().eq('id', media_id).execute()
        logger.info(f"Deleted from Supabase: {media_id}")
        
        return jsonify({'success': True, 'message': 'Media deleted from all systems successfully'})
        
    except Exception as e:
        logger.error(f"Delete error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/test')
def test_config():
    """Test configuration and connections"""
    config_status = {
        'message': 'Flask app is working!',
        'timestamp': datetime.now().isoformat(),
        'cloudinary_configured': bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET),
        'cloudinary_cloud_name': CLOUDINARY_CLOUD_NAME,
        'supabase_configured': bool(SUPABASE_URL and SUPABASE_KEY),
        'supabase_url': SUPABASE_URL,
        'supabase_connection': 'Connected' if supabase else 'Not connected',
        'webflow_configured': bool(WEBFLOW_API_TOKEN and WEBFLOW_SITE_ID),
        'webflow_site_id': WEBFLOW_SITE_ID,
        'webflow_collection_id': WEBFLOW_COLLECTION_ID,
        'webflow_connection': 'Connected' if webflow_api else 'Not connected',
        'cors_enabled': True,
        'max_content_length': app.config.get('MAX_CONTENT_LENGTH')
    }
    
    # Test Supabase connection
    if supabase:
        try:
            result = supabase.table('media_assets').select("count", count="exact").execute()
            config_status['media_count'] = result.count
        except Exception as e:
            config_status['supabase_error'] = str(e)
    
    # Test Webflow connection
    if webflow_api:
        try:
            collections = webflow_api.get_collections()
            if collections:
                config_status['webflow_collections_count'] = len(collections)
                config_status['webflow_status'] = 'API connection successful'
            else:
                config_status['webflow_status'] = 'API connection failed'
        except Exception as e:
            config_status['webflow_error'] = str(e)
    
    return jsonify(config_status)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.2.0',
        'integrations': {
            'cloudinary': bool(CLOUDINARY_CLOUD_NAME),
            'supabase': bool(supabase),
            'webflow': bool(webflow_api)
        }
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
    # Check if required environment variables are set
    required_vars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'SUPABASE_URL', 'SUPABASE_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.warning(f"Missing environment variables: {', '.join(missing_vars)}")
        print("Please set these in your .env file or environment")
    else:
        logger.info("All required environment variables are set")
    
    # Check Webflow configuration
    if not WEBFLOW_API_TOKEN:
        logger.warning("WEBFLOW_API_TOKEN not set - Webflow integration disabled")
    if not WEBFLOW_SITE_ID:
        logger.warning("WEBFLOW_SITE_ID not set - Webflow integration disabled")
    if not WEBFLOW_COLLECTION_ID:
        logger.warning("WEBFLOW_COLLECTION_ID not set - using default collection")
    
    logger.info("Starting Idaho Broadcasting Media Upload Server with Webflow Integration...")
    
    # Use PORT environment variable for Heroku, fallback to 5001 for local development
    port = int(os.environ.get('PORT', 5001))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
