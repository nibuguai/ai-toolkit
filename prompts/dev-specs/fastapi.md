# FastAPI 开发规范

> AI 计算层各服务的开发约束。服务详情详见《FastAPI 文档》。



------



## 状态

🟢 已确认（2026-06-29）



## Demo 阶段原则

**当前（Phase 0）只跑通一个功能的完整链路**，其他服务按需搭建：

```
Phase 0 Demo：选 vision-service 的证件照抠图
  → 只安装 vision-service 所需的依赖
  → 验证：Vue → SpringBoot → FastAPI → 返回结果 → 前端展示
  → 链路跑通后，其他 3 个服务照搬模板即可
```



## 基础选型

| 项 | 选择 | 版本 | 说明 |
| ---- | ---- | ---- | ---- |
| Python | CPython | 3.11 | 生态兼容性最佳，稳定 |
| 框架 | FastAPI | 0.110+ | 异步 + Pydantic v2 |
| 服务器 | Uvicorn | 0.29+ | ASGI 生产服务器 |
| 包管理 | pip + requirements.txt | — | 简单直接 |
| 基础镜像 | python:3.11-slim | — | 比 alpine 省事 |



## 服务通用依赖（每个服务都装）

```txt
fastapi>=0.110,<1.0
uvicorn[standard]>=0.29,<1.0
pydantic>=2.0,<3.0
python-dotenv>=1.0
numpy>=1.26
```



## 各服务特有依赖（按需安装，不是现在全部装）

### vision-service（Phase 0 Demo 用这个）

```txt
torch>=2.0
torchvision>=0.17
opencv-python-headless>=4.9
pillow>=10.0
rembg>=2.0
```

### language-service（Phase 2 用到时再装）

```txt
torch>=2.0
openai-whisper
ChatTTS
scipy
soundfile
websockets
pyworld          # 变声器 DSP
```

### document-service（Phase 3 用到时再装）

```txt
langchain
langchain-community
chromadb
sentence-transformers
pdf2docx
pypdf
python-docx
markdown
```

### reasoning-service（Phase 4 用到时再装）

```txt
websockets
# Pikafish 是外部二进制，不在 requirements.txt
```



## 项目结构（每个服务统一）

```
services/{service-name}/
├── Dockerfile
├── requirements.txt
├── .dockerignore
└── app/
    ├── __init__.py
    ├── main.py              ← FastAPI 应用入口 + lifespan 生命周期
    ├── config.py            ← 配置（环境变量读取）
    ├── startup.py           ← 模型预加载逻辑
    ├── routers/
    │   ├── __init__.py
    │   └── *.py             ← 按功能模块拆分路由文件
    ├── services/
    │   ├── __init__.py
    │   └── *.py             ← 业务逻辑（每个功能一个文件）
    ├── models/
    │   ├── __init__.py
    │   ├── request.py       ← Pydantic 请求模型
    │   └── response.py      ← Pydantic 响应模型
    └── utils/
        ├── __init__.py
        ├── base64_util.py   ← Base64 编解码
        └── log_util.py      ← 日志工具
```



## main.py 标准模板

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.startup import preload_models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时：预加载模型
    preload_models()
    yield
    # 关闭时：释放资源
    pass

app = FastAPI(title="vision-service", version="1.0.0", lifespan=lifespan)

# 统一健康检查
@app.get("/health")
async def health():
    return {"status": "ok", "service": "vision-service"}

# 注册路由
from app.routers import id_photo, inpaint, enhance, batch
app.include_router(id_photo.router, prefix="/api/v1/vision")
app.include_router(inpaint.router, prefix="/api/v1/vision")
app.include_router(enhance.router, prefix="/api/v1/vision")
app.include_router(batch.router, prefix="/api/v1/vision")
```



## config.py 标准模板

```python
import os

class Settings:
    # 从环境变量读取，有默认值
    SERVICE_PORT: int = int(os.getenv("SERVICE_PORT", "8001"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    MODEL_CACHE_DIR: str = os.getenv("MODEL_CACHE_DIR", "/root/.cache")
    # GPU 开关
    CUDA_VISIBLE_DEVICES: str = os.getenv("CUDA_VISIBLE_DEVICES", "0")
    USE_GPU: bool = os.getenv("USE_GPU", "true").lower() == "true"

settings = Settings()
```



## 编码规范

| 规范 | 说明 |
| ---- | ---- |
| 路由 | 只做参数校验和调用 service，不写逻辑 |
| Service | 纯业务逻辑，返回 dict/Pydantic 模型 |
| 模型加载 | 通过 `startup.py` 在 `lifespan` 中预加载 |
| 健康检查 | 每个服务必须有 `GET /health` |
| 日志 | 使用 `logging` 模块，格式含时间 + 级别 + 模块名 |
| 异常处理 | FastAPI exception_handler 统一包装，不暴露内部错误 |
| Base64 | 统一在 utils/base64_util.py，不散落各处 |
| Docker | 开发模式 `--reload`，生产模式 `--workers 1` |



## GPU 和 Workers 说明

**GPU：** AI 模型在 GPU 上跑比 CPU 快 5-20 倍。有 GPU 就分配，没有也能跑，慢一点。

**Workers：** 一个容器里跑几个进程。

```txt
--workers 1（AI 服务用这个）
  1 个进程 → 1 份模型 → 显存 4GB ✅

--workers 4（AI 服务不要用）
  4 个进程 → 4 份模型 → 显存 4×4=16GB → 💥 爆显存
```

每个 worker 会独立加载一份模型到显存。所以 AI 服务 `--workers 1`，纯参数服务可以多开。



## 通信格式

**统一 JSON + Base64，不区分文件类和参数类。**

```json
请求：
{
  "file_data": "Base64 编码内容",
  "file_name": "原始文件名",
  "params": {}
}

响应：
{
  "code": 200,
  "message": "success",
  "data": {
    "result_type": "base64",
    "result": "..."
  }
}
```

> 不传文件的接口（如 TTS 文字配音），`file_data` 和 `file_name` 留空字符串即可。



## 已确认决策

| # | 决策 | 结论 |
| ---- | ---- | ---- |
| 1 | Python 版本 | 3.11 |
| 2 | Demo 策略 | 先跑通 vision-service 证件照抠图一条链路 |
| 3 | 依赖安装 | 用到哪个服务才装哪个，不提前装 |
| 4 | 通信格式 | 统一 JSON + Base64，不区分 |
| 5 | Workers | AI 服务 `--workers 1` |
| 6 | GPU | 有就挂，没有也能跑 |
| 7 | 日志 | logging（零依赖） |
