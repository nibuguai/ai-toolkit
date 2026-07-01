import os


class Settings:
    SERVICE_PORT: int = int(os.getenv("SERVICE_PORT", "8181"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    MODEL_CACHE_DIR: str = os.getenv("MODEL_CACHE_DIR", "/root/.cache")
    USE_GPU: bool = os.getenv("USE_GPU", "true").lower() == "true"


settings = Settings()
