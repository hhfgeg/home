# ============================================================
# Stage 1: Build
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# 利用 Docker 缓存：先安装依赖
COPY package.json package-lock.json ./
RUN npm ci --production=false

# 复制源码并构建
COPY . .
RUN npm run build

# ============================================================
# Stage 2: Production (Node.js runtime)
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

# 复制构建产物 + 服务端 + data 目录
COPY --from=builder /app/dist ./dist
COPY server.js .
COPY data ./data

EXPOSE 80

ENV PORT=80

CMD ["node", "server.js"]
