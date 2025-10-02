# Media File Manager Deployment Guide

## Heroku Deployment

The application is configured for deployment to Heroku using Docker containers. The configuration is defined in the `heroku.yml` file:

```yaml
web:
  build:
    docker:
      web: Dockerfile
  run:
    web: node server.js
```

This configuration tells Heroku to:
1. Build the application using the provided Dockerfile
2. Run the application with the command `node server.js`

## Docker Configuration

The application uses a Dockerfile for containerization:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
COPY server.js ./
EXPOSE $PORT
CMD ["node", "server.js"]
```

This Dockerfile:
1. Uses the Node.js 18 Alpine image as base
2. Sets up the working directory
3. Copies and installs dependencies
4. Copies the built frontend files and server file
5. Exposes the port and runs the server

## Deployment Process

1. Ensure all changes are committed and pushed to the main branch
2. Heroku will automatically deploy the application when changes are pushed to the main branch
3. The deployment uses the Dockerfile to build the container image
4. The application will be available at your Heroku app URL

## Environment Variables

The application requires the following environment variables:
- `XANO_API_KEY`: API key for Xano backend service
- `PORT`: Port for the application to listen on (provided by Heroku)

These should be configured in your Heroku app settings.

## Troubleshooting

If deployment fails:
1. Check the Heroku build logs for specific error messages
2. Ensure the heroku.yml file is correctly formatted
3. Verify that all required files are included in the repository
4. Make sure the Dockerfile builds successfully locally