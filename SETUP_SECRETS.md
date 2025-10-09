# GitHub Secrets Setup Guide

## Quick Setup (2 minutes)

Your GitHub Actions workflow needs two secrets to deploy to Netlify. Follow these steps:

### Step 1: Go to Repository Secrets
Visit: https://github.com/dmccolly/media-file-manager/settings/secrets/actions

### Step 2: Add NETLIFY_AUTH_TOKEN
1. Click **"New repository secret"**
2. Name: `NETLIFY_AUTH_TOKEN`
3. Value: `nfp_FU2ySvCmfbgXnfqvvJPiJYxwRxXvPYZA3e5c`
4. Click **"Add secret"**

### Step 3: Add NETLIFY_SITE_ID
1. Click **"New repository secret"** again
2. Name: `NETLIFY_SITE_ID`
3. Value: `df7875ab-b401-4220-93e4-7a08d1e0ab9a`
4. Click **"Add secret"**

### Step 4: Trigger Deployment
Once both secrets are added, the workflow will automatically deploy on the next push to main.

To trigger it immediately:
1. Go to: https://github.com/dmccolly/media-file-manager/actions
2. Click on "Deploy to Netlify" workflow
3. Click "Run workflow" → "Run workflow"

## What This Fixes

- ✅ Deploys both static files AND Netlify functions
- ✅ Fixes the "404 Backend API error" on uploads
- ✅ Enables the complete Cloudinary → Xano → Webflow pipeline

## Verification

After deployment completes, test the upload functionality at:
https://media-file-manager.netlify.app/

The functions should now be accessible at:
- https://media-file-manager.netlify.app/.netlify/functions/health
- https://media-file-manager.netlify.app/.netlify/functions/upload
- etc.