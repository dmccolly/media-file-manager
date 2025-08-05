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
CORS(app) # Enable CORS for all routes

# Configure logging
logging.basicConfig(
      level=logging.INFO,
      format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
