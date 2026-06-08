FROM node:22-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM node:22-alpine
RUN apk add --no-cache tini
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/uploads ./uploads
COPY --from=builder /app/package.json ./

RUN mkdir -p /app/data && chown appuser:appgroup /app/data

EXPOSE 3001

USER appuser
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
