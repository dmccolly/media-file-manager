# Media Assets Sync Setup Guide

This guide will help you configure the automatic synchronization between Cloudinary, Xano, and Webflow.

## Overview

The sync system works as follows:
1. **Cloudinary** stores all media files
2. **Xano** acts as the database for file metadata
3. **Webflow** displays files in both:
   - CMS Collection (for structured content)
   - Media Assets (for direct file access)

## Prerequisites

Before setting up, you need:
1. A Webflow account with API access
2. A Xano account with an API key
3. A Cloudinary account (already configured)
4. Access to your Netlify deployment settings

## Step 1: Get Your Webflow API Token

1. Log in to your Webflow account
2. Go to **Account Settings** → **Integrations** → **API Access**
3. Click **Generate API Token**
4. Copy the token (you'll need it for environment variables)
5. Make sure the token has permissions for:
   - Read/Write Sites
   - Read/Write CMS
   - Read/Write Assets

## Step 2: Find Your Webflow IDs

### Site ID
1. Go to your Webflow project
2. Click on **Project Settings**
3. The Site ID is in the URL or under **General** settings
4. Default: `688ed8debc05764047afa2a7`

### Collection ID (Media Assets Collection)
1. In Webflow, go to **CMS** → **Collections**
2. Find your "Media Assets" collection
3. Click on it and check the URL
4. The Collection ID is in the URL after `/collections/`
5. Default: `6891479d29ed1066b71124e9`

## Step 3: Configure Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site: `eclectic-caramel-34e317`
3. Go to **Site Settings** → **Environment Variables**
4. Add the following variables:

```
XANO_API_KEY=your_xano_api_key
VITE_WEBFLOW_API_TOKEN=your_webflow_api_token
VITE_WEBFLOW_SITE_ID=688ed8debc05764047afa2a7
VITE_WEBFLOW_COLLECTION_ID=6891479d29ed1066b71124e9
VITE_CLOUDINARY_CLOUD_NAME=dzrw8nopf
VITE_CLOUDINARY_UPLOAD_PRESET=HIBF_MASTER
VITE_XANO_API_BASE_URL=https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX
```

5. Click **Save**
6. **Important**: Redeploy your site after adding environment variables

## Step 4: Verify Webflow Collection Fields

Make sure your Webflow CMS collection has these fields:

| Field Name | Field Type | Required |
|------------|-----------|----------|
| name | Plain Text | Yes |
| slug | Plain Text | Yes (auto-generated) |
| media-url | Link | Yes |
| description | Plain Text | No |
| category | Plain Text | No |
| file-type | Plain Text | No |
| file-size | Number | No |
| tags | Plain Text | No |
| author | Plain Text | No |
| upload-date | Date/Time | No |

## Step 5: Test the Sync

### Test Single File Upload
1. Upload a new file through the media manager UI
2. Check the browser console for sync messages
3. Verify the file appears in:
   - Xano database
   - Webflow CMS Collection
   - Webflow Media Assets

### Sync All Existing Files
To sync all existing files from Xano to Webflow:

```bash
# Using curl
curl -X POST https://eclectic-caramel-34e317.netlify.app/.netlify/functions/sync-all-to-webflow

# Or using the browser console
fetch('/.netlify/functions/sync-all-to-webflow', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

## Step 6: Monitor Sync Status

### Check Netlify Function Logs
1. Go to Netlify Dashboard → **Functions**
2. Click on `webflow-sync`
3. View the logs to see sync activity

### Common Log Messages
- ✅ `Webflow Sync: Successfully synced file` - Success
- ⚠️ `Webflow API token not configured` - Missing environment variable
- ❌ `Webflow Assets API error` - API issue (check token permissions)

## Troubleshooting

### Files Not Syncing to Webflow

**Problem**: Files upload to Cloudinary and Xano but don't appear in Webflow

**Solutions**:
1. Check that `VITE_WEBFLOW_API_TOKEN` is set in Netlify
2. Verify the API token has correct permissions
3. Check Netlify function logs for errors
4. Manually trigger sync: `POST /.netlify/functions/sync-all-to-webflow`

### "API Token Not Configured" Error

**Problem**: Console shows "Webflow API token not configured"

**Solutions**:
1. Add `VITE_WEBFLOW_API_TOKEN` to Netlify environment variables
2. Redeploy the site after adding the variable
3. Clear browser cache and reload

### Webflow API Rate Limits

**Problem**: Sync fails with 429 error

**Solutions**:
1. Webflow has rate limits (60 requests/minute)
2. For large syncs, the function will handle this automatically
3. Wait a few minutes and try again

### Collection Field Mismatch

**Problem**: Sync fails with "field not found" error

**Solutions**:
1. Verify all required fields exist in your Webflow collection
2. Check field names match exactly (case-sensitive)
3. Ensure field types are correct

## Advanced Configuration

### Customizing Sync Behavior

Edit `netlify/functions/webflow-sync.js` to customize:
- Field mappings
- Error handling
- Retry logic
- Batch size

### Adding Webhooks

To trigger sync automatically when files are added to Cloudinary:
1. Set up a Cloudinary webhook
2. Point it to: `https://your-site.netlify.app/.netlify/functions/webflow-sync`
3. Include the file ID in the webhook payload

## Support

If you encounter issues:
1. Check Netlify function logs
2. Verify all environment variables are set
3. Test API tokens using Webflow's API documentation
4. Review the console logs in your browser

## Next Steps

After setup is complete:
1. Test uploading a new file
2. Verify it appears in all three systems
3. Run a full sync of existing files
4. Monitor the sync logs for any issues