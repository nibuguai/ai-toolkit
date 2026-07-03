"""Ollama LLM 聊天接口"""
import json
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx

logger = logging.getLogger(__name__)
router = APIRouter()

OLLAMA_BASE_URL = "http://host.docker.internal:11434"


class ChatMessage(BaseModel):
    role: str  # system, user, assistant
    content: str


class ChatRequest(BaseModel):
    model: str = "qwen2.5:7b"
    messages: List[ChatMessage]
    stream: bool = False
    temperature: float = 0.7
    max_tokens: int = 2048


class ChatResponse(BaseModel):
    model: str
    message: ChatMessage
    done: bool
    total_duration: Optional[int] = None
    eval_count: Optional[int] = None


@router.post("/chat")
async def chat(request: ChatRequest):
    """与 Ollama LLM 对话（非流式）"""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": request.model,
                    "messages": [msg.model_dump() for msg in request.messages],
                    "stream": False,
                    "options": {
                        "temperature": request.temperature,
                        "num_predict": request.max_tokens
                    }
                }
            )
            response.raise_for_status()
            result = response.json()
            return ChatResponse(
                model=result["model"],
                message=ChatMessage(**result["message"]),
                done=result["done"],
                total_duration=result.get("total_duration"),
                eval_count=result.get("eval_count")
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="LLM 请求超时")
    except Exception as e:
        logger.error(f"LLM 调用失败: {e}")
        raise HTTPException(status_code=500, detail=f"LLM 调用失败: {str(e)}")


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """与 Ollama LLM 对话（流式）"""
    async def generate():
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": request.model,
                        "messages": [msg.model_dump() for msg in request.messages],
                        "stream": True,
                        "options": {
                            "temperature": request.temperature,
                            "num_predict": request.max_tokens
                        }
                    }
                ) as response:
                    async for line in response.aiter_lines():
                        if line:
                            data = json.loads(line)
                            content = data.get("message", {}).get("content", "")
                            if content:
                                yield f"data: {json.dumps({'content': content, 'done': data.get('done', False)}, ensure_ascii=False)}\n\n"
                            if data.get("done"):
                                yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"LLM 流式调用失败: {e}")
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/models")
async def list_models():
    """获取可用模型列表"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"获取模型列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取模型列表失败: {str(e)}")


@router.get("/health")
async def llm_health():
    """检查 Ollama 服务状态"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}")
            return {
                "status": "ok",
                "service": "ollama",
                "message": response.text
            }
    except Exception as e:
        return {
            "status": "error",
            "service": "ollama",
            "error": str(e)
        }
