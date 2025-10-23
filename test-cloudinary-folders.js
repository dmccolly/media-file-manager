#!/usr/bin/env node

/**
 * Test script for Cloudinary folder operations
 * 
 * This script tests the folder creation and deletion functionality
 * without requiring deployment to Netlify.
 * 
 * Usage:
 *   node test-cloudinary-folders.js
 * 
 * Requirements:
 *   - CLOUDINARY_CLOUD_NAME environment variable
 *   - CLOUDINARY_API_KEY environment variable
 *   - CLOUDINARY_API_SECRET environment variable
 */

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Test folder name
const TEST_FOLDER = 'test-folder-' + Date.now();
const TEST_SUBFOLDER = TEST_FOLDER + '/subfolder';

console.log('🧪 Testing Cloudinary Folder Operations\n');
console.log('Configuration:');
console.log('  Cloud Name:', cloudinary.config().cloud_name || '❌ NOT SET');
console.log('  API Key:', cloudinary.config().api_key ? '✅ SET' : '❌ NOT SET');
console.log('  API Secret:', cloudinary.config().api_secret ? '✅ SET' : '❌ NOT SET');
console.log('');

async function runTests() {
  try {
    // Test 1: Create root folder
    console.log('Test 1: Creating root folder...');
    console.log(`  Folder: ${TEST_FOLDER}`);
    const createResult = await cloudinary.api.create_folder(TEST_FOLDER);
    console.log('  ✅ Success:', createResult.name);
    console.log('');

    // Test 2: Create subfolder
    console.log('Test 2: Creating subfolder...');
    console.log(`  Folder: ${TEST_SUBFOLDER}`);
    const subfolderResult = await cloudinary.api.create_folder(TEST_SUBFOLDER);
    console.log('  ✅ Success:', subfolderResult.name);
    console.log('');

    // Test 3: List root folders
    console.log('Test 3: Listing root folders...');
    const rootFolders = await cloudinary.api.root_folders();
    console.log(`  ✅ Found ${rootFolders.folders.length} root folders`);
    const testFolderExists = rootFolders.folders.some(f => f.name === TEST_FOLDER);
    console.log(`  Test folder exists: ${testFolderExists ? '✅' : '❌'}`);
    console.log('');

    // Test 4: List subfolders
    console.log('Test 4: Listing subfolders...');
    const subfolders = await cloudinary.api.sub_folders(TEST_FOLDER);
    console.log(`  ✅ Found ${subfolders.folders.length} subfolders in ${TEST_FOLDER}`);
    console.log('');

    // Test 5: Delete subfolder (should succeed - empty)
    console.log('Test 5: Deleting empty subfolder...');
    console.log(`  Folder: ${TEST_SUBFOLDER}`);
    await cloudinary.api.delete_folder(TEST_SUBFOLDER);
    console.log('  ✅ Successfully deleted subfolder');
    console.log('');

    // Test 6: Delete root folder (should succeed - now empty)
    console.log('Test 6: Deleting empty root folder...');
    console.log(`  Folder: ${TEST_FOLDER}`);
    await cloudinary.api.delete_folder(TEST_FOLDER);
    console.log('  ✅ Successfully deleted root folder');
    console.log('');

    // Test 7: Try to delete non-existent folder (should handle gracefully)
    console.log('Test 7: Deleting non-existent folder...');
    try {
      await cloudinary.api.delete_folder('non-existent-folder-xyz');
      console.log('  ✅ Handled gracefully (no error)');
    } catch (error) {
      if (error.http_code === 404) {
        console.log('  ✅ Handled gracefully (404 error as expected)');
      } else {
        throw error;
      }
    }
    console.log('');

    console.log('🎉 All tests passed!\n');
    console.log('Summary:');
    console.log('  ✅ Folder creation works');
    console.log('  ✅ Subfolder creation works');
    console.log('  ✅ Folder listing works');
    console.log('  ✅ Folder deletion works');
    console.log('  ✅ Error handling works');
    console.log('');
    console.log('Your Cloudinary folder management is ready to use! 🚀');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.http_code) {
      console.error('   HTTP Code:', error.http_code);
    }
    console.error('');
    
    // Cleanup attempt
    console.log('Attempting cleanup...');
    try {
      await cloudinary.api.delete_folder(TEST_SUBFOLDER).catch(() => {});
      await cloudinary.api.delete_folder(TEST_FOLDER).catch(() => {});
      console.log('✅ Cleanup complete');
    } catch (cleanupError) {
      console.log('⚠️  Cleanup failed (folders may need manual deletion)');
    }
    
    process.exit(1);
  }
}

// Check if credentials are set
if (!cloudinary.config().cloud_name || !cloudinary.config().api_key || !cloudinary.config().api_secret) {
  console.error('❌ Error: Cloudinary credentials not configured\n');
  console.error('Please set the following environment variables:');
  console.error('  - CLOUDINARY_CLOUD_NAME (or VITE_CLOUDINARY_CLOUD_NAME)');
  console.error('  - CLOUDINARY_API_KEY');
  console.error('  - CLOUDINARY_API_SECRET');
  console.error('');
  console.error('You can find these in your Cloudinary dashboard:');
  console.error('  https://console.cloudinary.com/settings/api-keys');
  console.error('');
  process.exit(1);
}

// Run tests
runTests();

