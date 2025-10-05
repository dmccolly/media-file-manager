# Media File Manager Deployment Guide

## Netlify Deployment

The application is configured for deployment to Netlify with automatic CI/CD integration. The deployment process is handled through GitHub Actions.

### GitHub Actions Workflow

The deployment workflow is defined in `.github/workflows/netlify-deploy.yml`:

```yaml
name: Deploy to Netlify - eclectic-caramel-34e317

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build project
      run: npm run build
    
    - name: Deploy to Netlify Site
      uses: nwtgck/actions-netlify@v3.0
      with:
        publish-dir: './dist'
        production-branch: main
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy to Netlify"
        enable-pull-request-comment: true
        enable-commit-comment: true
        overwrites-pull-request-comment: true
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: 'eclectic-caramel-34e317'
```

### Build Configuration

The application uses Vite for building the frontend:

```javascript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

### Deployment Process

1. **Automatic Deployment**: When changes are pushed to the main branch, GitHub Actions automatically builds and deploys to Netlify
2. **Manual Deployment**: You can trigger deployment manually through the GitHub Actions interface
3. **Preview Deployments**: Pull requests automatically get preview deployments

### Environment Variables

The application requires the following environment variables:

- `VITE_API_URL`: API endpoint URL (for production deployments)
- `VITE_XANO_API_KEY`: API key for Xano backend service
- `NETLIFY_AUTH_TOKEN`: Netlify authentication token (in GitHub Secrets)
- `NETLIFY_SITE_ID`: Target Netlify site ID

### Netlify Configuration

The `netlify.toml` file configures Netlify-specific settings:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Local Development

For local development:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Troubleshooting

If deployment fails:
1. Check the GitHub Actions logs for build errors
2. Ensure all environment variables are properly configured
3. Verify that the build process completes successfully locally
4. Check Netlify deployment logs for runtime errors
5. Ensure all required dependencies are included in package.json