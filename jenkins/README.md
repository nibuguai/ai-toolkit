# Jenkins 自动化部署

## 访问信息

| 项目 | 详情 |
|------|------|
| **访问地址** | http://localhost:5050 |
| **用户名** | `Jenkins` |
| **密码** | `Jenkins123456` |
| **初始 Admin 密码** | `a9674346591a4604b57adc7248d31295`（已完成初始化则不再需要） |

## 容器信息

| 项目 | 详情 |
|------|------|
| **容器名** | `jenkins` |
| **镜像** | `jenkins-custom:latest`（基于 jenkins/jenkins:lts-jdk17） |
| **数据卷** | `jenkins_home` → `/var/jenkins_home` |
| **Web 端口** | `5050:8080` |
| **Agent 端口** | `50000:50000` |
| **重启策略** | `unless-stopped`（开机自启） |
| **运行位置** | WSL Ubuntu-24.04 Docker 中 |

## 内置工具

| 工具 | 版本 | 用途 |
|------|------|------|
| Docker CLI | 29.5.3 | 构建/管理 Docker 容器 |
| Docker Compose | v5.2.0 | 多容器编排 |
| Node.js | v20.20.2 | 前端构建 |
| pnpm | 10.34.4 | 前端依赖管理 |
| Java | JDK 17 | Jenkins 运行环境 |

## 挂载目录

| 容器路径 | 宿主机路径 | 说明 |
|----------|-----------|------|
| `/var/jenkins_home` | Docker 卷 `jenkins_home` | Jenkins 数据持久化 |
| `/var/run/docker.sock` | `/var/run/docker.sock` | 控制宿主机 Docker |
| `/var/jenkins_home/workspace/ai-toolkit` | `/mnt/g/ai-toolkit` | 项目源码 |

## 自动部署流程

```
GitHub Push → Jenkins 每 5 分钟轮询检测 → 发现变更 → Pipeline → 构建部署对应服务
```

支持的部署目标：

| 变更目录 | 部署操作 |
|----------|---------|
| `backend-java/` | `docker compose build doc-springboot && up -d` |
| `backend-python/` | `docker compose build doc-fastapi-vision && up -d` |
| `frontend/yudao-ui-admin-vue3/` | `pnpm install && pnpm build` → 重启 nginx |
| `frontend/yudao-ui-admin-uniapp/` | `pnpm install && pnpm build:h5` → 重启 nginx |
| `nginx/` | `docker compose restart doc-nginx` |

## 触发方式：Poll SCM（定时轮询）

Jenkins 每 5 分钟自动检查 GitHub 是否有新提交，有变更则自动触发构建部署。

- 无需公网暴露，无需 Webhook
- 适合内网环境
- 延迟最多 5 分钟

## 常用管理命令

```bash
# 查看状态
docker ps --filter name=jenkins

# 查看日志
docker logs -f jenkins

# 重启
docker restart jenkins

# 停止
docker stop jenkins

# 启动
docker start jenkins

# 进入容器
docker exec -it jenkins bash

# 查看初始密码（如果未完成初始化）
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# 重新构建镜像
cd /mnt/g/ai-toolkit/jenkins
docker compose build --no-cache
docker compose up -d
```

## 数据备份

Jenkins 数据保存在 Docker 卷 `jenkins_home` 中：

```bash
# 查看卷位置
docker volume inspect jenkins_home

# 备份卷数据
docker run --rm -v jenkins_home:/data -v /tmp:/backup alpine tar czf /backup/jenkins-backup.tar.gz -C /data .
```

## 插件管理

- 推荐插件已安装（Git、Pipeline、Docker、GitHub、SSH 等）
- 随时在 `Manage Jenkins → Plugins` 增删插件

---

> 更新日期：2026-07-01
