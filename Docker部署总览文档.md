# Docker 部署总览文档

> 本文档是项目的 Docker 部署实际状态文档，记录已实现的部署架构。
> 详细操作手册请参阅 `docs/docker-deployment.md`（不在 GitHub 中）。



------



## 一、概述

本项目采用 Docker Compose 进行容器编排，基础设施与应用层分离部署。

**实际部署架构：**

| 层级 | 位置 | 说明 |
| ---- | ---- | ---- |
| 共享基础设施 | `/data/compose/infra/`（WSL 文件系统） | MySQL、Redis、MinIO，所有项目共用 |
| 应用层 | `/mnt/g/ai-toolkit/`（G 盘挂载到 WSL） | SpringBoot、FastAPI、Nginx |
| 前端打包 | Windows 本地执行 | Node.js + pnpm 打包 H5，产物由 Nginx 读取 |

**核心部署原则：**

| 原则 | 说明 |
| ---- | ---- |
| 基础设施共享 | MySQL/Redis/MinIO 独立 compose，通过 `shared-net` 网络供所有项目使用 |
| 所有端口绑定 127.0.0.1 | 安全起见，所有端口仅本机可访问 |
| 环境变量管理 | 密码、API Key 通过 `.env` 文件管理，`.env.example` 开源 |
| 无本地 JDK 要求 | Java 后端通过 Docker 多阶段构建，Maven 编译在容器内完成 |



------



## 二、实际容器清单



### 2.1 共享基础设施（/data/compose/infra/）

| 容器名 | 镜像 | 端口（127.0.0.1） | 状态 |
| ---- | ---- | ---- | ---- |
| shared-mysql | mysql:8.0 | 3306 | ✅ 已部署运行 |
| shared-redis | redis:7-alpine | 6379 | ✅ 已部署运行 |
| shared-minio | minio/minio | 9000, 9001 | ✅ 已部署运行 |

### 2.2 应用层（/mnt/g/ai-toolkit/）

| 容器名 | 镜像 | 端口（127.0.0.1） | 状态 |
| ---- | ---- | ---- | ---- |
| doc-springboot | 多阶段构建（maven → temurin:21-jre） | 8180 | ✅ 已部署运行 |
| doc-fastapi-vision | python:3.11-slim + rembg[cpu] | 8181 | ✅ 已部署运行 |
| doc-nginx | nginx:alpine | 8880 | ✅ 已部署运行 |

### 2.3 待实现服务

| 容器名 | 计划端口 | 状态 |
| ---- | ---- | ---- |
| doc-fastapi-language | 8182 | ⬜ 未开始 |
| doc-fastapi-document | 8183 | ⬜ 未开始 |
| doc-fastapi-reasoning | 8184 | ⬜ 未开始 |



------



## 三、网络架构



实际采用**共享网络**模式（非最初设计的双网络隔离）：

```
┌─────────────────────────────────────────────────────┐
│  shared-net（外部网络，infra 创建）                   │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ shared-mysql │  │ shared-redis │  │shared-minio│ │
│  │    :3306      │  │    :6379     │  │  :9000/9001│ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│         ↑                ↑                ↑          │
│  ┌──────┴────────────────┴────────────────┴───────┐ │
│  │  doc-springboot :8180  │  doc-fastapi-vision    │ │
│  │  doc-nginx :8880       │       :8181            │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**与最初设计的差异：**

| 项目 | 最初设计 | 实际实现 | 原因 |
| ---- | ---- | ---- | ---- |
| 网络 | frontend + backend 双网络 | shared-net 单网络 | 基础设施共享，简化管理 |
| SpringBoot 端口 | 8080 | 8180 | 用户要求统一起始端口 |
| FastAPI 端口 | 8001-8004 | 8181-8184 | 用户要求从 8181 开始 |
| Nginx 端口 | 80/443 | 8880 | Windows 80 端口被 Steam++ 占用 |
| GPU | 需要 NVIDIA | CPU 模式 | 本地开发无 GPU，rembg[cpu] 够用 |
| 基础设施 | 同一 compose | 独立 compose | 多项目共享需求 |



------



## 四、docker-compose.yml 实际配置

### 4.1 基础设施（/data/compose/infra/docker-compose.yml）

```yaml
services:
  shared-mysql:
    image: mysql:8.0
    container_name: shared-mysql
    ports:
      - "127.0.0.1:3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-root123}
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - shared-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-p${MYSQL_ROOT_PASSWORD:-root123}"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

  shared-redis:
    image: redis:7-alpine
    container_name: shared-redis
    ports:
      - "127.0.0.1:6379:6379"
    networks:
      - shared-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  shared-minio:
    image: minio/minio
    container_name: shared-minio
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER:-minioadmin}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD:-minioadmin}
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"
    volumes:
      - minio-data:/data
    networks:
      - shared-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 10s

networks:
  shared-net:
    driver: bridge

volumes:
  mysql-data:
  minio-data:
```

### 4.2 应用层（/mnt/g/ai-toolkit/docker-compose.yml）

```yaml
services:
  doc-springboot:
    build:
      context: ./backend-java
      dockerfile: yudao-server/Dockerfile
    container_name: doc-springboot
    ports:
      - "127.0.0.1:8180:8180"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - MYSQL_PASSWORD=${MYSQL_PASSWORD:-root123}
      - MINIO_ENDPOINT=http://shared-minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-minioadmin}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-minioadmin}
      - VISION_SERVICE_URL=http://doc-fastapi-vision:8181
    networks:
      - shared-net
    depends_on:
      doc-fastapi-vision:
        condition: service_healthy
    restart: unless-stopped

  doc-fastapi-vision:
    build:
      context: ./services/vision-service
      dockerfile: Dockerfile
    container_name: doc-fastapi-vision
    ports:
      - "127.0.0.1:8181:8181"
    networks:
      - shared-net
    volumes:
      - model-cache:/root/.cache
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8181/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  doc-nginx:
    image: nginx:alpine
    container_name: doc-nginx
    ports:
      - "127.0.0.1:8880:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/html:/usr/share/nginx/html
      - ./frontend/mobile/dist/build/h5:/usr/share/nginx/html/mobile
    networks:
      - shared-net
    depends_on:
      - doc-springboot
    restart: unless-stopped

networks:
  shared-net:
    external: true

volumes:
  model-cache:
    name: doc-model-cache
```



------



## 五、Dockerfile 实际配置

### 5.1 SpringBoot（backend-java/yudao-server/Dockerfile）

多阶段构建，无需本地 JDK：

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build
COPY pom.xml .
COPY yudao-dependencies/pom.xml yudao-dependencies/
# ... 其他模块 pom.xml
RUN mvn dependency:go-offline -B -pl yudao-server -am -DskipTests || true
COPY . .
RUN mvn clean package -pl yudao-server -am -DskipTests -Pboot -B

FROM eclipse-temurin:21-jre
RUN mkdir -p /yudao-server
WORKDIR /yudao-server
COPY --from=builder /build/yudao-server/target/yudao-server.jar app.jar
ENV TZ=Asia/Shanghai
ENV JAVA_OPTS="-Xms512m -Xmx2048m -Djava.security.egd=file:/dev/./urandom"
ENV SPRING_PROFILES_ACTIVE=docker
EXPOSE 8180
CMD java ${JAVA_OPTS} -jar app.jar $ARGS
```

### 5.2 Vision-Service（services/vision-service/Dockerfile）

```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender-dev curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -m -u 1000 appuser && chrown -R appuser:appuser /app
USER appuser
EXPOSE 8181
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8181"]
```



------



## 六、环境变量管理

### 6.1 文件分布

| 文件 | 位置 | 内容 | 是否入库 |
| ---- | ---- | ---- | ---- |
| `.env` | 项目根目录 | API 密钥、数据库密码等 | ❌ .gitignore 排除 |
| `.env.example` | 项目根目录 | .env 的模板（无真实密码） | ✅ 入库 |
| `.env` | /data/compose/infra/ | MySQL root 密码 | ❌ 不在项目中 |

### 6.2 关键环境变量

```bash
# MySQL
MYSQL_PASSWORD=Xs632f8c3066f97e56b764Mq

# MinIO
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# AI API Keys（按需填写）
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
# ... 共 20+ 个 API Key，见 .env.example
```



------



## 七、端口清单（实际）

| 服务 | 端口 | 绑定 | 说明 |
| ---- | ---- | ---- | ---- |
| shared-mysql | 3306 | 127.0.0.1 | 数据库 |
| shared-redis | 6379 | 127.0.0.1 | 缓存 |
| shared-minio API | 9000 | 127.0.0.1 | 对象存储 |
| shared-minio 控制台 | 9001 | 127.0.0.1 | 管理界面 |
| doc-springboot | 8180 | 127.0.0.1 | Java 后端 |
| doc-fastapi-vision | 8181 | 127.0.0.1 | 视觉 AI 服务 |
| doc-nginx | 8880 | 127.0.0.1 | 前端入口 + 反向代理 |
| 未来 FastAPI 服务 | 8182-8184 | 127.0.0.1 | 待部署 |



------



## 八、前端打包

- **H5 网页版**：Windows 命令行 `pnpm build:h5`，产物在 `frontend/mobile/dist/build/h5/`
- **原生 App（APK）**：HBuilderX 云打包
- **详细步骤**：见 `docs/docker-deployment.md` 第五章



------



## 九、更新操作速查

| 更新什么 | 在哪执行 | 命令 |
| ---- | ---- | ---- |
| Java 后端代码 | WSL | `cd /mnt/g/ai-toolkit && docker-compose up -d --build doc-springboot` |
| Python 服务代码 | WSL | `cd /mnt/g/ai-toolkit && docker-compose up -d --build doc-fastapi-vision` |
| 前端 H5 | Windows | `cd frontend/mobile && pnpm build:h5` |
| 前端原生 App | HBuilderX | 发行 → 原生App-云打包 |
| 所有服务 | WSL | `cd /mnt/g/ai-toolkit && docker-compose up -d --build` |



------



## 十、踩坑记录

| 问题 | 原因 | 解决方案 |
| ---- | ---- | ---- |
| `libgl1-mesa-glx` 找不到 | Python:3.11-slim 用 Debian trixie，该包已更名 | 改用 `libgl1` |
| rembg 启动报 "No onnxruntime" | rembg 默认不带 onnxruntime | 改为 `rembg[cpu]>=2.0` |
| Maven 编译报 `hrm-api` 找不到 | system-server 依赖了未启用的 hrm 模块 | 删除 hrm-api 依赖，HRM 方法改为空实现 |
| `documentService` Bean 冲突 | AI 模块和自建模块同名 Bean | 自建 Service 改名为 `@Service("docProcessService")` |
| Nginx 端口 80 被占用 | Windows 的 Steam++ 占用 80 | 改为映射到 8880 |
| Nginx `:ro` 挂载导致只读 | Docker overlayfs 在 `:ro` 挂载后无法创建其他挂载点 | 去掉 `:ro` |
| heredoc 中 `${VAR}` 被 shell 展开 | bash heredoc 会替换变量 | 用 Python 脚本写文件保留变量引用 |
