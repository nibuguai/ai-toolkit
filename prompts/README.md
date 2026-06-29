# 提示词库

> 所有提示词在这里统一管理。**开发前先确认提示词，锁定后再开始写代码。**



------



## 两类提示词



```
prompts/
│
├── dev-specs/                  ← 第一类：开发规范（告诉 AI 怎么写代码）
│   ├── springboot.md           ← SpringBoot 技术栈、依赖、项目结构、编码规范
│   ├── fastapi.md              ← FastAPI 技术栈、依赖、项目结构、编码规范
│   ├── vue.md                  ← Vue 3 技术栈、UI 库、组件规范
│   └── docker.md               ← Dockerfile 规范、compose 编排规范
│
├── document-service/           ← 第二类：LLM 运行时提示词
│   ├── convert.md              ← 复杂文档 → Markdown
│   └── rag.md                  ← RAG 检索问答
│
├── reasoning-service/          ← 第二类：LLM 运行时提示词
│   └── chess.md                ← 象棋棋理解释
│
├── .template-dev-spec.md       ← 开发规范模板
└── .template-llm-prompt.md     ← LLM 提示词模板
```



| 类型 | 目录 | 作用 | 谁用 |
| ---- | ---- | ---- | ---- |
| **开发规范** | `dev-specs/` | 约束用什么技术、什么库、代码怎么组织 | 开发者 + AI 编辑器 |
| **LLM 提示词** | 各服务目录 | 控制 LLM 在运行时的行为和输出 | 应用调用 LLM 时传入 |



------



## 使用流程

```
1. 确定要开发哪个模块
      │
      ▼
2. 确认开发规范（dev-specs/ 下对应文件）
   → 用什么版本、什么库、什么结构
      │
      ▼
3. 如果要调 LLM，确认 LLM 提示词（服务目录下）
   → System Prompt、User Prompt、输出格式
      │
      ▼
4. 两者都锁定（状态改为 🟢）后开始写代码
```



------



## 状态一览



### 开发规范

| 模块 | 状态 | 说明 |
| ---- | ---- | ---- |
| SpringBoot | 🟢 | 技术栈、依赖、项目结构、通信方案 |
| FastAPI | 🟢 | 技术栈、Demo 策略、workers、通信格式 |
| Vue 3 | 🟢 | 移动端架构、WebSocket 通知、组件规范 |
| Docker | 🟢 | 镜像选型、Demo 简化、安全规范 |

### LLM 运行时提示词

| 服务 | 功能 | 状态 |
| ---- | ---- | ---- |
| document-service | 复杂文档转 Markdown | 🟡 |
| document-service | RAG 问答 | 🟡 |
| reasoning-service | 象棋棋理解释 | 🟡 |

> 🟡 = 待讨论确认，🟢 = 已确认锁定，🔴 = 暂时搁置
