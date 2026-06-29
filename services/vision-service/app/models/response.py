"""Pydantic 响应模型"""
from pydantic import BaseModel
from typing import Optional, Any, Dict


class VisionResponse(BaseModel):
    """统一响应格式"""
    code: int = 200
    message: str = "success"
    data: Optional[Dict[str, Any]] = None
