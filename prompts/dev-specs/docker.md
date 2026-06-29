# Docker 开发规范



------



## 状态

🟢 已确认（2026-06-29）



## 基础选型

| 项 | 选择 | 版本 | 说明 |
| ---- | ---- | ---- | ---- |
| 编排工具 | Docker Compose | v3.8+ | 文件格式版本 |
| 基础镜像（Java） | eclipse-temurin | 21-jre | 不用 alpine（musl 坑多），用 slim |
| 基础镜像（Python） | python | 3.11-slim | 所有 FastAPI 服务统一 |
| 基础镜像（Nginx） | nginx | alpine | 最小体积，够用 |
| 基础镜像（MySQL） | mysql | 8.0 | 业务数据库 |
| 基础镜像（Redis） | redis | 7-alpine | 缓存 |
| 基础镜像（MinIO） | minio/minio | latest | Demo 用 latest，上线前固定版本 |



## Demo 阶段简化

Phase 0 只跑通一条链路，不需要满配 9 个容器：

```
Phase 0 最小容器集（4 个）：
  doc-nginx          ← 前端 + 反向代理
  doc-springboot     ← 业务中枢
  doc-fastapi-vision ← AI 计算（只建一个服务）
  doc-minio          ← 文件存储

需要时再加：
  doc-mysql    ← 若依自带，本地开发可能直接连宿主机 MySQL
  doc-redis    ← 缓存和任务队列，本地可不用
  
其他 FastAPI 服务用到时再加：
  doc-fastapi-language
  doc-fastapi-document
  doc-fastapi-reasoning
```



## Dockerfile 规范



### Java / SpringBoot

```dockerfile
# 多阶段构建
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY . .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar

# 非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```



### Python / FastAPI（通用模板）

```dockerfile
FROM python:3.11-slim

# 系统依赖（按服务需求减量）
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \                        # language-service 需要
    # libreoffice-core \            # document-service 需要
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 非 root 用户
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000  # 实际端口由环境变量 SERVICE_PORT 控制

# 生产模式启动（uvicorn workers）
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${SERVICE_PORT:-8000} --workers ${WORKERS:-1}"]
```



## Dockerfile 规范要点

| 规范 | 说明 |
| ---- | ---- |
| 非 root 用户 | 必须 `USER appuser`，不要以 root 运行 |
| 多阶段构建 | Java 必须，Python 单阶段即可（slim 镜像已足够小） |
| .dockerignore | 排除 `.git`、`__pycache__`、`node_modules`、`models/`、`.env` |
| 层优化 | COPY requirements.txt → pip install → COPY . ，利用 Docker 层缓存 |
| 健康检查 | 不在 Dockerfile 中定义，统一在 docker-compose.yml 中配置 |
| 镜像大小 | 单个镜像不超过 5GB（含模型） |



## docker-compose.yml 规范

```yaml
# 必须遵守的规范：

services:
  # 命名：doc-{用途}
  # 端口：除 nginx 外都不映射到宿主机
  # 网络：按职责分配
  # depends_on：必须加 condition: service_healthy
  # restart：统一 unless-stopped
  # healthcheck：每个服务都要有
  # resources：生产环境必须限制 CPU/内存
```



## 网络规范

| 网络 | 成员 | 说明 |
| ---- | ---- | ---- |
| frontend | nginx, springboot | Nginx → SpringBoot 的流量 |
| backend | springboot, 所有 fastapi, mysql, redis, minio | 内部服务通信 |

> SpringBoot 是唯一双网卡容器，不做 frontend 和 backend 之间的路由转发。



## 环境变量规范

| 规范 | 说明 |
| ---- | ---- |
| 管理方式 | `.env` 文件（不入 Git 仓库） |
| 模板提供 | `.env.example`（入 Git，不含真实密码） |
| 引用格式 | `${VAR_NAME:-default_value}` |
| 敏感变量 | MYSQL_PASSWORD, MINIO_SECRET_KEY, JWT_SECRET, LLM_API_KEY |
| 服务地址 | 用 Docker 容器名（`http://doc-fastapi-vision:8001`），不用 IP |



## 已确认决策

| # | 决策 | 结论 |
| ---- | ---- | ---- |
| 1 | Java 基础镜像 | eclipse-temurin:21-jre（不用 alpine，musl 坑多） |
| 2 | MinIO 版本 | Demo 用 latest，上线前固定 |
| 3 | GPU 开发环境 | 注释掉，上线解开 |
| 4 | Demo 容器数 | 最小 4 个（nginx + springboot + vision + minio） |
| 5 | 非 root 用户 | 所有容器必须 `USER` 切换，不用 root |
| 6 | 健康检查 | 统一在 docker-compose.yml 配置，不写 Dockerfile |
| 7 | 敏感信息 | `.env` 不入 Git，`.env.example` 入 Git |
