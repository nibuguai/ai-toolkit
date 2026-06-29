"""
模型预加载 —— 在 FastAPI lifespan 中调用
"""
import logging

logger = logging.getLogger(__name__)

# 全局模型实例
_remove_bg_session = None


def preload_models():
    """启动时预加载 rembg 模型"""
    global _remove_bg_session
    try:
        from rembg import new_session
        _remove_bg_session = new_session("u2net")
        logger.info("rembg model loaded successfully")
    except Exception as e:
        logger.warning(f"rembg model not preloaded (will load on first request): {e}")


def get_remove_bg_session():
    """获取抠图 session（如果未预加载则懒加载）"""
    global _remove_bg_session
    if _remove_bg_session is None:
        from rembg import new_session
        _remove_bg_session = new_session("u2net")
    return _remove_bg_session
