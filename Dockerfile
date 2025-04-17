# Use Node.js 20 based on Debian Bookworm for better security
FROM node:20.18.0-bookworm-slim

# Set working directory
WORKDIR /usr/src/app

# Install security updates, dumb-init for signal handling, and curl for healthcheck
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends dumb-init curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies based on NODE_ENV
RUN if [ "$NODE_ENV" = "development" ]; then npm ci; else npm ci --only=production; fi

# Copy the rest of the application code
COPY . .

# Create Uploads directory for category-service and product-service (if applicable)
RUN if [ -d "Uploads" ]; then chmod -R 777 Uploads; else mkdir -p Uploads && chmod -R 777 Uploads; fi

# Expose a dynamic port (overridden by docker-compose)
ARG PORT=3000
EXPOSE ${PORT}

# Optional health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:${PORT}/ || exit 1

# Use dumb-init as PID 1 with JSON syntax
ENTRYPOINT ["dumb-init", "--"]

# Start the application with JSON syntax
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"development\" ]; then npx nodemon index.js; else node index.js; fi"]