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
app.config['TEMPLATES_AUTO_RELOAD'] = True  # Force template reload on each request
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

    def get_collections(self):
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
            logger.error(f"Error fetching Webflow collection items: {e}")
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

    def publish_site(self):
              """Publish the site to make changes live"""
              try:
                            url = f"{self.base_url}/sites/{self.site_id}/publish"
                            payload = {"domains": ["all"]}
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
      return render_template('index.html')

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

        files = {'file': (file.filename, file.stream, file.content_type)}
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

@app.route('/webflow/collections')
def webflow_collections():
      """Get Webflow collections for configuration"""
      if not webflow_api:
                return jsonify({'error': 'Webflow not configured'}), 400

      collections = webflow_api.get_collections()
      return jsonify(collections)

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
                            'result': re
