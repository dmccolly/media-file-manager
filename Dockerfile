FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Build the frontend
RUN npm run build

# Expose port
EXPOSE $PORT

# Start the app
CMD ["node", "server.js"]
