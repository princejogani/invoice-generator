# Use a Node image with Puppeteer dependencies installed
FROM ghcr.io/puppeteer/puppeteer:latest

USER root
WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Download Puppeteer's bundled Chromium
RUN npx puppeteer browsers install chrome

# Copy the rest of your code
COPY . .

# Expose the port your app runs on
EXPOSE 3001

# Command to run your app
CMD ["node", "server.js"]

