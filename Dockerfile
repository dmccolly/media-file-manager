FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
COPY server.js ./
EXPOSE $PORT
CMD ["node", "server.js"]
