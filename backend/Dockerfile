FROM node:20-alpine as builder

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /usr/src/app
COPY --from=builder /usr/src/app .

USER node

ENV NODE_ENV=production
EXPOSE 8081

CMD [ "node", "src/server.js" ]