# FastAPI 文档

> 本文档详细说明 AI 计算层的 FastAPI 服务设计。
> 整体架构和调用关系请参阅《项目架构文档》。



------



## 一、设计原则

FastAPI 在本项目中的定位是**纯计算层**，遵循以下原则：

| 原则 | 说明 |
| ---- | ---- |
| **无状态** | FastAPI 不存储任何业务数据，不维护用户会话 |
| **不碰存储** | 不直接访问 MySQL、Redis、MinIO 等任何存储系统 |
| **只做计算** | 接收数据 → 模型推理/处理 → 返回结果 |
| **不知道用户是谁** | 不处理认证、鉴权、权限，这些由 SpringBoot 负责 |
| **独立容器** | 每个服务独立镜像、独立依赖、独立扩缩 |



**核心调用流程：**

```
SpringBoot                            FastAPI
   │                                     │
   ├─ 上传文件 → 存到 MinIO              │
   ├─ 从 MinIO 读出 → 转 Base64          │
   ├─ HTTP POST ──────────────────────→  │
   │                                     ├─ 接收 Base64
   │                                     ├─ 模型推理/处理
   │                                     ├─ 返回结果
   │  ←──────────────────────────────    │
   ├─ 存结果到 MySQL / MinIO             │
   ├─ 更新任务状态                        │
   └─ 返回给用户                          │
```

详细通信协议见《项目架构文档》2.4 节。



------



## 二、SpringBoot 与 FastAPI 的通信规范



### 2.1 请求格式

所有 FastAPI 服务接口使用统一的 JSON 请求格式：

```json
{
  "file_data": "Base64 编码的文件内容",
  "file_name": "原始文件名（可选）",
  "params": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| file_data | string | 是 | Base64 编码的文件内容 |
| file_name | string | 否 | 原始文件名，用于保留扩展名信息 |
| params | object | 否 | 各接口特定的参数 |

### 2.2 响应格式

统一 JSON 响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "result_type": "text / base64 / url",
    "result": "处理结果",
    "file_name": "文件名（文件类结果时返回）",
    "extra": {}
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| code | int | 是 | 200 成功，400 参数错误，500 处理失败 |
| message | string | 是 | 状态描述 |
| data.result_type | string | 是 | text / base64 / url |
| data.result | string | 是 | 处理结果内容 |
| data.file_name | string | 否 | 文件类结果的文件名 |
| data.extra | object | 否 | 额外信息（引用来源、胜率等） |

### 2.3 错误处理

| HTTP 状态码 | code | 场景 |
| ---- | ---- | ---- |
| 200 | 200 | 正常 |
| 400 | 400 | 参数校验失败、文件格式不支持 |
| 500 | 500 | 模型推理异常、内存不足 |

### 2.4 超时建议

| 场景 | 建议超时 |
| ---- | ---- |
| 图片处理（抠图、修复） | 30s |
| TTS 语音合成 | 60s |
| 音频转文字 | 120s |
| 文档格式转换 | 60s |
| RAG 问答 | 30s |
| 象棋分析 | 30s |
| 批量处理 | 300s |



### 2.5 各服务数据格式速查

| 场景 | 归属服务 | SpringBoot 发送 | FastAPI 返回 |
| ---- | ---- | ---- | ---- |
| 证件照抠图 | vision-service | 图片 Base64 + 参数(尺寸/背景色) | 处理后图片 Base64 |
| 去水印/去路人 | vision-service | 图片 Base64 + 区域坐标 | 修复后图片 Base64 |
| 老照片修复 | vision-service | 图片 Base64 | 修复后图片 Base64 |
| 超分辨率 | vision-service | 图片 Base64 + 倍数 | 放大后图片 Base64 |
| 批量处理 | vision-service | 图片 Base64[] + 操作参数 | 处理后图片 Base64[] |
| 文字配音 | language-service | 文字 + 音色参数 | 音频 Base64 |
| 音色克隆 | language-service | 参考音频 Base64 + 文字 | 音频 Base64 |
| 语音转文字 | language-service | 音频 Base64 | 文字 + 时间戳 |
| 字幕生成 | language-service | 音频/视频 Base64 | SRT/VTT 字幕文本 |
| 实时变声 | language-service | 音频流 (WebSocket) + 预设 | 变声后音频流 |
| 格式转换 | document-service | 文件 Base64 + 目标格式 | 转换后文件 Base64 |
| RAG 文档上传 | document-service | 文件 Base64 | 文档ID + 切片信息 |
| RAG 问答 | document-service | 问题 + 知识库ID | 回答 + 引用来源 |
| 象棋分析 | reasoning-service | FEN 棋局字符串 + 搜索深度 | 最佳着法 + 胜率 |
| 棋谱复盘 | reasoning-service | 棋谱文件 Base64 | 逐回合分析 |
| AI 对话 | reasoning-service | 用户消息 + 对话历史 | AI 回复文字 |



------



## 三、vision-service（视觉服务）



**容器名：** `doc-fastapi-vision`
**内部端口：** 8001
**GPU：** 需要
**基础镜像：** `python:3.11-slim`



### 3.1 API 端点

基础路径：`/api/v1/vision`



#### 模块一：证件照

| 方法 | 路径 | 说明 | 参数 |
| ---- | ---- | ---- | ---- |
| POST | `/id-photo/remove-bg` | 智能抠图，返回透明背景 PNG | file_data: 图片 Base64 |
| POST | `/id-photo/change-bg` | 换背景色 | file_data: 抠图后图片 + params.bg_color: red/white/blue |
| POST | `/id-photo/resize` | 标准尺寸裁剪 | file_data: 图片 + params.size: 1inch/2inch/visa/passport |
| POST | `/id-photo/compose-sheet` | 冲印排版 | file_data: 图片 + params.size + params.count: 排版数量 |

#### 模块二：瑕疵修复

| 方法 | 路径 | 说明 | 参数 |
| ---- | ---- | ---- | ---- |
| POST | `/inpaint/remove-object` | 去除指定区域物体（LaMa） | file_data: 图片 + params.mask: 遮罩区域坐标 |
| POST | `/inpaint/remove-watermark` | 自动检测并去除水印 | file_data: 图片 |
| POST | `/restore/old-photo` | 老照片修复（清晰化 + 上色） | file_data: 图片 + params.colorize: true/false |

#### 模块三：图像增强

| 方法 | 路径 | 说明 | 参数 |
| ---- | ---- | ---- | ---- |
| POST | `/enhance/super-resolution` | 超分辨率放大（Real-ESRGAN） | file_data: 图片 + params.scale: 2/4 |
| POST | `/enhance/face-restore` | 人脸修复（CodeFormer） | file_data: 图片 |

#### 模块四：批量处理

| 方法 | 路径 | 说明 | 参数 |
| ---- | ---- | ---- | ---- |
| POST | `/batch/process` | 批量处理 | file_data: 图片数组 + params.operations: 操作列表 |



### 3.2 健康检查

```
GET /health → { "status": "ok", "service": "vision-service", "models_loaded": ["rembg", "sam"] }
```



### 3.3 镜像制作要点



**Dockerfile 关键内容：**

```dockerfile
FROM python:3.11-slim

# 系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

# 预加载模型后启动
CMD ["python", "-c", "from app.startup import preload_models; preload_models()", "&&", \
     "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```



**requirements.txt 核心依赖：**

```
fastapi==0.110+
uvicorn[standard]==0.29+
torch>=2.0
torchvision
opencv-python-headless
pillow
rembg
numpy
```



**模型加载策略：**

| 模型 | 显存占用 | 加载时机 | 说明 |
| ---- | ---- | ---- | ---- |
| rembg | ~2 GB | 启动时预加载 | 证件照抠图核心模型 |
| SAM | ~4 GB | 按需加载 / 启动时加载 | 高精度抠图，显存充足时预加载 |
| Real-ESRGAN | ~4-6 GB | 懒加载 | 超分辨率，首次调用时加载 |
| CodeFormer | ~2-3 GB | 懒加载 | 人脸修复，首次调用时加载 |
| LaMa | ~2 GB | 懒加载 | 去水印/去路人，首次调用时加载 |

> **GPU 内存不足时**：优先保证 rembg 常驻，其他模型按需加载并在空闲时卸载。



------



## 四、language-service（语言服务）



**容器名：** `doc-fastapi-language`
**内部端口：** 8002
**GPU：** 需要
**基础镜像：** `python:3.11-slim`



### 4.1 API 端点

基础路径：`/api/v1/language`



#### TTS 文字配音

| 方法 | 路径 | 说明 | 参数 |
| ---- | ---- | ---- | ---- |
| POST | `/tts/synthesize` | 文字转语音（ChatTTS） | params.text: 文字 + params.voice: 音色编号 |
| POST | `/tts/clone-voice` | 音色克隆（GPT-SoVITS） | file_data: 参考音频 Base64 + params.text: 目标文字 |

#### 语音识别

| 方法 | 路径 | 说明 | 参数 |
| ---- | ---- | ---- | ---- |
| POST | `/asr/transcribe` | 音频转文字（Whisper） | file_data: 音频 Base64 + params.language: zh/en/auto |
| POST | `/asr/generate-subtitle` | 生成字幕文件 | file_data: 音频/视频 Base64 + params.format: srt/vtt |

#### 实时变声器

| 方法 | 路径 | 说明 | 参数 |
| ---- | ---- | ---- | ---- |
| WS | `/voice-changer/stream` | WebSocket 实时变声流 | 双向音频流 + params.preset: 预设音色 |
| GET | `/voice-changer/presets` | 获取可用预设音色列表 | — |
| POST | `/voice-changer/preview` | 试听变声效果（上传片段） | file_data: 音频 Base64 + params.preset: 预设音色 |



### 4.2 健康检查

```
GET /health → { "status": "ok", "service": "language-service", "models_loaded": ["chattts", "whisper"], "voice_changer_presets": 8 }
```



### 4.3 镜像制作要点



**Dockerfile 关键内容：**

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8002
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
```



**requirements.txt 核心依赖：**

```
fastapi==0.110+
uvicorn[standard]==0.29+
torch>=2.0
openai-whisper
ChatTTS
numpy
scipy
soundfile
websockets
# 变声器 DSP（纯 CPU，无需 GPU）
pyaudio
pyworld          # 基频提取 + 音高变换
pytsmod          # 相位声码器（时长不变音高变换）
```



**模型加载策略：**

| 模型 | 显存占用 | 加载时机 | 说明 |
| ---- | ---- | ---- | ---- |
| ChatTTS | ~2-4 GB | 启动时预加载 | 基础 TTS，高频使用 |
| Whisper medium | ~2-3 GB | 启动时预加载 | 语音识别核心模型 |
| GPT-SoVITS | ~4-8 GB | 按需加载 | 音色克隆，仅调用时加载 |

> **长音频处理**：超过 25 分钟的音频需分片处理，避免显存溢出。中文场景优先使用 `whisper-medium` 或 `faster-whisper`。



### 4.4 变声器技术方案



变声器和 TTS/ASR 不同，**不需要 GPU 和 AI 模型**，核心是 DSP（数字信号处理）：



**预设音色：**

| 预设 | 技术参数 | 效果 |
| ---- | ---- | ---- |
| 男声 | 音高 -5 半音 + 共振峰微调 | 低沉男声 |
| 女声 | 音高 +7 半音 + 共振峰调整 | 清亮女声 |
| 机器人 | 量化 + 环形调制 | 机械音 |
| 花栗鼠 | 音高 +12 半音 + 加速 | 卡通高音 |
| 巨人 | 音高 -12 半音 + 减速 | 低沉巨人音 |
| 电话音 | 带通滤波 300-3400Hz | 电话效果 |
| 空旷大厅 | 大混响 | 空间感 |
| 耳语 | 降噪 + 低音量 + 气声增强 | 悄悄话效果 |



**DSP 处理管线：**

```
原始音频流（WebSocket 输入）
      │
      ▼
┌─────────────────────┐
│ 1. 预加重            │  高频补偿
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 2. 基频提取 (pyworld)│  F0 提取 → 目标音高映射
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 3. 音高变换 (PSOLA)  │  变调不变速
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 4. 共振峰调整        │  调整声道特征（让男声更自然变女声）
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 5. 效果器叠加        │  混响/均衡/滤波（按预设切换）
└─────────┬───────────┘
          ▼
处理后的音频流（WebSocket 输出）
```



**性能特点：**

| 指标 | 数值 | 说明 |
| ---- | ---- | ---- |
| CPU 占用 | 极低 | 纯 DSP，一个核心绰绰有余 |
| 内存占用 | < 100 MB | 无大模型 |
| 延迟 | < 20ms | 满足实时通话 |
| GPU | 不需要 | — |
| 采样率 | 16kHz / 48kHz | 可配置 |



**WebSocket 实时通信协议：**

```
客户端 → 服务端（音频帧）：
{
  "type": "audio",
  "preset": "female",    // 可中途切换预设
  "sample_rate": 16000,
  "data": "Base64 编码的 PCM 音频帧"  // 每帧 20ms
}

服务端 → 客户端（处理后音频帧）：
{
  "type": "audio",
  "data": "Base64 编码的处理后音频帧"
}
```



**进阶方向（后期可选）：**

> 基础 DSP 变声效果已经可用。如果需要更高保真度的音色转换（比如变成特定明星的声音），后期可以引入 **RVC（Retrieval-based Voice Conversion）** 模型，在 language-service 中新增一个加载模块。RVC 需要 GPU，模型约 200MB，推理延迟在 50ms 以内。现阶段先用纯 DSP 方案即可。



------



## 五、document-service（文档服务）



**容器名：** `doc-fastapi-document`
**内部端口：** 8003
**GPU：** 可选（Embedding 模型推荐 GPU）
**基础镜像：** `python:3.11-slim`



### 5.1 API 端点

基础路径：`/api/v1/document`



#### 格式转换

| 方法 | 路径 | 说明 | 参数 |
| ---- | ---- | ---- | ---- |
| POST | `/convert/to-pdf` | Word/MD → PDF | file_data: 文件 Base64 |
| POST | `/convert/to-word` | PDF → Word | file_data: PDF Base64 |
| POST | `/convert/to-markdown` | 任意格式 → Markdown | file_data: 文件 Base64 + params.complex: true/false |

#### RAG 知识库

| 方法 | 路径 | 说明 | 参数 |
| ---- | ---- | ---- | ---- |
| POST | `/rag/upload` | 上传文档 → 切片 → 向量化存储 | file_data: 文件 Base64 + params.kb_id: 知识库ID |
| POST | `/rag/query` | 提问 → 检索 → 大模型生成回答 | params.question: 问题 + params.kb_id: 知识库ID |
| DELETE | `/rag/documents/{id}` | 删除知识库文档 | 路径参数: 文档ID |
| GET | `/rag/documents` | 知识库文档列表 | params.kb_id: 知识库ID |



### 5.2 健康检查

```
GET /health → { "status": "ok", "service": "document-service", "models_loaded": ["bge-large-zh"] }
```



### 5.3 镜像制作要点



**Dockerfile 关键内容：**

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-core libreoffice-writer \
    pandoc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8003

# 启动时预加载 Embedding 模型
CMD ["python", "-c", "from app.startup import preload_embedding; preload_embedding()", "&&", \
     "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"]
```



**requirements.txt 核心依赖：**

```
fastapi==0.110+
uvicorn[standard]==0.29+
langchain
langchain-community
chromadb
sentence-transformers
pdf2docx
paddleocr
paddlepaddle
pandoc
pypdf
python-docx
markdown
```



> **LibreOffice** 用于 Word → PDF 转换，通过 headless 模式运行。
> **PaddleOCR** 用于扫描件 PDF 的 OCR 文字提取。
> **复杂文档转 Markdown**：简单文档用 Pandoc，复杂文档（含表格/图片）调用 Ollama/LLM 辅助转换。



------



## 六、reasoning-service（推理服务）



**容器名：** `doc-fastapi-reasoning`
**内部端口：** 8004
**GPU：** 否（Pikafish 在 CPU 上运行）
**基础镜像：** `python:3.11-slim`



### 6.1 API 端点

基础路径：`/api/v1/reasoning`



#### 象棋 AI

| 方法 | 路径 | 说明 | 参数 |
| ---- | ---- | ---- | ---- |
| POST | `/chess/analyze` | 传入 FEN 棋局 → 最佳着法 + 胜率 | params.fen: FEN 字符串 + params.depth: 搜索深度(默认15) |
| POST | `/chess/replay` | 上传棋谱 → 逐回合分析 | file_data: PGN/XQF 棋谱文件 |
| WS | `/chess/stream` | WebSocket 实时推送分析进度 | ws://host:8004/api/v1/reasoning/chess/stream |

#### RPA 自动化

| 方法 | 路径 | 说明 | 参数 |
| ---- | ---- | ---- | ---- |
| POST | `/rpa/execute` | 执行自动化任务 | params.task_type: signin/collect + params.config: 任务配置 |
| GET | `/rpa/tasks` | 任务列表 | — |
| GET | `/rpa/tasks/{id}/status` | 任务执行状态 | 路径参数: 任务ID |



### 6.2 健康检查

```
GET /health → { "status": "ok", "service": "reasoning-service", "engine": "pikafish", "engine_ready": true }
```



### 6.3 镜像制作要点



**Dockerfile 关键内容：**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装 Pikafish 象棋引擎（编译好的二进制文件）
COPY pikafish /usr/local/bin/pikafish
RUN chmod +x /usr/local/bin/pikafish

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8004
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004"]
```



**requirements.txt 核心依赖：**

```
fastapi==0.110+
uvicorn[standard]==0.29+
websockets
numpy
# 以下为 RPA 功能可选依赖
opencv-python-headless
paddleocr
pyautogui
selenium
```



**Pikafish 引擎通信：**
- 使用 UCI 协议，通过 `subprocess` 管理引擎进程
- stdin/stdout 通信
- 搜索深度建议 15-20 层，CPU 推理 2-5 秒出结果
- WebSocket 推送搜索中实时胜率变化



------



## 七、服务间隔离原则



| 原则 | 说明 |
| ---- | ---- |
| **独立镜像** | 每个服务有自己的 Dockerfile，不共享基础镜像以外的依赖 |
| **独立端口** | vision:8001 / language:8002 / document:8003 / reasoning:8004 |
| **不互相调用** | FastAPI 服务之间不发起 HTTP 请求，所有编排由 SpringBoot 负责 |
| **独立扩缩** | 每个服务可独立重启、独立扩容副本数 |
| **GPU 优先级** | vision > language > document > reasoning（reasoning 不需要 GPU） |
| **模型缓存共享** | model-cache 卷可共享挂载，避免从 HuggingFace 重复下载相同基础模型 |



### 网络隔离

```
frontend 网络：Nginx ↔ SpringBoot

backend 网络： SpringBoot ↔ FastAPI (全部4个) ↔ MySQL ↔ Redis ↔ MinIO

FastAPI 对外不可访问，仅 SpringBoot 可调用
```

> 详细网络配置请参阅《Docker 部署总览文档》。



------



## 八、标准项目结构

每个 FastAPI 服务遵循统一的项目结构：

```
services/vision-service/
├── Dockerfile
├── requirements.txt
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── config.py            # 配置（模型路径、端口等）
│   ├── startup.py           # 模型预加载逻辑
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── id_photo.py      # 证件照相关路由
│   │   ├── inpaint.py       # 瑕疵修复路由
│   │   ├── enhance.py       # 图像增强路由
│   │   └── batch.py         # 批量处理路由
│   ├── services/
│   │   ├── __init__.py
│   │   ├── remove_bg.py     # 抠图服务逻辑
│   │   ├── inpaint.py       # 修复服务逻辑
│   │   └── enhance.py       # 增强服务逻辑
│   ├── models/
│   │   ├── __init__.py
│   │   ├── request.py       # 请求体 Pydantic 模型
│   │   └── response.py      # 响应体 Pydantic 模型
│   └── utils/
│       ├── __init__.py
│       ├── base64_util.py   # Base64 编解码工具
│       └── image_util.py    # 图片处理工具
└── tests/
    ├── __init__.py
    └── test_api.py
```

> 其他服务（language/document/reasoning）仿照此结构调整 `routers/` 和 `services/` 目录即可。



------



## 附录 A：模型缓存卷

为避免每个 FastAPI 容器重复从 HuggingFace 下载相同的基础模型文件，可共享挂载模型缓存卷：

```
docker volume create model-cache
# 挂载到各容器的 /root/.cache
```

| 模型 | 下载源 | 缓存位置 |
| ---- | ---- | ---- |
| rembg | HuggingFace / PyPI | /root/.cache/huggingface |
| SAM | HuggingFace | /root/.cache/huggingface |
| Real-ESRGAN | GitHub Releases | /root/.cache/torch/hub |
| Whisper | HuggingFace | /root/.cache/whisper |
| ChatTTS | HuggingFace / ModelScope | /root/.cache/huggingface |
| bge-large-zh | HuggingFace | /root/.cache/huggingface |

> 第一次启动时各服务会下载所需模型，之后重启不再重复下载。
