#!/usr/bin/env node

/**
 * Regenerate Video Thumbnails Script
 * 
 * This script updates all video thumbnails in Xano to use Cloudinary's
 * automatic best-frame selection (so_auto) instead of the first frame (so_0).
 * 
 * This will fix black thumbnail issues for videos.
 */

const XANO_API_BASE = 'https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX';
const XANO_API_KEY = process.env.VITE_XANO_API_KEY;

if (!XANO_API_KEY) {
  console.error('❌ Error: VITE_XANO_API_KEY environment variable is required');
  console.error('   Please set it in your .env file or export it:');
  console.error('   export VITE_XANO_API_KEY="your-api-key-here"');
  process.exit(1);
}

/**
 * Fetch all media assets from Xano
 */
async function fetchAllAssets() {
  console.log('📥 Fetching all media assets from Xano...');
  
  const response = await fetch(`${XANO_API_BASE}/user_submission`, {
    headers: {
      'Authorization': `Bearer ${XANO_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch assets: ${response.status} ${response.statusText}`);
  }

  const assets = await response.json();
  console.log(`✅ Found ${assets.length} total assets`);
  
  return assets;
}

/**
 * Update a single asset's thumbnail URL
 */
async function updateAssetThumbnail(assetId, newThumbnailUrl) {
  const response = await fetch(`${XANO_API_BASE}/user_submission/${assetId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${XANO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      thumbnail: newThumbnailUrl
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to update asset ${assetId}: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Convert a video thumbnail URL from so_0 to so_auto
 */
function convertToAutoThumbnail(thumbnailUrl) {
  if (!thumbnailUrl || typeof thumbnailUrl !== 'string') {
    return null;
  }

  // Check if this is a Cloudinary video thumbnail
  if (!thumbnailUrl.includes('cloudinary.com')) {
    return null;
  }

  // Replace so_0 with so_auto for automatic best-frame selection
  if (thumbnailUrl.includes('so_0')) {
    return thumbnailUrl.replace(/so_0/g, 'so_auto');
  }

  // If it's a video URL without so_ parameter, add so_auto
  if (thumbnailUrl.includes('/video/') && !thumbnailUrl.includes('so_')) {
    return thumbnailUrl.replace('/upload/', '/upload/so_auto,');
  }

  return null;
}

/**
 * Main function
 */
async function main() {
  console.log('🎬 Video Thumbnail Regeneration Script');
  console.log('=====================================\n');

  try {
    // Fetch all assets
    const assets = await fetchAllAssets();

    // Filter for video assets - check multiple possible field names
    const videoAssets = assets.filter(asset => {
      const mediaType = asset['media-type'] || asset.media_type || asset.type || '';
      const thumbnail = asset.thumbnail || asset.Thumbnail || '';
      const mediaUrl = asset.media_url || asset.URL || asset.url || '';
      
      return mediaType.toLowerCase() === 'video' || 
             thumbnail.includes('/video/') ||
             mediaUrl.includes('.mp4') ||
             mediaUrl.includes('.mov') ||
             mediaUrl.includes('.avi') ||
             mediaUrl.includes('.webm');
    });

    console.log(`🎥 Found ${videoAssets.length} video assets\n`);

    if (videoAssets.length === 0) {
      console.log('✅ No video assets found. Nothing to update.');
      return;
    }

    // Show first asset structure for debugging
    if (videoAssets.length > 0) {
      console.log('📋 Sample asset structure:');
      console.log('   Available fields:', Object.keys(videoAssets[0]).join(', '));
      console.log('');
    }

    // Process each video asset
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const asset of videoAssets) {
      const assetName = asset.title || asset.Title || asset.name || asset.id;
      const currentThumbnail = asset.thumbnail || asset.Thumbnail || '';

      console.log(`\n📹 Processing: ${assetName}`);
      if (currentThumbnail) {
        console.log(`   Current thumbnail: ${currentThumbnail.substring(0, 80)}...`);
      } else {
        console.log(`   ⚠️  No thumbnail found`);
      }

      // Convert thumbnail URL
      const newThumbnail = convertToAutoThumbnail(currentThumbnail);

      if (!newThumbnail || newThumbnail === currentThumbnail) {
        console.log(`   ⏭️  Skipped (no change needed or not a Cloudinary URL)`);
        skippedCount++;
        continue;
      }

      try {
        await updateAssetThumbnail(asset.id, newThumbnail);
        console.log(`   ✅ Updated successfully`);
        console.log(`   New thumbnail: ${newThumbnail.substring(0, 80)}...`);
        updatedCount++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`   ❌ Error updating: ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n\n📊 Summary');
    console.log('==========');
    console.log(`Total video assets: ${videoAssets.length}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    if (updatedCount > 0) {
      console.log('\n🎉 Thumbnail regeneration complete!');
      console.log('   The thumbnails will update automatically in Cloudinary.');
      console.log('   You may need to clear your browser cache to see the changes.');
      console.log('   Also, the Webflow sync may need to run to update the gallery.');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
main();
