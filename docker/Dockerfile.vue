# Build stage
FROM node:18-alpine as build-stage

WORKDIR /app

# Copy package.json and package-lock.json files first for better caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY frontend/ .

# Set environment variables if needed (or these can be set at runtime)
ARG VUE_APP_API_URL
ENV VUE_APP_API_URL=${VUE_APP_API_URL}

# Build the app
RUN npm run build

# Production stage
FROM nginx:stable-alpine as production-stage

# Copy built artifacts from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy nginx configuration if needed
COPY docker/nginx/vue.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]