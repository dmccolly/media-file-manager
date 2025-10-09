#!/bin/bash

# Manual deployment script for Netlify
# This bypasses GitHub Actions and deploys directly

echo "Building project..."
npm run build

echo "Creating deployment package..."
cd dist
zip -r ../deploy.zip .
cd ..

echo "Deploying to Netlify..."
curl -X POST \
  -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  -H "Content-Type: application/zip" \
  --data-binary "@deploy.zip" \
  "https://api.netlify.com/api/v1/sites/eclectic-caramel-34e317/deploys"

echo "Deployment complete!"