# Docker 部署总览文档

> 本文档是项目的 Docker 部署操作手册，可直接用于生产环境部署。
> 整体架构请参阅《项目架构文档》，各 FastAPI 服务详情请参阅《FastAPI 文档》。



------



## 一、概述

本项目采用 Docker Compose 进行容器编排，所有服务运行在隔离的 Docker 网络中。

**核心部署原则：**

| 原则 | 说明 |
| ---- | ---- |
| 唯一对外入口 | Nginx 是唯一暴露端口到宿主机的服务 |
| 双网络隔离 | frontend 网络（Nginx ↔ SpringBoot）与 backend 网络（SpringBoot ↔ 后端服务）隔离 |
| FastAPI 不可公网访问 | 所有 AI 计算服务仅通过 backend 网络内部通信 |
| 数据持久化 | MySQL、Redis、MinIO、AI 模型文件通过数据卷持久化 |
| 敏感信息外置 | 密码、密钥等敏感配置通过 `.env` 文件管理，不硬编码 |



------



## 二、完整容器清单



| 容器名 | 镜像 | 内部端口 | 对外端口 | CPU 限制 | 内存限制 | GPU | 所属网络 |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| doc-nginx | nginx:alpine | 80, 443 | 80, 443 | 0.5 核 | 256M | 无 | frontend |
| doc-springboot | 若依 Office 自建镜像 (JDK 21) | 8080 | 无 | 1 核 | 1G | 无 | frontend + backend |
| doc-fastapi-vision | 自建 (python:3.11-slim) | 8001 | 无 | 2 核 | 4G | 需要 | backend |
| doc-fastapi-language | 自建 (python:3.11-slim) | 8002 | 无 | 2 核 | 4G | 需要 | backend |
| doc-fastapi-document | 自建 (python:3.11-slim) | 8003 | 无 | 1 核 | 2G | 可选 | backend |
| doc-fastapi-reasoning | 自建 (python:3.11-slim) | 8004 | 无 | 1 核 | 1G | 无 | backend |
| doc-mysql | mysql:8.0 | 3306 | 无 | 1 核 | 1G | 无 | backend |
| doc-redis | redis:7-alpine | 6379 | 无 | 0.25 核 | 256M | 无 | backend |
| doc-minio | minio/minio | 9000, 9001 | 9001 (可选) | 0.5 核 | 512M | 无 | backend |



**端口暴露规则：**

| 端口 | 用途 | 对外暴露 | 说明 |
| ---- | ---- | ---- | ---- |
| 80/443 | Nginx 入口 | 必须 | 唯一外部访问点 |
| 9001 | MinIO 管理控制台 | 可选 | 仅管理员使用，生产环境建议关闭或加 IP 白名单 |
| 3306/6379/9000 | MySQL/Redis/MinIO API | 禁止 | 仅 backend 网络内部访问 |
| 8001-8004 | FastAPI 服务 | 禁止 | 仅 backend 网络内部访问 |
| 8080 | SpringBoot | 禁止 | 仅内部访问 |



------



## 三、双网络隔离设计



### 3.1 网络拓扑



```
┌─────────────────────────────────────────────────────┐
│                    frontend 网络                      │
│                                                       │
│   ┌──────────┐          ┌──────────────────┐         │
│   │ doc-nginx │ ──────→ │ doc-springboot   │         │
│   │  :80:443  │          │    :8080          │         │
│   └──────────┘          └────────┬─────────┘         │
│                                   │                    │
└───────────────────────────────────┼────────────────────┘
                                    │
                          SpringBoot 是
                          网络间的唯一桥梁
                                    │
┌───────────────────────────────────┼────────────────────┐
│                    backend 网络    │                    │
│                                   │                    │
│   ┌──────────────┐  ┌─────────────▼──────────────┐    │
│   │ doc-fastapi- │  │ doc-fastapi-               │    │
│   │   vision     │  │   language                 │    │
│   │   :8001      │  │   :8002                    │    │
│   └──────────────┘  └────────────────────────────┘    │
│                                                       │
│   ┌──────────────┐  ┌──────────────┐                  │
│   │ doc-fastapi- │  │ doc-fastapi- │                  │
│   │   document   │  │   reasoning  │                  │
│   │   :8003      │  │   :8004      │                  │
│   └──────────────┘  └──────────────┘                  │
│                                                       │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│   │ doc-mysql│  │ doc-redis│  │ doc-minio│           │
│   │  :3306   │  │  :6379   │  │  :9000   │           │
│   └──────────┘  └──────────┘  └──────────┘           │
│                                                       │
└───────────────────────────────────────────────────────┘
```



### 3.2 安全说明

| 安全措施 | 说明 |
| ---- | ---- |
| Nginx 是唯一入口 | 外部流量只能通过 Nginx 的 80/443 端口进入 |
| FastAPI 不可外部访问 | 所有 AI 服务不在 frontend 网络，外部无法直接访问 |
| SpringBoot 是唯一桥梁 | 跨网络通信必须经过 SpringBoot，可在此层做鉴权和限流 |
| 数据库端口不暴露 | MySQL/Redis 端口不映射到宿主机 |
| MinIO 控制台可选关闭 | 生产环境建议将 MinIO 9001 端口也关闭，通过 Nginx 反向代理访问 |



------



## 四、完整 docker-compose.yml



```yaml
version: '3.8'

# ============================================================
#  AI 文档处理平台 — Docker Compose 编排
#  整体架构请参阅《项目架构文档》
#  FastAPI 服务详情请参阅《FastAPI 文档》
# ============================================================

services:

  # ==================== 反向代理 ====================

  doc-nginx:
    image: nginx:alpine
    container_name: doc-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./frontend/mobile/dist:/usr/share/nginx/html/mobile:ro
      - ./frontend/admin/dist:/usr/share/nginx/html/admin:ro
    networks:
      - frontend
    depends_on:
      doc-springboot:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:80/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  # ==================== 业务中枢 ====================

  doc-springboot:
    build:
      context: ./backend-java
      dockerfile: Dockerfile
    container_name: doc-springboot
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - MYSQL_HOST=doc-mysql
      - MYSQL_PORT=3306
      - MYSQL_DATABASE=${MYSQL_DATABASE:-ai_platform}
      - MYSQL_USERNAME=root
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - REDIS_HOST=doc-redis
      - REDIS_PORT=6379
      - MINIO_ENDPOINT=http://doc-minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - VISION_SERVICE_URL=http://doc-fastapi-vision:8001
      - LANGUAGE_SERVICE_URL=http://doc-fastapi-language:8002
      - DOCUMENT_SERVICE_URL=http://doc-fastapi-document:8003
      - REASONING_SERVICE_URL=http://doc-fastapi-reasoning:8004
      - LLM_API_KEY=${LLM_API_KEY}
    networks:
      - frontend
      - backend
    depends_on:
      doc-mysql:
        condition: service_healthy
      doc-redis:
        condition: service_healthy
      doc-minio:
        condition: service_healthy
      doc-fastapi-vision:
        condition: service_healthy
      doc-fastapi-language:
        condition: service_healthy
      doc-fastapi-document:
        condition: service_healthy
      doc-fastapi-reasoning:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  # ==================== AI 计算层 ====================

  doc-fastapi-vision:
    build:
      context: ./services/vision-service
      dockerfile: Dockerfile
    container_name: doc-fastapi-vision
    ports:
      - "8001"  # 仅暴露到 backend 网络，不映射到宿主机
    networks:
      - backend
    volumes:
      - model-cache:/root/.cache
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s

  doc-fastapi-language:
    build:
      context: ./services/language-service
      dockerfile: Dockerfile
    container_name: doc-fastapi-language
    ports:
      - "8002"
    networks:
      - backend
    volumes:
      - model-cache:/root/.cache
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8002/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s

  doc-fastapi-document:
    build:
      context: ./services/document-service
      dockerfile: Dockerfile
    container_name: doc-fastapi-document
    ports:
      - "8003"
    networks:
      - backend
    volumes:
      - model-cache:/root/.cache
      - chroma-data:/app/chroma_data
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8003/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 90s

  doc-fastapi-reasoning:
    build:
      context: ./services/reasoning-service
      dockerfile: Dockerfile
    container_name: doc-fastapi-reasoning
    ports:
      - "8004"
    networks:
      - backend
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8004/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

  # ==================== 基础设施 ====================

  doc-mysql:
    image: mysql:8.0
    container_name: doc-mysql
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_PASSWORD}
      - MYSQL_DATABASE=${MYSQL_DATABASE:-ai_platform}
    ports:
      - "3306"
    networks:
      - backend
    volumes:
      - mysql-data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d:ro
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    restart: unless-stopped
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

  doc-redis:
    image: redis:7-alpine
    container_name: doc-redis
    ports:
      - "6379"
    networks:
      - backend
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 256M
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  doc-minio:
    image: minio/minio
    container_name: doc-minio
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY:-minioadmin}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY:-minioadmin}
    ports:
      - "9000"
      - "${MINIO_CONSOLE_PORT:-9001}:9001"  # 管理控制台，生产可注释掉
    networks:
      - backend
    volumes:
      - minio-data:/data
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 10s

# ==================== 网络 ====================

networks:
  frontend:
    name: doc-frontend
    driver: bridge
  backend:
    name: doc-backend
    driver: bridge

# ==================== 数据卷 ====================

volumes:
  mysql-data:
    name: doc-mysql-data
  redis-data:
    name: doc-redis-data
  minio-data:
    name: doc-minio-data
  model-cache:
    name: doc-model-cache
  chroma-data:
    name: doc-chroma-data
```



------



## 五、数据卷配置与持久化策略



### 5.1 卷清单



| 卷名 | 挂载容器 | 建议宿主机路径 | 用途 | 备份优先级 |
| ---- | ---- | ---- | ---- | ---- |
| mysql-data | doc-mysql | /data/mysql | 用户数据、任务记录、对话历史 | ⭐⭐⭐ 最高 |
| redis-data | doc-redis | /data/redis | 会话缓存、任务队列 | ⭐⭐ 中 |
| minio-data | doc-minio | /data/minio | 用户上传文件、转换结果文件 | ⭐⭐⭐ 最高 |
| model-cache | vision / language / document | /data/models | AI 模型文件缓存 | ⭐ 低 |
| chroma-data | doc-fastapi-document | /data/chroma | RAG 向量数据库 | ⭐⭐ 中 |



### 5.2 持久化策略

| 策略 | 说明 |
| ---- | ---- |
| Named Volume（默认） | Docker 管理的命名卷，适合开发环境 |
| Bind Mount（生产推荐） | 映射到宿主机具体路径，方便备份和迁移 |
| 模型缓存不备份 | model-cache 卷无需备份，删除后重新下载即可 |



**生产环境 bind mount 配置示例：**

```yaml
volumes:
  mysql-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/mysql
  minio-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/minio
```



------



## 六、环境变量完整列表



### 6.1 .env 文件模板



```bash
# ========== 数据库 ==========
MYSQL_PASSWORD=your-strong-password-here
MYSQL_DATABASE=ai_platform

# ========== MinIO 对象存储 ==========
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=your-minio-secret-key
# MinIO 控制台端口（生产环境建议注释掉此行以关闭外部访问）
MINIO_CONSOLE_PORT=9001

# ========== JWT 认证 ==========
JWT_SECRET=your-jwt-secret-key-at-least-32-chars

# ========== FastAPI 服务地址（SpringBoot 使用）==========
VISION_SERVICE_URL=http://doc-fastapi-vision:8001
LANGUAGE_SERVICE_URL=http://doc-fastapi-language:8002
DOCUMENT_SERVICE_URL=http://doc-fastapi-document:8003
REASONING_SERVICE_URL=http://doc-fastapi-reasoning:8004

# ========== LLM 供应商 ==========
LLM_API_KEY=your-llm-api-key
```



### 6.2 变量说明



| 变量 | 必填 | 默认值 | 说明 |
| ---- | ---- | ---- | ---- |
| MYSQL_PASSWORD | ✅ 是 | — | MySQL root 密码，生产环境必须修改 |
| MYSQL_DATABASE | 否 | ai_platform | 数据库名 |
| MINIO_ACCESS_KEY | ✅ 是 | minioadmin | MinIO 访问密钥 |
| MINIO_SECRET_KEY | ✅ 是 | — | MinIO 密钥，生产环境必须修改 |
| MINIO_CONSOLE_PORT | 否 | 9001 | MinIO 管理控制台端口，注释掉则不暴露 |
| JWT_SECRET | ✅ 是 | — | JWT 签名密钥，至少 32 字符随机字符串 |
| VISION_SERVICE_URL | 否 | http://doc-fastapi-vision:8001 | 视觉服务地址 |
| LANGUAGE_SERVICE_URL | 否 | http://doc-fastapi-language:8002 | 语言服务地址 |
| DOCUMENT_SERVICE_URL | 否 | http://doc-fastapi-document:8003 | 文档服务地址 |
| REASONING_SERVICE_URL | 否 | http://doc-fastapi-reasoning:8004 | 推理服务地址 |
| LLM_API_KEY | 否 | — | LLM 供应商 API Key（使用本地 Ollama 则不需要） |



------



## 七、健康检查配置



| 容器 | 检查类型 | 检查命令/路径 | 间隔 | 超时 | 重试 | 启动等待 |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| doc-nginx | HTTP GET | /health | 30s | 5s | 3 | — |
| doc-springboot | HTTP GET | /actuator/health | 30s | 10s | 5 | 60s |
| doc-fastapi-vision | HTTP GET | /health | 30s | 10s | 5 | 120s |
| doc-fastapi-language | HTTP GET | /health | 30s | 10s | 5 | 120s |
| doc-fastapi-document | HTTP GET | /health | 30s | 10s | 5 | 90s |
| doc-fastapi-reasoning | HTTP GET | /health | 30s | 10s | 5 | 30s |
| doc-mysql | TCP + 命令 | mysqladmin ping | 10s | 5s | 10 | 30s |
| doc-redis | TCP + 命令 | redis-cli ping | 10s | 5s | 5 | — |
| doc-minio | HTTP GET | /minio/health/live | 15s | 5s | 5 | 10s |



> **注意：** 每个 FastAPI 服务必须实现 `GET /health` 端点，返回 `{"status": "ok"}`。
> vision-service 和 language-service 的 `start_period` 设为 120s，因为需要预加载 AI 模型。



------



## 八、容器启动顺序与依赖



### 8.1 启动链



```
第一阶段：基础设施
  doc-mysql ──┐
  doc-redis ──┤ 并行启动
  doc-minio ──┘
      │
      ▼
第二阶段：AI 计算服务（等待基础设施就绪后并行启动）
  doc-fastapi-vision ──┐
  doc-fastapi-language─┤ 并行启动
  doc-fastapi-document─┤
  doc-fastapi-reasoning┘
      │
      ▼
第三阶段：业务中枢
  doc-springboot（等待所有 AI 服务就绪）
      │
      ▼
第四阶段：反向代理
  doc-nginx（等待 SpringBoot 就绪）
```



### 8.2 启动命令



```bash
# 1. 创建 .env 文件并填写密码
cp .env.example .env
vim .env

# 2. 构建所有镜像
docker compose build

# 3. 启动所有服务（按依赖顺序）
docker compose up -d

# 4. 查看启动状态
docker compose ps

# 5. 查看日志
docker compose logs -f doc-springboot
```



### 8.3 停止与重启



```bash
# 停止所有服务
docker compose down

# 停止并删除数据卷（危险操作）
docker compose down -v

# 重启单个服务
docker compose restart doc-fastapi-vision

# 重新构建并启动单个服务
docker compose up -d --build doc-fastapi-vision
```



------



## 九、资源限制建议



### 9.1 开发测试环境（4 核 / 8G 总内存）

| 容器 | CPU | 内存 | 说明 |
| ---- | ---- | ---- | ---- |
| doc-nginx | 0.25 核 | 128M | 轻量代理 |
| doc-springboot | 0.5 核 | 512M | JVM 调小堆内存 |
| doc-fastapi-vision | 1 核 | 2G | 仅加载 rembg |
| doc-fastapi-language | 0.5 核 | 1G | 仅加载 ChatTTS |
| doc-fastapi-document | 0.5 核 | 1G | 不含 LLM |
| doc-fastapi-reasoning | 0.5 核 | 512M | Pikafish |
| doc-mysql | 0.5 核 | 512M | — |
| doc-redis | 0.25 核 | 128M | — |
| doc-minio | 0.25 核 | 256M | — |
| **合计** | **~4.25 核** | **~6G** | — |



### 9.2 生产 MVP 环境（8 核 / 16G 总内存）

| 容器 | CPU | 内存 | 说明 |
| ---- | ---- | ---- | ---- |
| doc-nginx | 0.5 核 | 256M | — |
| doc-springboot | 1 核 | 1G | — |
| doc-fastapi-vision | 2 核 | 4G | 预加载 rembg + SAM |
| doc-fastapi-language | 2 核 | 4G | 预加载 ChatTTS + Whisper |
| doc-fastapi-document | 1 核 | 2G | 预加载 bge-large-zh |
| doc-fastapi-reasoning | 1 核 | 1G | — |
| doc-mysql | 1 核 | 1G | — |
| doc-redis | 0.25 核 | 256M | — |
| doc-minio | 0.5 核 | 512M | — |
| **合计** | **~9.25 核** | **~14G** | 略超分配，Docker 会动态调度 |



------



## 十、安全注意事项



### 10.1 密钥管理



| 措施 | 说明 |
| ---- | ---- |
| .env 不入库 | 将 `.env` 加入 `.gitignore`，提供 `.env.example` 模板 |
| 生产密码强要求 | 所有密码至少 16 位，包含大小写字母、数字、特殊字符 |
| JWT 密钥随机生成 | `openssl rand -base64 32` 生成 |
| 定期轮换 | 建议每季度更换数据库密码和 JWT 密钥 |



### 10.2 端口安全



| 端口 | 建议 |
| ---- | ---- |
| 80/443 | 必须开放，建议 80 强制跳转 443 |
| 9001 (MinIO Console) | 生产环境注释掉，或通过 Nginx 反向代理 + IP 白名单 |
| 3306/6379/9000 | 绝不映射到宿主机 |
| 8001-8004 | 绝不映射到宿主机 |
| 8080 | 绝不映射到宿主机 |



### 10.3 容器安全



| 措施 | 配置方式 |
| ---- | ---- |
| 非 root 用户运行 | 在 Dockerfile 中添加 `USER 1000:1000` |
| 只读挂载配置 | `:ro` 后缀（如 nginx.conf、前端文件） |
| 基础镜像定期更新 | `docker compose pull` 拉取最新安全补丁 |
| 限制容器能力 | `cap_drop: [ALL]` 按需 `cap_add` |



### 10.4 .gitignore 建议



```gitignore
# 环境变量（含敏感信息）
.env

# 数据卷
/data/

# SSL 证书
nginx/ssl/

# 模型文件（太大，不入库）
services/*/models/
```



------



## 十一、备份策略建议



### 11.1 备份清单



| 备份内容 | 方式 | 频率 | 保留份数 | 命令示例 |
| ---- | ---- | ---- | ---- | ---- |
| MySQL 数据库 | mysqldump | 每日凌晨 | 30 份 | `docker exec doc-mysql mysqldump -uroot -p$MYSQL_PASSWORD ai_platform > backup.sql` |
| MinIO 文件 | rclone / mc mirror | 每日 | 30 份 | `docker exec doc-minio mc mirror local/bucket /backup/minio` |
| Chroma 向量数据 | 文件拷贝 | 每周 | 4 份 | `cp -r /data/chroma /backup/chroma-$(date +%Y%m%d)` |
| Nginx 配置 | Git 管理 | 每次修改 | — | 配置文件纳入版本控制 |
| AI 模型缓存 | 不备份 | — | — | 可重新下载 |



### 11.2 MySQL 自动备份脚本



```bash
#!/bin/bash
# 文件：/opt/scripts/backup-mysql.sh

BACKUP_DIR="/backup/mysql"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker exec doc-mysql mysqldump \
  -uroot -p${MYSQL_PASSWORD} \
  --single-transaction \
  --routines \
  --triggers \
  ai_platform | gzip > ${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz

# 删除 30 天前的备份
find ${BACKUP_DIR} -name "backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed: backup_${TIMESTAMP}.sql.gz"
```



### 11.3 定时任务配置



```bash
# 添加到 crontab（crontab -e）

# 每天凌晨 2:00 MySQL 备份
0 2 * * * /opt/scripts/backup-mysql.sh >> /var/log/backup.log 2>&1

# 每天凌晨 3:00 MinIO 备份
0 3 * * * /opt/scripts/backup-minio.sh >> /var/log/backup.log 2>&1

# 每周日凌晨 4:00 Chroma 备份
0 4 * * 0 /opt/scripts/backup-chroma.sh >> /var/log/backup.log 2>&1
```



------



## 十二、开发 / 生产环境差异配置



| 维度 | 开发环境 | 生产环境 |
| ---- | ---- | ---- |
| docker-compose 文件 | `docker-compose.yml` | `docker-compose.prod.yml`（覆盖） |
| 端口暴露 | 可暴露 8080/8001-8004 方便调试 | 仅暴露 80/443 |
| 资源限制 | 宽松或不设限制 | 严格限制 CPU/内存 |
| 日志级别 | DEBUG / INFO | WARN / ERROR |
| 卷挂载 | Named Volume | Bind Mount 到指定宿主机路径 |
| GPU | 可选 | 生产 GPU 服务器启用 |
| restart 策略 | `unless-stopped` | `always` |
| .env 密码 | 简单密码 | 强密码 |
| MinIO Console | 开启（9001） | 关闭或 Nginx 代理 |
| SpringBoot Actuator | 全开 | 仅 health |



**生产环境覆盖文件示例（docker-compose.prod.yml）：**

```yaml
services:
  doc-nginx:
    ports:
      - "80:80"
      - "443:443"
    restart: always

  doc-minio:
    ports:
      - "9000"  # 关闭控制台端口
    restart: always
```



**生产启动命令：**

```bash
# 使用基础配置 + 生产覆盖
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```



------



## 附录 A：快速部署检查清单



- [ ] `.env` 文件已创建，所有密码已修改为强密码
- [ ] SSL 证书已放置到 `nginx/ssl/` 目录
- [ ] 前端已构建（`mobile/dist/` 和 `admin/dist/`）
- [ ] Docker 和 Docker Compose 已安装
- [ ] NVIDIA Container Toolkit 已安装（GPU 服务器）
- [ ] 磁盘空间充足（建议 50G+）
- [ ] 防火墙已配置（仅开放 80/443）
- [ ] 备份脚本已配置并测试
- [ ] `docker compose up -d` 启动成功
- [ ] `docker compose ps` 所有服务状态为 healthy



## 附录 B：常见问题排查



### 容器启动失败

```bash
# 查看具体容器日志
docker compose logs doc-fastapi-vision

# 检查健康检查状态
docker inspect doc-fastapi-vision | grep -A 10 Health
```

### GPU 不可用

```bash
# 检查 NVIDIA 驱动
nvidia-smi

# 检查 Docker GPU 运行时
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
```

### 网络不通

```bash
# 进入容器测试网络
docker exec -it doc-springboot sh
curl http://doc-fastapi-vision:8001/health
```
