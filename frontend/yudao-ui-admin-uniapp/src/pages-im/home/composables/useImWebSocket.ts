// IM 实时链路：复用 yudao 内置 /infra/ws 通道（帧 type=im-notification）
// 仅处理普通私聊/群聊消息：写本地库 + 更新会话列表 + 广播 im:message 给打开的聊天页
// 已读/回执/撤回/好友群通知等暂不在此处理（会话列表靠下次拉取兜底）

import { useTokenStore } from '@/store/token'
import { getEnvBaseUrlRoot } from '@/utils'
import { ImConversationType, ImMessageType } from '@/utils/constants'
import { useImConversations } from './useImConversations'

/** IM 通知帧 type */
const IM_NOTIFICATION = 'im-notification'
/** 普通消息（文本/图片/语音/视频/文件/合并/名片/表情/频道素材） */
const NORMAL_MESSAGE_TYPES = new Set<number>([
  ImMessageType.TEXT,
  ImMessageType.IMAGE,
  ImMessageType.VOICE,
  ImMessageType.VIDEO,
  ImMessageType.FILE,
  ImMessageType.MERGE,
  ImMessageType.CARD,
  ImMessageType.FACE,
  ImMessageType.MATERIAL,
])

let socketTask: UniApp.SocketTask | null = null
let connected = false
let manualClosed = false
let reconnectAttempts = 0
let resyncOnReopen = false // 断线重连成功后需补拉一次，补齐断线期间漏收的消息
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

/** 拼接 ws 地址 */
function buildUrl(): string {
  const wsBase = getEnvBaseUrlRoot().replace('http', 'ws')
  const tokenStore = useTokenStore()
  const tokenInfo = tokenStore.tokenInfo as any
  const token = tokenInfo?.refreshToken || tokenStore.updateNowTime().validToken
  return `${wsBase}/infra/ws?token=${token}`
}

/** 启动心跳 */
function startHeartbeat() {
  stopHeartbeat()
  heartbeatTimer = setInterval(() => {
    if (socketTask && connected) {
      socketTask.send({ data: 'ping', fail: () => {} })
    }
  }, 30000)
}

/** 停止心跳 */
function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

/** 断线重连（指数退避，封顶 30s） */
function scheduleReconnect() {
  if (manualClosed || reconnectTimer) {
    return
  }
  reconnectAttempts++
  const delay = Math.min(1000 * 2 ** Math.min(reconnectAttempts, 5), 30000)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connectImWebSocket()
  }, delay)
}

/** 处理收到的帧 */
async function handleFrame(data: string) {
  if (!data || data === 'pong') {
    return
  }
  let frame: { type?: string, content?: string }
  try {
    frame = JSON.parse(data)
  } catch {
    return
  }
  if (frame.type !== IM_NOTIFICATION || !frame.content) {
    return
  }
  let notification: { conversationType?: number, contentType?: number, payload?: any }
  try {
    notification = JSON.parse(frame.content)
  } catch {
    return
  }
  const { conversationType, contentType, payload } = notification
  if (!payload || contentType == null || conversationType == null) {
    return
  }
  // 仅处理私聊/群聊的普通消息，其余（已读/回执/撤回/通知）暂不实时处理
  if (conversationType !== ImConversationType.PRIVATE && conversationType !== ImConversationType.GROUP) {
    return
  }
  if (!NORMAL_MESSAGE_TYPES.has(contentType)) {
    return
  }
  const { buildIncomingMessage, applyIncomingMessage } = useImConversations()
  const message = buildIncomingMessage(conversationType, { ...payload, type: contentType })
  if (!message) {
    return
  }
  await applyIncomingMessage(message)
  // 广播给聊天页（若正打开该会话则追加气泡）
  uni.$emit('im:message', { message, payload: { ...payload, type: contentType }, conversationType })
}

/** 建立连接（幂等） */
export function connectImWebSocket() {
  if (socketTask && connected) {
    return
  }
  manualClosed = false
  const url = buildUrl()
  socketTask = uni.connectSocket({ url, fail: () => scheduleReconnect() })
  if (!socketTask) {
    scheduleReconnect()
    return
  }
  socketTask.onOpen(() => {
    connected = true
    reconnectAttempts = 0
    startHeartbeat()
    // 断线重连成功后补拉一次离线消息（对齐 PC：连接就绪即同步），补齐断线期间漏收的消息
    if (resyncOnReopen) {
      resyncOnReopen = false
      const { isLoaded, load } = useImConversations()
      if (isLoaded()) {
        load()
      }
    }
  })
  socketTask.onMessage((res) => {
    handleFrame(res.data as string)
  })
  socketTask.onClose(() => {
    connected = false
    socketTask = null
    stopHeartbeat()
    resyncOnReopen = true
    scheduleReconnect()
  })
  socketTask.onError(() => {
    connected = false
    socketTask?.close({})
  })
}

/** 主动断开（退出登录/离开 IM 时调用） */
export function disconnectImWebSocket() {
  manualClosed = true
  stopHeartbeat()
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  socketTask?.close({})
  socketTask = null
  connected = false
}
