FROM node:22-slim

WORKDIR /app

# tsx (runtime for server.ts) and vite (build) are devDependencies, so keep them.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
