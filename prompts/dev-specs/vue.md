# Vue 3 前端开发规范



------



## 状态

🟢 已确认（2026-06-29）



## 移动端架构

```
┌─────────────────────────────┐
│        UniApp 壳子（APK）     │
│                              │
│  只做三件事：                  │
│  1. WebView 加载远程 H5       │
│  2. 桥接原生能力（相机等）     │
│  3. 其他什么都不管            │
│                              │
│  → H5 更新只需部署服务器      │
│  → 用户不重装 APK 自动生效    │
└──────────┬──────────────────┘
           │ WebView 加载
           ▼
┌─────────────────────────────┐
│    H5 业务代码（部署服务器）   │
│    https://your-domain.com   │
│                              │
│  所有功能页面都在这里：        │
│  证件照、变声器、TTS...       │
│                              │
│  基于若依 Office UniApp 移动端│
└─────────────────────────────┘
```

## 基础选型

| 项 | 选择 | 版本 | 说明 |
| ---- | ---- | ---- | ---- |
| 框架 | Vue 3 | 3.4+ | Composition API |
| 构建工具 | Vite | 5.x | — |
| 语言 | TypeScript | 5.x | 类型安全 |
| UI 库（移动端） | Wot Design Uni | 最新版 | 若依 Office 移动端自带 |
| UI 库（管理后台） | Element Plus | 2.x | 若依 Office 后台自带 |
| HTTP 客户端 | Axios | 1.7+ | 拦截器统一处理 |
| 状态管理 | Pinia | 2.x | Vue 3 官方推荐 |
| 路由 | Vue Router | 4.x | — |
| CSS | UnoCSS / SCSS | — | 若依自带方案 |



## 核心依赖

```json
{
  "dependencies": {
    "vue": "^3.4",
    "vue-router": "^4.3",
    "pinia": "^2.1",
    "axios": "^1.7"
  },
  "devDependencies": {
    "vite": "^5.4",
    "typescript": "^5.5",
    "@vitejs/plugin-vue": "^5.1"
  }
}
```

> 移动端和管理后台的具体依赖集以若依 Office 为准，新增功能不引入额外 UI 库。



## 目录结构

```
frontend/
├── mobile/                         ← H5 业务代码（部署服务器，壳子 WebView 加载）
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── api/                    ← API 接口封装
│       │   ├── request.ts          ← Axios 实例 + 拦截器
│       │   └── id-photo.ts         ← 证件照 API（按模块拆分文件）
│       ├── views/                  ← 业务页面
│       │   ├── id-photo/           ← 证件照
│       │   ├── voice-changer/      ← 变声器
│       │   └── ...
│       ├── components/             ← 公共组件
│       │   ├── image-uploader.vue  ← 图片上传
│       │   └── ...
│       ├── composables/            ← 组合函数（WebSocket hook 等）
│       │   └── useTaskNotify.ts    ← WebSocket 任务通知 hook
│       ├── stores/                 ← Pinia 状态
│       ├── utils/
│       └── router/
│
├── admin/                          ← 管理后台（PC 浏览器直接访问）
│   ├── package.json
│   └── src/
│       ├── api/
│       ├── views/                  ← 管理页面
│       │   ├── quota/              ← 额度管理
│       │   ├── task/               ← 任务监控
│       │   └── files/              ← 文件管理
│       └── ...
│
└── shell/                          ← UniApp 壳子工程（极少改动）
    └── ...                         ← 仅打包 APK 时使用
```



## Axios 封装标准

```typescript
// api/request.ts
import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
})

request.interceptors.request.use((config) => {
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  config.headers['X-Trace-Id'] = generateTraceId()
  return config
})

request.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data
    if (code !== 200) throw new Error(message)
    return data
  },
  (error) => Promise.reject(error)
)
```



## WebSocket 任务通知（与 SpringBoot 对齐）

前端提交任务后不轮询，走 WebSocket 等通知：

```typescript
// composables/useTaskNotify.ts
export function useTaskNotify(taskId: string) {
  const status = ref<'processing' | 'done' | 'failed'>('processing')
  const errorMsg = ref('')
  let ws: WebSocket

  onMounted(() => {
    ws = new WebSocket(`${WS_BASE}/ws/task`)
    ws.onopen = () => ws.send(JSON.stringify({
      action: 'subscribe',
      task_id: taskId
    }))
    ws.onmessage = (e) => {
      const { event, error } = JSON.parse(e.data)
      if (event === 'done')  status.value = 'done'
      if (event === 'failed') { status.value = 'failed'; errorMsg.value = error }
      ws.close()
    }
  })

  onUnmounted(() => ws?.close())

  return { status, errorMsg }
}
```

```typescript
// 页面中使用
const { taskId } = await api.submitIdPhoto(file)        // 1. 提交任务
const { status } = useTaskNotify(taskId)                 // 2. WebSocket 等通知
watch(status, async (s) => {
  if (s === 'done') {
    const result = await api.getTaskResult(taskId)       // 3. HTTP GET 拉结果
    showImage(result)
  }
})
```

## 页面组件规范

| 规范 | 说明 |
| ---- | ---- |
| 组件命名 | PascalCase |
| 组合式 API | `<script setup lang="ts">` |
| 文件上传 | 统一用 `image-uploader` 组件 |
| 提交任务 | 拿 taskId → WebSocket 等通知 → HTTP 拉结果 |
| 加载状态 | 提交按钮 loading + 处理中状态提示 |
| 错误处理 | `ElMessage` / `uni.showToast` |
| 实时功能 | `useTaskNotify` hook 管理 WebSocket 生命周期 |



## 已确认决策

| # | 决策 | 结论 |
| ---- | ---- | ---- |
| 1 | 移动端方案 | UniApp 壳子（APK 容器） + H5 业务代码（部署服务器） |
| 2 | 壳子职责 | 仅 WebView + 原生能力桥接，H5 能做的壳子不管 |
| 3 | 前端更新 | 部署 H5 即可，用户不重装 APK 自动生效 |
| 4 | 变声器前端 | WebSocket 透传到 FastAPI，前端只负责采集/播放 |
| 5 | 管理后台 | 复用若依现有后台布局，加菜单项 |
| 6 | 任务等待方案 | WebSocket 通知 + HTTP 拉取（与 SpringBoot 对齐） |
| 7 | Demo 阶段 | 先做移动端证件照页面，管理后台后面再加 |
