#!/usr/bin/env node

/**
 * Manual Netlify Deployment Script
 * Run this after setting up your Netlify site
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Netlify deployment process...\n');

// Check if build exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
    console.log('❌ Build not found. Running npm run build first...');
    execSync('npm run build', { stdio: 'inherit' });
}

console.log('✅ Build found. Ready for deployment!\n');
console.log('📋 Next steps:');
console.log('1. Go to https://app.netlify.com and create a new site from Git');
console.log('2. Connect your GitHub repository: dmccolly/media-file-manager');
console.log('3. The build settings should be auto-detected (npm run build, dist folder)');
console.log('4. Once deployed, your site will have a URL like: https://amazing-name.netlify.app');
console.log('5. In your site settings, find the Site ID (API ID) for future automated deployments\n');

console.log('🎯 After setup, you can:');
console.log('- Set custom domain');
console.log('- Enable automatic deployments from Git');
console.log('- Add environment variables if needed');
console.log('- Monitor deployment logs\n');

console.log('✨ The folder management features are ready and waiting to be deployed!');