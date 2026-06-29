"""证件照抠图路由"""
import logging
from io import BytesIO

from fastapi import APIRouter

from app.models.request import VisionRequest
from app.models.response import VisionResponse
from app.startup import get_remove_bg_session
from app.utils.base64_util import base64_to_image, image_to_base64

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/id-photo/remove-bg", response_model=VisionResponse)
async def remove_background(req: VisionRequest):
    """智能抠图：接收 Base64 图片，返回透明背景 PNG"""
    try:
        # 解码图片
        image = base64_to_image(req.file_data)

        # rembg 抠图
        session = get_remove_bg_session()
        output = session.remove(image)

        # 编码返回
        result_base64 = image_to_base64(output, fmt="PNG")

        return VisionResponse(
            code=200,
            message="success",
            data={
                "result_type": "base64",
                "result": result_base64,
                "file_name": f"cutout_{req.file_name or 'result'}.png"
            }
        )

    except Exception as e:
        logger.error(f"Remove background failed: {e}")
        return VisionResponse(
            code=500,
            message=f"处理失败: {str(e)}"
        )
