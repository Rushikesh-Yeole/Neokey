# Use lightweight Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the server code
COPY . .

# Expose Cloud Run default port
EXPOSE 8080

# Start backend
CMD ["node", "server.js"]