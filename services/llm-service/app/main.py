"""LLM Service - 统一的 LLM 推理服务"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import llm_chat

app = FastAPI(
    title="LLM Service",
    description="统一的 LLM 推理服务 - 管理本地大模型（Ollama）",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(llm_chat.router, prefix="/api/v1/llm", tags=["LLM Chat"])


@app.get("/health")
async def health():
    """健康检查"""
    import httpx

    ollama_status = "disconnected"
    models = []

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://host.docker.internal:11434/api/tags")
            if response.status_code == 200:
                ollama_status = "connected"
                data = response.json()
                models = [m["name"] for m in data.get("models", [])]
    except Exception:
        pass

    return {
        "status": "ok",
        "service": "llm-service",
        "version": "1.0.0",
        "ollama_status": ollama_status,
        "models": models
    }
