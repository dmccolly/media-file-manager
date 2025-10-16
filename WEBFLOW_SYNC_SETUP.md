# Webflow/Xano/Cloudinary Sync Integration - Setup Guide

## Overview

Your media-file-manager repository already contains a fully implemented Webflow sync integration! The `netlify/functions/webflow-sync.js` serverless function is configured to keep your Webflow CMS "Media Assets" collection synchronized with assets stored in Xano and Cloudinary.

## Features

The integration provides three modes of operation:

1. **Scheduled Full Sync** - Runs automatically every hour (configurable) to sync all records from Xano to Webflow
2. **Event-Driven Create/Update** - Accepts webhook calls to immediately sync individual files when they're created or updated
3. **Event-Driven Delete** - Accepts webhook calls to delete files from both Xano and Webflow when removed

## Current Status

✅ **Already Implemented:**
- Webflow sync function at `netlify/functions/webflow-sync.js`
- Scheduled execution configured for hourly runs
- Support for webhook triggers from Xano/Cloudinary
- Automatic asset upload to Webflow Assets API (with size limit handling)
- Auto-publish to live site after creating CMS items
- Comprehensive error handling and logging

## Deployment Steps

### 1. Configure Netlify Environment Variables

You need to set these environment variables in your Netlify dashboard (Site Settings → Environment Variables):

| Variable | Value | Description |
|----------|-------|-------------|
| `WEBFLOW_API_TOKEN` | Your Webflow API token | Must have `cms:write` and `assets:write` scopes |
| `WEBFLOW_SITE_ID` | `688ed8debc05764047afa2a7` | Your Webflow site ID |
| `WEBFLOW_COLLECTION_ID` | `6891479d29ed1066b71124e9` | Your Media Assets collection ID |
| `XANO_API_KEY` | Your Xano API key | Bearer token for Xano authentication |
| `XANO_BASE_URL` | `https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX` | Your Xano API base URL |

**Important:** The function reads both `VITE_*` prefixed and non-prefixed versions, so you can set either or both.

### 2. Get Your Webflow API Token

1. Go to your Webflow workspace settings
2. Navigate to **Apps & Integrations** → **API Access**
3. Create a new API token with these scopes:
   - `cms:write` - To create/update CMS items
   - `assets:write` - To upload assets to media library
4. Copy the token and add it to Netlify environment variables

### 3. Deploy to Netlify

Once environment variables are set:

```bash
# Build the application
npm run build

# Deploy to Netlify (if not using CI/CD)
# Your GitHub Actions workflow should handle this automatically
git push origin main
```

After deployment, your function will be available at:
```
https://[your-site].netlify.app/.netlify/functions/webflow-sync
```

### 4. Find Your Function Endpoint

1. Go to Netlify dashboard → **Functions**
2. Click on **webflow-sync**
3. Copy the **Endpoint URL** (example: `https://eclectic-caramel-34e317.netlify.app/.netlify/functions/webflow-sync`)

You'll need this URL for configuring Xano and Cloudinary triggers.

## Configure Xano Webhooks

To enable real-time sync when files are created or deleted in Xano:

### Create "After Create" Trigger

1. Open your Xano workspace
2. Go to **Database** → `user_submission` table
3. Click **Triggers** (or **Automation**/Events tab)
4. Add a new trigger:
   - **Event Type:** After Create
   - **Action:** HTTP Request
   - **Method:** POST
   - **URL:** `https://[your-site].netlify.app/.netlify/functions/webflow-sync`
   - **Headers:** `Content-Type: application/json`
   - **Body:**
     ```json
     {
       "fileId": {{record.id}}
     }
     ```

### Create "After Delete" Trigger

1. In the same `user_submission` table triggers
2. Add another trigger:
   - **Event Type:** After Delete
   - **Action:** HTTP Request
   - **Method:** POST
   - **URL:** `https://[your-site].netlify.app/.netlify/functions/webflow-sync`
   - **Headers:** `Content-Type: application/json`
   - **Body:**
     ```json
     {
       "fileId": {{record.id}},
       "action": "delete"
     }
     ```

The `{{record.id}}` syntax in Xano will automatically insert the ID of the record that was created or deleted.

## Configure Cloudinary Webhooks (Optional)

If you upload or delete files directly in Cloudinary:

1. Go to **Cloudinary Dashboard** → **Settings**
2. Navigate to **Upload** (or **Notifications**)
3. Find **Notification URL** field
4. Enter: `https://[your-site].netlify.app/.netlify/functions/webflow-sync`
5. Save settings

**Note:** You may need to extend the function to parse Cloudinary's webhook payload format, which differs from Xano's. The current implementation expects `fileId` in the JSON body.

## Adjusting Sync Frequency

The function currently runs every hour. To change this:

1. Open `netlify/functions/webflow-sync.js`
2. Find the `exports.config` at the bottom:
   ```javascript
   exports.config = {
     schedule: '@hourly'  // Change this
   };
   ```
3. Available options:
   - `@hourly` - Every hour
   - `@daily` - Once per day
   - `@weekly` - Once per week
   - `*/15 * * * *` - Every 15 minutes (minimum supported by Netlify)
   - `0 */6 * * *` - Every 6 hours
4. Commit and redeploy

**Important:** Netlify does not support intervals shorter than 15 minutes for scheduled functions.

## Testing the Integration

### Test Scheduled Sync (Manual Trigger)

You can manually trigger a full sync by making a GET request:

```bash
curl https://[your-site].netlify.app/.netlify/functions/webflow-sync
```

This will sync all records from Xano to Webflow.

### Test Single File Upsert

```bash
curl -X POST https://[your-site].netlify.app/.netlify/functions/webflow-sync \
  -H "Content-Type: application/json" \
  -d '{"fileId": "123"}'
```

Replace `123` with an actual file ID from your Xano `user_submission` table.

### Test Delete

```bash
curl -X POST https://[your-site].netlify.app/.netlify/functions/webflow-sync \
  -H "Content-Type: application/json" \
  -d '{"fileId": "123", "action": "delete"}'
```

## Monitoring and Logs

### View Function Logs

1. **Netlify Dashboard:**
   - Go to **Functions** → **webflow-sync**
   - Click on a recent invocation to see logs

2. **Real-time logs via CLI:**
   ```bash
   netlify functions:log webflow-sync
   ```

### Common Log Messages

- `Webflow Sync: Starting` - Function invoked
- `Webflow Sync: Performing full sync from Xano` - Scheduled sync running
- `Webflow Sync: Syncing single file [ID]` - Event-driven single file sync
- `Webflow Sync: Deleting file [ID]` - Delete operation
- `Missing Webflow configuration` - Environment variables not set
- `Asset upload failed: [reason]` - File too large or upload error (CMS item still created)

## How It Works

### Data Flow

```
1. Scheduled Sync (Hourly):
   Netlify Scheduler → webflow-sync → Xano API → Webflow API
   
2. Create/Update Event:
   Xano Trigger → HTTP POST → webflow-sync → Webflow API
   
3. Delete Event:
   Xano Trigger → HTTP POST → webflow-sync → Delete from Xano & Webflow
```

### Asset Upload Strategy

The function attempts a two-phase upload:

1. **Upload to Webflow Assets** - Tries to upload the file from Cloudinary URL to Webflow's media library
   - ⚠️ Webflow has size limits: 4 MB for images, 10 MB for documents
   - If upload fails, the error is logged but sync continues

2. **Create CMS Item** - Always creates/updates the CMS collection item with:
   - File metadata (title, description, category, tags)
   - Cloudinary URL (as fallback if asset upload failed)
   - Thumbnail URL (optimized Cloudinary transformation)
   - Upload date, file type, file size

3. **Auto-Publish** - Automatically publishes the item to the live site

### Deduplication

The function checks for existing items before creating new ones using:
- Exact `media_url` match
- Exact `title`/`name` match

If found, it skips creation (returns `existed: true`).

## Troubleshooting

### Function Returns 500 Error

**Check environment variables are set in Netlify:**
```bash
netlify env:list
```

**Verify they match:**
- `WEBFLOW_API_TOKEN` or `VITE_WEBFLOW_API_TOKEN`
- `WEBFLOW_SITE_ID` or `VITE_WEBFLOW_SITE_ID`
- `WEBFLOW_COLLECTION_ID` or `VITE_WEBFLOW_COLLECTION_ID`
- `XANO_API_KEY`
- `XANO_BASE_URL`

### Files Not Appearing in Webflow

1. **Check Webflow collection field names** - The function expects these fields:
   - `name`, `slug`, `media-url`, `thumbnail`, `description`
   - `category`, `station`, `submitted-by`, `file-type`, `file-size`
   - `tags`, `upload-date`, `cloudinary-public-id`, `file-id`

2. **Verify field types in Webflow:**
   - `file-size` should be Number
   - `upload-date` should be Date
   - `tags` should be Plain Text
   - All URLs should be Link or Image fields

3. **Check function logs for API errors**

### Asset Upload Fails

This is expected for files larger than Webflow's limits. The CMS item is still created with the Cloudinary URL, so files remain accessible.

**Webflow Size Limits:**
- Images: 4 MB maximum
- Documents/PDFs: 10 MB maximum
- Videos: Not supported via Assets API (use direct Cloudinary URLs)

### Xano Trigger Not Firing

1. **Verify trigger is enabled** in Xano dashboard
2. **Check trigger URL** matches your deployed function endpoint
3. **Test manually** with curl to ensure function works
4. **Check Xano logs** for trigger execution history

## Next Steps

1. ✅ Set environment variables in Netlify
2. ✅ Deploy the application
3. ✅ Get function endpoint URL from Netlify dashboard
4. ✅ Configure Xano "After Create" trigger
5. ✅ Configure Xano "After Delete" trigger
6. ✅ Test by uploading a file in your media manager
7. ✅ Verify file appears in Webflow CMS
8. ✅ Test delete functionality
9. ⚙️ Adjust sync schedule if needed
10. ⚙️ Monitor logs for any errors

## Support

The function includes comprehensive error handling and logging. Check Netlify function logs for detailed information about each sync operation.

For Webflow API documentation:
- CMS API: https://developers.webflow.com/data/reference
- Assets API: https://developers.webflow.com/data/reference/assets

---

**Last Updated:** October 2025  
**Function Version:** webflow-sync.js (with scheduled sync support)
