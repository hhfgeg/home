# ============================================================
# Stage 1: Build
# ============================================================
FROM node:20-alpine AS builder

# 构建时可通过 --build-arg 覆盖 base 路径
ARG APP_BASE_URL=/app/home
ENV APP_BASE_URL=${APP_BASE_URL}

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

# 复制构建产物 + package.json（确保 ESM 模块识别）+ 服务端
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY server.mjs .
COPY --from=builder /app/src/spaceSeed.mjs ./src/spaceSeed.mjs
COPY --from=builder /app/src/cryptoUtils.mjs ./src/cryptoUtils.mjs

# 运行时数据目录（启动时由 server.mjs 按需初始化）
RUN mkdir -p /app/data

EXPOSE 8080

ENV PORT=8080
ENV APP_BASE_URL=/app/home

CMD ["node", "server.mjs"]
