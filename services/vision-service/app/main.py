"""FastAPI 应用入口"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.startup import preload_models

# 日志配置
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动预加载模型，关闭释放资源"""
    logger.info("Starting vision-service...")
    preload_models()
    logger.info("vision-service started")
    yield
    logger.info("vision-service shutting down")


app = FastAPI(
    title="vision-service",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/health")
async def health():
    """健康检查"""
    return {
        "status": "ok",
        "service": "vision-service",
        "models_loaded": ["rembg"]
    }


# 注册路由
from app.routers import id_photo

app.include_router(id_photo.router, prefix="/api/v1/vision")
