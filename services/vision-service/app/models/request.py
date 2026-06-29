"""Pydantic 请求模型"""
from pydantic import BaseModel, Field
from typing import Optional, Dict


class VisionRequest(BaseModel):
    """统一请求格式"""
    file_data: str = Field(default="", description="Base64 编码的文件内容")
    file_name: str = Field(default="", description="原始文件名")
    params: Dict = Field(default_factory=dict, description="业务参数")
