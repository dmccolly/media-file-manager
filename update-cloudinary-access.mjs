import https from 'https';
import crypto from 'crypto';

const cloudName = 'dzrw8nopf';
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.Cloudinary_Secret_Key?.trim();

if (!apiKey || !apiSecret) {
  console.error('❌ Missing Cloudinary credentials (CLOUDINARY_API_KEY or Cloudinary_Secret_Key)');
  process.exit(1);
}

console.log('✅ Cloudinary credentials found');
console.log(`Cloud Name: ${cloudName}`);

async function cloudinaryRequest(method, path, body = null) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}${path}`;
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  
  const options = {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const text = await response.text();
  let data;
  
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse response:', text);
    throw new Error(`Invalid JSON response: ${text}`);
  }
  
  if (!response.ok) {
    throw new Error(`Cloudinary API error: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function listResources(resourceType = 'image', nextCursor = null) {
  console.log(`📋 Fetching ${resourceType} resources...`);
  
  let path = `/resources/${resourceType}?type=upload&max_results=500`;
  if (nextCursor) {
    path += `&next_cursor=${nextCursor}`;
  }
  
  return await cloudinaryRequest('GET', path);
}

async function searchForSpecificPDF(publicId) {
  console.log(`🔍 Searching for specific PDF: ${publicId}`);
  
  try {
    const response = await cloudinaryRequest('GET', `/resources/image/${publicId}`);
    return response;
  } catch (error) {
    console.log(`Not found as image resource, trying raw...`);
    try {
      const response = await cloudinaryRequest('GET', `/resources/raw/${publicId}`);
      return response;
    } catch (error2) {
      console.log(`Not found as raw resource either`);
      return null;
    }
  }
}

async function makeResourcePublic(publicId, resourceType = 'image') {
  console.log(`🔓 Making ${publicId} (${resourceType}) publicly accessible...`);
  
  // Try using the Upload API explicit endpoint with access_mode parameter
  const response = await cloudinaryRequest('POST', `/upload`, {
    public_id: publicId,
    type: 'upload',
    access_mode: 'public',
    resource_type: resourceType,
    invalidate: true
  });
  
  return response;
}

async function updateAllPDFsToPublic() {
  console.log('🚀 Starting Cloudinary PDF access update...\n');
  
  // First, search for the specific PDF we know exists
  const specificPDF = await searchForSpecificPDF('djyqkttnbw0di7m3lf1e');
  if (specificPDF) {
    console.log('✅ Found the specific PDF:', specificPDF.public_id);
    console.log('Resource type:', specificPDF.resource_type);
    console.log('Access mode:', specificPDF.access_mode || 'default');
  }
  
  // Search both image and raw resources for PDFs
  let allResources = [];
  
  console.log('\n📋 Searching image resources...');
  let nextCursor = null;
  do {
    const result = await listResources('image', nextCursor);
    allResources = allResources.concat(result.resources || []);
    nextCursor = result.next_cursor;
    console.log(`Found ${allResources.length} total image resources so far...`);
  } while (nextCursor);
  
  console.log('\n📋 Searching raw resources...');
  nextCursor = null;
  do {
    const result = await listResources('raw', nextCursor);
    allResources = allResources.concat(result.resources || []);
    nextCursor = result.next_cursor;
    console.log(`Found ${allResources.length} total resources so far...`);
  } while (nextCursor);
  
  console.log(`\n📦 Total resources found: ${allResources.length}`);
  
  const pdfs = allResources.filter(r => r.format === 'pdf');
  console.log(`📄 PDF files found: ${pdfs.length}\n`);
  
  if (pdfs.length === 0) {
    console.log('No PDFs found in any resource type');
    return;
  }
  
  console.log('PDFs to update:');
  pdfs.forEach(pdf => console.log(`  - ${pdf.public_id} (${pdf.resource_type})`));
  console.log('');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const pdf of pdfs) {
    try {
      await makeResourcePublic(pdf.public_id, pdf.resource_type);
      console.log(`✅ Successfully updated ${pdf.public_id}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to update ${pdf.public_id}: ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n📊 Update Summary:`);
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(`  📄 Total PDFs: ${pdfs.length}`);
  
  if (successCount > 0) {
    console.log('\n🎉 PDFs are now publicly accessible!');
    console.log('Try opening a PDF URL in your browser to verify.');
  }
}

updateAllPDFsToPublic().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
