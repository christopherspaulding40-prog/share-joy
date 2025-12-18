FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy rest of app
COPY . .

# Build app
RUN npm run build

EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Run migrations and start app
CMD ["sh", "-c", "npm run setup && npm start"]
