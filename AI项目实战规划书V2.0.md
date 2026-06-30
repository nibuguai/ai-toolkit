# AI 项目实战规划书（v2 优化版）

> 转型目标：Java后端 → AI应用开发工程师
> 核心优势：全栈工程能力 + 本地高配开发机
> 核心理念：**不做只会调API的人，做能独立交付AI产品的工程师**

---

## 一、架构总览

### 1.1 整体分层

┌─────────────────────────────────────────────────────────────┐ │ Vue 3 前端 (统一交互层) │ │ 统一上传 · 实时预览 · 参数调节 · 结果下载 │ └──────────────────────────┬──────────────────────────────────┘ │ HTTP ┌──────────────────────────▼──────────────────────────────────┐ │ Java Spring Boot (业务中枢) │ │ │ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐ │ │ │ API 网关 │ │ 业务编排 │ │ 任务队列 │ │ 用户/权限/日志 │ │ │ └──────────┘ └──────────┘ └──────────┘ └───────────────┘ │ └───────┬──────────┬──────────┬──────────┬────────────────────┘ │ │ │ │ ▼ ▼ ▼ ▼ ┌────────────┐┌──────────┐┌──────────┐┌────────────┐ │ 🎨 视觉服务 ││ 🔊 语言服务││ 📄 文档服务││ 🧠 推理服务 │ │ FastAPI ││ FastAPI ││ FastAPI ││ FastAPI │ │ ││ ││ ││ │ │ · 证件照 ││ · TTS ││ · 格式转换 ││ · 象棋引擎 │ │ · 抠图换背景 ││ · Whisper ││ · RAG ││ · 游戏助手 │ │ · 去水印 ││ · 音色克隆 ││ · PDF解析 ││ │ │ · 老照片修复 ││ ││ ││ │ │ · 批量处理 ││ ││ ││ │ │ ││ ││ ││ │ │ torch ││ torch ││ chroma ││ pikafish │ │ opencv ││ whisper ││ langchain ││ opencv │ │ rembg ││ chattts ││ pandoc ││ paddleocr │ │ sam ││ gpt-sovits││ pdf2docx ││ pyautogui │ │ esrgan ││ ││ ││ │ │ lama ││ ││ ││ │ └────────────┘└──────────┘└──────────┘└────────────┘ │ │ │ │ ▼ ▼ ▼ ▼ ┌─────────────────────────────────────────────────────────────┐ │ 本地基础设施 │ │ Ollama(Qwen/DeepSeek) · Chroma · Redis · SQLite · MinIO │ └─────────────────────────────────────────────────────────────┘

text

text

```
### 1.2 服务划分原则

| 原则 | 说明 |
|------|------|
| **依赖栈相似** | 都用 torch + opencv 的功能合并为一个服务，避免重复装依赖 |
| **领域内聚** | 一个服务内的功能有业务关联性，可共用中间产物 |
| **数量控制** | Python 服务控制在 3-5 个，不过度拆分 |
| **独立扩缩** | 每个服务独立 Docker 容器，可单独重启、单独扩容 |

### 1.3 Spring Boot 职责定义（面试重点）

Spring Boot **不是简单的请求转发**，它承担核心业务价值：

| 职责 | 具体内容 | 体现的能力 |
|------|---------|-----------|
| **API 网关** | 统一路由、鉴权(JWT)、限流、请求日志 | 系统安全设计 |
| **业务编排** | 串联多个 AI 服务完成复杂流程 | 微服务架构能力 |
| **异步任务** | 耗时任务(批量处理/视频转写)入队异步执行 | 并发与异步编程 |
| **用户体系** | 登录注册、使用配额、操作记录 | 企业级开发能力 |
| **结果缓存** | 相同输入缓存推理结果，减少重复调用 | 性能优化意识 |
| **定时调度** | 签到助手 cron、任务提醒 | 调度框架经验 |

**业务编排代码示例：**

```java
@Service
public class IDPhotoService {

    @Autowired
    private VisionServiceClient visionClient;

    /**
     * 证件照生成全流程：抠图 → 换背景 → 尺寸裁剪 → 排版冲印版
     * Spring Boot 负责流程编排，各步骤调用不同 AI 服务
     */
    @Async
    public CompletableFuture<IDPhotoResult> generate(
            MultipartFile photo, String bgColor, String size) {

        // Step 1: 调用视觉服务 - 智能抠图
        byte[] cutout = visionClient.removeBackground(photo.getBytes());

        // Step 2: 调用视觉服务 - 换纯色背景
        byte[] withBg = visionClient.changeBackground(cutout, bgColor);

        // Step 3: Java 本地处理 - 尺寸裁剪(标准证件照尺寸)
        byte[] resized = imageUtil.resize(withBg, IDPhotoSize.fromCode(size));

        // Step 4: Java 本地处理 - 多张排版到冲印版
        byte[] sheet = photoLayoutService.composePrintSheet(resized, size);

        // Step 5: 上传到 MinIO，返回下载链接
        String url = storageService.upload(sheet, "id-photo");

        return CompletableFuture.completedFuture(new IDPhotoResult(url));
    }
}
```

------

## 二、各服务 API 设计

### 2.1 视觉服务 (vision-service)



```
基础路径: /api/v1/vision

# 模块一：证件照
POST /id-photo/remove-bg       # 抠图（返回透明背景 PNG）
POST /id-photo/change-bg       # 换背景（传入抠图结果 + 背景色）
POST /id-photo/resize          # 尺寸调整（1寸/2寸/签证照等）
POST /id-photo/compose-sheet   # 冲印排版（多张排到5寸/6寸版面）

# 模块二：瑕疵去除
POST /inpaint/remove-object    # 去除指定区域物体（LaMa）
POST /inpaint/remove-watermark # 自动检测并去除水印
POST /restore/old-photo        # 老照片修复（清晰化 + 上色）

# 模块三：图像增强
POST /enhance/super-resolution # 超分辨率放大（Real-ESRGAN）
POST /enhance/face-restore     # 人脸修复（CodeFormer）

# 模块四：批量处理
POST /batch/process            # 批量处理（压缩/加水印/改尺寸/格式转换）
```

### 2.2 语言服务 (language-service)



```
基础路径: /api/v1/language

# TTS 文字配音
POST /tts/synthesize           # 文字转语音（ChatTTS，可选音色）
POST /tts/clone-voice          # 音色克隆（GPT-SoVITS，上传参考音频）

# 语音识别
POST /asr/transcribe           # 音频/视频 → 文字 + 时间戳（Whisper）
POST /asr/generate-subtitle    # 生成 SRT/VTT 字幕文件
```

### 2.3 文档服务 (document-service)

yaml

yaml

```
基础路径: /api/v1/document

# 格式转换
POST /convert/to-pdf           # Word/MD → PDF
POST /convert/to-word          # PDF → Word
POST /convert/to-markdown      # 任意格式 → Markdown

# RAG 知识库
POST /rag/upload               # 上传文档 → 切片 → 向量化 → 存储
POST /rag/query                # 提问 → 检索 → 大模型生成回答
DELETE /rag/documents/{id}     # 删除知识库文档
GET  /rag/documents            # 知识库文档列表
```

### 2.4 推理服务 (reasoning-service)

yaml

yaml

```
基础路径: /api/v1/reasoning

# 象棋 AI
POST /chess/analyze            # 传入 FEN 棋局 → 返回最佳着法 + 胜率
POST /chess/replay             # 上传棋谱 → 逐回合分析
WS   /chess/stream             # WebSocket 实时推送分析流

# RPA 自动化
POST /rpa/execute              # 执行自动化任务（签到/采集等）
GET  /rpa/tasks                # 任务列表
GET  /rpa/tasks/{id}/status    # 任务执行状态
```

------

## 三、项目路线图（按开发顺序编排）

### 开发策略：纵向打通 > 横向铺开

**核心思路：先把一个完整功能从 Vue → Spring Boot → FastAPI 全链路跑通， 再用已验证的架构横向复制到其他功能。**

text

text

```
Week 1-2:  搭骨架 + 第一个功能（证件照）全链路跑通
Week 3-4:  扩展视觉服务（抠图增强 + 去水印 + 老照片修复）
Week 5-6:  新建语言服务（TTS + Whisper），集成到 QQ 机器人
Week 7-8:  新建文档服务（格式转换 + RAG 知识库）
Week 9-12: 新建推理服务（象棋 AI / 游戏助手）
Week 13+:  功能打磨、整体优化、面试准备
```

------

### Phase 0：骨架搭建（3-5 天）

> **目标：搭建开发脚手架，后续所有功能在此基础上生长**

#### 需要做的事

text

text

```
1. Spring Boot 项目初始化
   ├── 多模块结构（api / service / common / model）
   ├── 统一响应封装（Result<T>）
   ├── 全局异常处理
   ├── HTTP 调用客户端（RestClient 调用 Python 服务）
   ├── interceptor/ # 拦截器
   │ ├── AuthInterceptor.java # 登录拦截（前期空实现，全部放行）
   │ └── TraceInterceptor.java # traceId 生成与注入 （日志的写入时候要设置该编码，响应也要带回该编码）
   ├── springboot整合mysql
   ├── spirngboot加日志
   └── 文件上传/下载基础接口（对接本地存储）

2. 第一个 FastAPI 服务（vision-service）初始化
   ├── FastAPI 项目结构（routers / services / models）
   ├── 统一响应格式
   ├── 健康检查接口
   ├── 加日志
   └── Dockerfile

3. Vue 3 前端初始化
   ├── Vite + Vue 3 + TypeScript
   ├── 路由配置
   ├── 统一请求封装（axios）
   ├── 加请求日志
   └── 基础布局（侧边栏导航 + 内容区）

4. Docker Compose 编排
   ├── spring-boot:8080
   ├── vision-service:8001
   ├── minio:9000
   └── 网络互通配置

5. 验证：浏览器访问 Vue → 上传文件 → Spring Boot → FastAPI
         → 返回处理结果 → 前端展示
```

#### 产出物

- 一个可运行的完整脚手架 （前后端可以使用**RuoYi-Vue-Plus** ）
- 后续所有项目只需在对应服务里加接口 + 前端加页面

------

### Phase 1：视觉服务 + 证件照全流程（2-3 周）

> **归属：vision-service** | 难度：⭐⭐ - ⭐⭐⭐ **里程碑：现场演示"生活照 → 标准证件照"全流程**

#### Sprint 1.1：核心链路（第一周）

| 功能         | 技术方案                             | 接口                       |
| ------------ | ------------------------------------ | -------------------------- |
| 智能抠图     | rembg（先跑通）→ 后期换 SAM 提升精度 | `POST /id-photo/remove-bg` |
| 换纯色背景   | PIL 合成（红/白/蓝）                 | `POST /id-photo/change-bg` |
| 标准尺寸裁剪 | Pillow 按像素精确裁剪                | `POST /id-photo/resize`    |

**前端页面：上传照片 → 选背景色 → 选尺寸 → 预览 → 下载**

#### Sprint 1.2：进阶功能（第二周）

| 功能       | 技术方案                                                  | 接口                           |
| ---------- | --------------------------------------------------------- | ------------------------------ |
| 冲印排版   | Java 图形库（BufferedImage）将多张证件照排版到 5/6 寸版面 | `POST /id-photo/compose-sheet` |
| 头发丝精抠 | 换用 MODNet 或 SAM，对比效果                              | 复用 remove-bg 接口            |

#### Sprint 1.3：瑕疵修复（第三周）

| 功能       | 技术方案                           | 接口                             |
| ---------- | ---------------------------------- | -------------------------------- |
| 去除水印   | LaMa inpainting                    | `POST /inpaint/remove-watermark` |
| 去除路人   | 用户框选区域 → LaMa 填充           | `POST /inpaint/remove-object`    |
| 老照片修复 | Real-ESRGAN 清晰化 + DeOldify 上色 | `POST /restore/old-photo`        |

**技术要点：**

- LaMa 模型约 200MB，首次加载慢 → 建议服务启动时预加载到显存
- Real-ESRGAN 大图处理很吃显存 → 做好分块处理(tiling)
- 前端框选去除区域：用 Canvas 实现矩形/自由选区

#### Sprint 1.4：图像增强与批量处理（第三周末）

| 功能         | 技术方案          | 接口                             |
| ------------ | ----------------- | -------------------------------- |
| 超分辨率放大 | Real-ESRGAN 2x/4x | `POST /enhance/super-resolution` |
| 人脸修复     | CodeFormer        | `POST /enhance/face-restore`     |
| 批量处理     | Pillow + 任务队列 | `POST /batch/process`            |

------

### Phase 2：语言服务（1-2 周）

> **归属：language-service** | 难度：⭐ - ⭐⭐ **里程碑：语音输入文字 → 用克隆音色朗读任意文本**

#### Sprint 2.1：TTS 文字配音

| 功能         | 技术方案                           | 接口                    |
| ------------ | ---------------------------------- | ----------------------- |
| 基础语音合成 | ChatTTS（多种预设音色）            | `POST /tts/synthesize`  |
| 音色克隆     | GPT-SoVITS（上传 3-10 秒参考音频） | `POST /tts/clone-voice` |

**技术要点：**

- ChatTTS 支持随机音色种子，前端可提供"换一个音色"按钮
- GPT-SoVITS 参考音频建议 5-15 秒，清晰无杂音
- 生成的音频返回方式：短文本直接返回 base64，长文本返回文件流

#### Sprint 2.2：语音识别

| 功能       | 技术方案                                 | 接口                          |
| ---------- | ---------------------------------------- | ----------------------------- |
| 音频转文字 | OpenAI Whisper（本地 medium/small 模型） | `POST /asr/transcribe`        |
| 字幕生成   | Whisper 时间戳 → SRT 格式化              | `POST /asr/generate-subtitle` |

**技术要点：**

- Whisper small 模型约 500MB，medium 约 1.5GB，按显存选择
- 长音频（>25分钟）需要分片处理，否则显存溢出
- 中文场景优先用 whisper-medium 或 faster-whisper

#### 集成点

- QQ 机器人：语音消息 → Whisper 转文字 → 大模型回复 → ChatTTS 语音回复
- 象棋分析服务：分析结果 → TTS 语音播报棋理解释

------

### Phase 3：文档服务（2-3 周）

> **归属：document-service** | 难度：⭐⭐⭐ **里程碑：上传企业文档 → 基于文档精准问答，回答可溯源**

#### Sprint 3.1：格式转换

| 功能                | 技术方案                            | 接口                        |
| ------------------- | ----------------------------------- | --------------------------- |
| Word → PDF          | LibreOffice headless 模式           | `POST /convert/to-pdf`      |
| PDF → Word          | pdf2docx（Python 库）               | `POST /convert/to-word`     |
| 任意格式 → Markdown | Pandoc（简单文档）+ LLM（复杂文档） | `POST /convert/to-markdown` |

**技术要点：**

- LibreOffice 需要安装在 Docker 镜像中：`apt install libreoffice-core`
- 复杂 PDF（扫描件/图片型）→ 先 OCR（PaddleOCR）再转 Markdown
- Spring Boot 层做：文件类型校验、转换任务队列、转换结果缓存

#### Sprint 3.2：RAG 知识库

| 功能           | 技术方案                                       | 接口               |
| -------------- | ---------------------------------------------- | ------------------ |
| 文档上传与解析 | LangChain DocumentLoaders                      | `POST /rag/upload` |
| 文档切片       | RecursiveCharacterTextSplitter（512 token/块） | 内部处理           |
| 向量化存储     | bge-large-zh + Chroma                          | 内部处理           |
| 检索问答       | 相似度检索 Top-K → LLM 生成回答                | `POST /rag/query`  |

**RAG 完整流程：**

text

text

```
上传文档
  │
  ▼
解析提取文本（PDF→文本 / Word→文本 / MD→文本）
  │
  ▼
文本切片（每块 512 tokens，重叠 50 tokens）
  │
  ▼
向量化（bge-large-zh 编码为 1024 维向量）
  │
  ▼
存入 Chroma 向量数据库
  │
  ═══════════════ 用户提问时 ═══════════════
  │
  ▼
用户问题 → bge-large-zh 编码 → Chroma 相似度检索 Top-5
  │
  ▼
拼接 Prompt = "基于以下资料回答问题：\n{检索片段}\n\n问题：{用户问题}"
  │
  ▼
调用 Ollama/Qwen 生成回答（标注引用来源）
  │
  ▼
返回回答 + 引用的文档片段（可溯源）
```

**Spring Boot 层职责：**

- 管理知识库（增删改查文档列表）
- 记录问答历史
- 控制并发（多人同时查询时排队）
- 对重复问题做缓存

------

### Phase 4：推理服务（3-4 周）

> **归属：reasoning-service** | 难度：⭐⭐⭐⭐ **里程碑：摆一个残局 → AI 分析最佳着法 + 胜率 + 语音播报**

#### Sprint 4.1：象棋 AI 分析

| 功能         | 技术方案                         | 接口                  |
| ------------ | -------------------------------- | --------------------- |
| 棋盘界面     | Vue 棋盘组件（SVG/Canvas 绘制）  | 前端                  |
| 最佳着法分析 | Pikafish 引擎（UCI 协议通信）    | `POST /chess/analyze` |
| 胜率曲线     | Pikafish 多步推演 → 计算各步胜率 | 含在 analyze 返回中   |
| 棋理解释     | 分析结果 → LLM 生成自然语言解释  | 调用 Ollama           |
| 语音播报     | 分析文字 → language-service TTS  | 调用语言服务          |
| 棋谱复盘     | 上传 PGN/XQF 棋谱 → 逐回合分析   | `POST /chess/replay`  |

**技术架构：**

text

text

```
Vue 棋盘
  │ 用户摆棋 / 上传棋谱
  ▼
Spring Boot (业务层)
  │ 棋谱解析 · 引擎调度 · 结果缓存
  ▼
reasoning-service (FastAPI)
  │
  ├── Pikafish 引擎（CPU，经典搜索算法）
  │     └── 返回：最佳着法 + 胜率 + 搜索深度
  │
  └── Ollama/Qwen（LLM 棋理解释）
        └── 输入：引擎分析结果
        └── 输出：人类可读的棋理分析文字

  ▼
language-service (TTS)
  └── 将棋理文字转为语音播报
```

**技术要点：**

- Pikafish 使用 UCI 协议，通过 stdin/stdout 通信，FastAPI 用 subprocess 管理
- 搜索深度建议 15-20 层，CPU 推理 2-5 秒可出结果
- WebSocket 推送分析进度（搜索中实时更新胜率变化）
- Vue 棋盘参考 chessground 库改造为中国象棋版本

#### Sprint 4.2：游戏助手（可选）

| 功能     | 技术方案                       | 接口                |
| -------- | ------------------------------ | ------------------- |
| 屏幕感知 | OpenCV 模板匹配 + PaddleOCR    | 内部                |
| 决策引擎 | Python 状态机                  | 内部                |
| 自动操作 | PyAutoGUI（PC）/ ADB（模拟器） | `POST /rpa/execute` |

------

### Phase 5：横切面功能（持续迭代）

#### 5.1 QQ 机器人增强（归属：AstrBot）

text

text

```
已有能力：基础对话 + 向量知识库
待新增：
├── 接入 vision-service：发图自动识别 / 证件照制作
├── 接入 language-service：语音消息转文字 / 文字回复转语音
├── 接入 document-service：发文档自动入库 / @机器人提问
├── 接入 reasoning-service：发棋局图片 → 自动摆盘分析
└── Agent 工具调用：MCP 协议集成高铁/机票查询
```

#### 5.2 高铁 & 机票查询（归属：新建 mcp-tools 或并入 reasoning-service）

| 功能     | 技术方案                            |
| -------- | ----------------------------------- |
| 高铁查询 | 封装 12306 公开查询接口             |
| 机票比价 | Amadeus 免费 API                    |
| 协议封装 | MCP 协议，接入 LobeChat / QQ 机器人 |

#### 5.3 网页签到 & RPA（归属：reasoning-service）

| 功能     | 技术方案               |
| -------- | ---------------------- |
| 自动签到 | Selenium 网页自动化    |
| 定时触发 | Spring Boot @Scheduled |

#### 5.4 生活小工具（归属：并入对应服务或新建 tools-service）

| 功能              | 归属服务                                |
| ----------------- | --------------------------------------- |
| AI 起名/塔罗/星座 | document-service（调 LLM）              |
| 家庭语音备忘录    | language-service（Whisper + TTS + LLM） |
| 摸鱼小工具        | 纯前端，无需后端                        |

------

## 四、技术栈总览

### 4.1 分层技术选型

| 层级            | 技术                        | 版本建议      | 说明                    |
| --------------- | --------------------------- | ------------- | ----------------------- |
| **前端**        | Vue 3 + Vite + TypeScript   | Vue 3.4+      | 所有项目统一前端        |
| **业务后端**    | Java Spring Boot            | 3.2+ / JDK 21 | 业务中枢                |
| **AI 服务框架** | Python FastAPI              | 0.110+        | 3-4 个独立服务          |
| **服务间通信**  | HTTP（REST）→ 后期可换 gRPC | -             | 开发阶段 REST 够用      |
| **异步任务**    | Spring @Async + Redis 队列  | -             | 耗时任务异步化          |
| **对象存储**    | MinIO（本地 S3）            | -             | 文件/图片/音频统一存储  |
| **向量数据库**  | Chroma                      | -             | RAG 知识库              |
| **缓存**        | Redis                       | -             | 推理结果缓存、会话缓存  |
| **关系数据库**  | MySQL / PostgreSQL          | -             | 用户、任务、日志        |
| **容器化**      | Docker + Docker Compose     | -             | 一键启动全套服务        |
| **反向代理**    | Nginx                       | -             | 前端静态资源 + API 转发 |

### 4.2 AI 模型选型

| 能力           | 模型                | 显存需求 | 说明                           |
| -------------- | ------------------- | -------- | ------------------------------ |
| **抠图**       | rembg → SAM         | 2-4 GB   | rembg 快但精度一般，SAM 精度高 |
| **图像修复**   | LaMa                | 2 GB     | 去水印/去路人                  |
| **超分辨率**   | Real-ESRGAN         | 4-6 GB   | 图片清晰化放大                 |
| **人脸修复**   | CodeFormer          | 2-3 GB   | 模糊人脸修复                   |
| **语音合成**   | ChatTTS             | 2-4 GB   | 基础 TTS                       |
| **音色克隆**   | GPT-SoVITS          | 4-8 GB   | 高质量音色克隆                 |
| **语音识别**   | Whisper medium      | 2-3 GB   | 音频转文字                     |
| **Embedding**  | bge-large-zh        | 2 GB     | RAG 文档向量化                 |
| **大语言模型** | Qwen2.5-7B (Ollama) | 6-8 GB   | 对话、RAG、棋理解释            |
| **象棋引擎**   | Pikafish            | CPU      | 无需 GPU                       |

> 显存管理建议：不是所有模型同时加载，按需加载或用 Ollama 统一管理 LLM， 其他模型在 FastAPI 服务启动时按需加载。

------

## 五、Docker Compose 编排示例

yaml

yaml

```
version: '3.8'

services:
  # ============ 基础设施 ============
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/usr/share/nginx/html
    depends_on:
      - spring-boot

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: ai_platform
    volumes:
      - mysql-data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio-data:/data

  # ============ 业务中枢 ============
  spring-boot:
    build: ./backend-java
    ports:
      - "8080:8080"
    environment:
      - VISION_SERVICE_URL=http://vision-service:8001
      - LANGUAGE_SERVICE_URL=http://language-service:8002
      - DOCUMENT_SERVICE_URL=http://document-service:8003
      - REASONING_SERVICE_URL=http://reasoning-service:8004
      - REDIS_HOST=redis
      - MYSQL_HOST=mysql
    depends_on:
      - mysql
      - redis
      - minio
      - vision-service
      - language-service

  # ============ AI 服务层 ============
  vision-service:
    build: ./services/vision-service
    ports:
      - "8001:8001"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - model-cache:/root/.cache  # 模型缓存持久化

  language-service:
    build: ./services/language-service
    ports:
      - "8002:8002"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - model-cache:/root/.cache

  document-service:
    build: ./services/document-service
    ports:
      - "8003:8003"
    # RAG 服务对 GPU 需求较低，可先不分配

  reasoning-service:
    build: ./services/reasoning-service
    ports:
      - "8004:8004"

volumes:
  mysql-data:
  minio-data:
  model-cache:  # 共享模型缓存，避免重复下载
```

------

## 六、项目与服务归属总览

| #    | 项目                     | 归属服务          | 阶段    | 难度 | 预计耗时 |
| ---- | ------------------------ | ----------------- | ------- | ---- | -------- |
| 0    | 骨架搭建                 | 全部              | Phase 0 | ⭐⭐   | 3-5 天   |
| 1    | 证件照全流程             | vision-service    | Phase 1 | ⭐⭐   | 1 周     |
| 2    | 抠图增强 + 去水印 + 修复 | vision-service    | Phase 1 | ⭐⭐⭐  | 2 周     |
| 3    | 图像增强 + 批量处理      | vision-service    | Phase 1 | ⭐⭐   | 3 天     |
| 4    | TTS 文字配音             | language-service  | Phase 2 | ⭐    | 3 天     |
| 5    | 语音识别 + 字幕生成      | language-service  | Phase 2 | ⭐⭐   | 4 天     |
| 6    | 格式转换                 | document-service  | Phase 3 | ⭐⭐⭐  | 1 周     |
| 7    | RAG 知识库               | document-service  | Phase 3 | ⭐⭐⭐  | 1-2 周   |
| 8    | 象棋 AI 分析             | reasoning-service | Phase 4 | ⭐⭐⭐⭐ | 2-3 周   |
| 9    | 游戏助手                 | reasoning-service | Phase 4 | ⭐⭐⭐⭐ | 2 周     |
| 10   | QQ 机器人增强            | AstrBot + 各服务  | Phase 5 | ⭐⭐⭐  | 持续     |
| 11   | 高铁机票查询             | tools-service     | Phase 5 | ⭐⭐   | 1 周     |
| 12   | 生活小工具               | 各服务 / 前端     | Phase 5 | ⭐-⭐⭐ | 持续     |

------

## 七、阶段性检验标准

### Phase 1 完成标志

-  上传生活照 → 证件照全流程跑通（抠图 + 换背景 + 裁剪 + 排版）
-  去水印 / 去路人 / 老照片修复至少 2 个功能可演示
-  Spring Boot 业务编排代码清晰，不是简单转发
-  Docker Compose 一键启动

### Phase 2 完成标志

-  输入文字 → 生成语音，支持 3+ 种音色
-  上传参考音频 → 克隆音色 → 用该音色读新文本
-  上传音频/视频 → 生成 SRT 字幕文件
-  TTS 已集成到至少一个其他项目（QQ 机器人或象棋）

### Phase 3 完成标志

-  PDF/Word/Markdown 互转，至少覆盖 5 种转换路径
-  上传 10+ 份文档到知识库 → 基于文档精准问答
-  回答附带引用来源（第几份文档第几段）
-  RAG 检索精度可用（Top-5 命中率 > 80%）

### Phase 4 完成标志

-  棋盘界面可手动摆棋
-  AI 分析返回最佳着法 + 胜率 + 文字棋理解释
-  棋理分析可语音播报（集成 TTS）
-  棋谱复盘功能可演示

### 全部完成标志（面试准备）

-  所有服务 Docker Compose 一键启动
-  能在 5 分钟内完整演示 3 个核心项目
-  每个项目能讲清：技术选型理由 + 遇到的难点 + 如何解决
-  Spring Boot 层有真实业务逻辑（编排、异步、缓存），不是空壳
-  GitHub 有完整 README + 架构图 + 效果截图

------

## 八、面试叙事建议

面试时不要逐个项目罗列，而是用**一条线串起来**：

> "我做了一个 **AI 能力平台**，架构是这样的：
>
> 前端统一用 Vue 3，业务层用 Spring Boot 做编排和调度， 底层有 4 个 AI 微服务分别负责视觉、语言、文档、推理能力。
>
> 我在 Spring Boot 层做了异步任务队列（耗时的图片批量处理不会阻塞接口）、 结果缓存（相同参数的推理不重复计算）、多步骤业务编排（比如证件照流程串联了抠图、换背景、裁剪三个AI步骤）。
>
> 我印象最深的一个挑战是 RAG 检索精度的问题， 最初文档切片太大导致检索不准，后来调整为 512 tokens 的切片 + 50 tokens 重叠， 配合 bge-large-zh 做向量化，命中率从 60% 提升到 85%......"

text

text

```
---

## 这版优化的核心变化

| 维度 | v1 原版 | v2 优化版 |
|------|---------|----------|
| **服务划分** | 按项目列表可能拆 10+ 个服务 | 按领域合并为 3-4 个服务 |
| **Spring Boot 定位** | 未明确，容易变成空壳转发 | 明确 6 大职责，有代码示例 |
| **开发顺序** | 按难度线性排列，易铺开难收拢 | 纵向优先，有阶段性里程碑 |
| **API 设计** | 无 | 每个服务有完整的接口定义 |
| **可执行性** | "预计 3-4 周"较笼统 | 拆到 Sprint 级别，每个 Sprint 有明确产出 |
| **面试准备** | 无 | 有叙事框架和检验标准 |
| **基础设施** | 未涉及 | Docker Compose、MinIO、Redis 全部规划 |
| **显存管理** | 未涉及 | 各模型显存需求一览 + 按需加载建议 |

你可以基于这个版本，根据自己的实际情况调整优先级和时间安排。有哪个部分想进一步细化，随时说。
```