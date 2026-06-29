"""Base64 编解码工具"""
import base64
import io
from PIL import Image


def base64_to_image(b64_string: str) -> Image.Image:
    """Base64 字符串 → PIL Image"""
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]  # 去掉 data:image/png;base64, 前缀
    image_bytes = base64.b64decode(b64_string)
    return Image.open(io.BytesIO(image_bytes))


def image_to_base64(image: Image.Image, fmt: str = "PNG") -> str:
    """PIL Image → Base64 字符串"""
    buffer = io.BytesIO()
    image.save(buffer, format=fmt)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
