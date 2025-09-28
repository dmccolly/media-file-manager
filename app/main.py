#!/usr/bin/env python3
import os
import logging
import json
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="build/static"), name="static")

templates = Jinja2Templates(directory="templates")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# USE THE SAME XANO WORKSPACE AS VOXPRO
XANO_API_BASE = 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX'

ALLOWED_EXTENSIONS = {
    'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi',
    'mp3', 'wav', 'pdf', 'doc', 'docx', 'mkv', 'wmv', 'flv', 'txt'
}

MAX_FILE_SIZE = 250 * 1024 * 1024  # 250MB

def allowed_file(filename ):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file_content):
    return len(file_content) <= MAX_FILE_SIZE

@app.get("/", response_class=HTMLResponse)
async def index():
    try:
        return FileResponse("build/index.html")
    except FileNotFoundError:
        try:
            with open("templates/upload.html", "r") as f:
                html_content = f.read()
            return HTMLResponse(content=html_content)
        except FileNotFoundError:
            return HTMLResponse(content="""
            <!DOCTYPE html>
            <html>
            <head><title>Media File Manager</title></head>
            <body>
                <h1>Media File Manager</h1>
                <p>FastAPI application is running successfully!</p>
                <p>Debug info: <a href="/debug-info">/debug-info</a></p>
            </body>
            </html>
            """)

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    title: str = Form(""),
    description: str = Form(""),
    station: str = Form(""),
    category: str = Form(""),
    tags: str = Form(""),
    submitted_by: str = Form(""),
    priority: str = Form(""),
    notes: str = Form(""),
    cloudinary_url: str = Form(""),
    thumbnail_url: str = Form(""),
    public_id: str = Form("")
):
    try:
        logger.info("File upload started")
        
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file selected")
        
        if not allowed_file(file.filename):
            raise HTTPException(status_code=400, detail="File type not allowed")
        
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds 250MB limit")
        
        # Create media record with Cloudinary data in VoxPro's Xano workspace
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
            'file_size': len(file_content),
            'database_url': cloudinary_url or f"https://x8ki-letl-twmt.n7.xano.io/vault/{file.filename}",
            'thumbnail_url': thumbnail_url or '',
            'public_id': public_id or '',
            'created_at': int(datetime.now().timestamp() * 1000),
            'is_featured': False
        }
        
        # Save to VoxPro's Xano database (/voxpro endpoint)
        media_create_url = f"{XANO_API_BASE}/voxpro"
        media_response = requests.post(media_create_url, json=media_data, timeout=30)
        
        if media_response.status_code in [200, 201]:
            media_record = media_response.json()
            logger.info(f"Media record created successfully: {media_record.get('id')}")
            
            return JSONResponse({
                'success': True,
                'message': f'Upload successful! File: {file.filename}',
                'xano_id': media_record.get('id'),
                'file_size': media_data['file_size'],
                'cloudinary_url': cloudinary_url,
                'thumbnail_url': thumbnail_url,
                'redirect': '/'
            })
        else:
            logger.error(f"Media record creation failed: {media_response.status_code} - {media_response.text}")
            raise HTTPException(status_code=500, detail=f'Database save failed: {media_response.status_code}')
    
    except HTTPException:
        raise
    except Exception as upload_error:
        logger.error(f"Upload failed: {upload_error}")
        raise HTTPException(status_code=500, detail=f'Upload failed: {str(upload_error)}')

@app.get("/api/files")
async def get_all_files():
    """Fetch all files from XANO voxpro table"""
    try:
        logger.info("Fetching all files from XANO voxpro table")
        
        fetch_url = f"{XANO_API_BASE}/voxpro"
        response = requests.get(fetch_url, timeout=30)
        
        if response.status_code == 200:
            files_data = response.json()
            logger.info(f"Successfully fetched {len(files_data) if isinstance(files_data, list) else 'unknown'} files")
            return JSONResponse({'files': files_data})
        else:
            logger.error(f"Failed to fetch files from XANO: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f'Failed to fetch files: {response.status_code}')
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching files: {e}")
        raise HTTPException(status_code=500, detail=f'Error fetching files: {str(e)}')

@app.get("/debug-info")
async def debug_info():
    return JSONResponse({
        'xano_api_base': XANO_API_BASE,
        'max_file_size': f"{MAX_FILE_SIZE / (1024*1024)}MB",
        'allowed_extensions': list(ALLOWED_EXTENSIONS),
        'status': 'File Manager using same Xano workspace as VoxPro'
    })

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('PORT', 8000))
    uvicorn.run(app, host='0.0.0.0', port=port)
