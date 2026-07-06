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

# 复制构建产物 + package.json（确保 ESM 模块识别）+ 服务端 + 数据
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY server.mjs .

# 复制数据目录（运行时 server.mjs 提供 API 读取）
COPY --from=builder /app/data ./data

EXPOSE 80

ENV PORT=80

CMD ["node", "server.mjs"]
