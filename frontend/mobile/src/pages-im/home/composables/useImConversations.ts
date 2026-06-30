// IM 会话列表：基于本地 DB 聚合会话（MVP：私聊 + 群聊，本地未读，暂不含频道/实时）
// 思路对齐 PC 端：会话由消息流客户端聚合，不走服务端会话接口

import type { ImFriendRespVO } from '@/api/im/friend'
import type { ImGroupRespVO } from '@/api/im/group'
import type { ConversationDO, ConversationReadDO, MessageDO } from '@/pages-im/home/db'
import { ref } from 'vue'
import { getMyFriendList } from '@/api/im/friend'
import { getMyGroupList } from '@/api/im/group'
import { pullGroupMessages } from '@/api/im/message/group'
import { pullPrivateMessages } from '@/api/im/message/private'
import {
  getClientConversationId,
  getImDb,
  getServerMessageKey,
  ImSettingKeys,
  initImDb,
} from '@/pages-im/home/db'
import { useUserStore } from '@/store/user'
import { ImConversationType } from '@/utils/constants'
import { getMessageSummary } from '@/pages-im/utils/message'

const PULL_PAGE_SIZE = 100

const conversations = ref<ConversationDO[]>([]) // 会话列表（已排序）
const loading = ref(false) // 加载状态
let loaded = false // 是否已首次加载

/** 当前登录用户 id */
function selfUserId(): number {
  return useUserStore().userInfo.userId
}

/** 解析 sendTime 字符串为毫秒 */
function toSendTimeMs(sendTime: string): number {
  const ms = new Date(sendTime).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

/** 私聊消息 VO 转本地消息 */
function mapPrivateMessage(vo: any, self: number): MessageDO {
  const selfSend = vo.senderId === self
  const targetId = selfSend ? vo.receiverId : vo.senderId
  const clientConversationId = getClientConversationId(ImConversationType.PRIVATE, targetId)
  return {
    messageKey: getServerMessageKey(ImConversationType.PRIVATE, vo.id),
    clientConversationId,
    conversationType: ImConversationType.PRIVATE,
    id: vo.id,
    clientMessageId: vo.clientMessageId,
    type: vo.type,
    content: vo.content,
    status: vo.status,
    sendTime: toSendTimeMs(vo.sendTime),
    senderId: vo.senderId,
    targetId,
    selfSend,
  }
}

/** 群聊消息 VO 转本地消息 */
function mapGroupMessage(vo: any, self: number): MessageDO {
  const clientConversationId = getClientConversationId(ImConversationType.GROUP, vo.groupId)
  return {
    messageKey: getServerMessageKey(ImConversationType.GROUP, vo.id),
    clientConversationId,
    conversationType: ImConversationType.GROUP,
    id: vo.id,
    clientMessageId: vo.clientMessageId,
    type: vo.type,
    content: vo.content,
    status: vo.status,
    sendTime: toSendTimeMs(vo.sendTime),
    senderId: vo.senderId,
    targetId: vo.groupId,
    selfSend: vo.senderId === self,
    atUserIds: vo.atUserIds,
    receiverUserIds: vo.receiverUserIds,
    receiptStatus: vo.receiptStatus,
    readCount: vo.readCount,
  }
}

/** 增量拉取某一类型消息并写入本地 DB */
async function pullMessages(
  cursorKey: string,
  fetchPage: (minId: number) => Promise<any[]>,
  mapper: (vo: any, self: number) => MessageDO,
) {
  const db = getImDb()
  const self = selfUserId()
  let minId = (await db.getSetting<number>(cursorKey)) || 0
  // 循环拉取直到不足一页
  for (let guard = 0; guard < 50; guard++) {
    const list = await fetchPage(minId)
    if (!list?.length) {
      break
    }
    const messages = list.map(vo => mapper(vo, self))
    await db.bulkPut<MessageDO>('messages', messages)
    minId = list.reduce((max, vo) => Math.max(max, vo.id || 0), minId)
    await db.setSetting(cursorKey, minId)
    if (list.length < PULL_PAGE_SIZE) {
      break
    }
  }
}

/** 根据本地消息重建会话摘要 */
async function rebuildConversations(
  friendMap: Map<number, ImFriendRespVO>,
  groupMap: Map<number, ImGroupRespVO>,
): Promise<ConversationDO[]> {
  const db = getImDb()
  const [messages, reads, existing] = await Promise.all([
    db.getAll<MessageDO>('messages'),
    db.getAll<ConversationReadDO>('conversationReads'),
    db.getAll<ConversationDO>('conversations'),
  ])
  const readMap = new Map(reads.map(item => [item.clientConversationId, item]))
  const existingMap = new Map(existing.map(item => [item.clientConversationId, item]))

  // 按会话分组
  const grouped = new Map<string, MessageDO[]>()
  messages.forEach((message) => {
    const list = grouped.get(message.clientConversationId) || []
    list.push(message)
    grouped.set(message.clientConversationId, list)
  })

  const result: ConversationDO[] = []
  const newReads: ConversationReadDO[] = []
  grouped.forEach((list, clientConversationId) => {
    list.sort((a, b) => a.sendTime - b.sendTime)
    const last = list[list.length - 1]
    const type = last.conversationType
    const targetId = last.targetId

    // 名称 / 头像：优先复用已有会话，其次好友 / 群
    const old = existingMap.get(clientConversationId)
    let name = old?.name || ''
    let avatar = old?.avatar || ''
    if (type === ImConversationType.PRIVATE) {
      const friend = friendMap.get(targetId)
      name = friend ? (friend.displayName || friend.nickname || `用户 ${targetId}`) : (name || `用户 ${targetId}`)
      avatar = friend?.avatar || avatar
    } else if (type === ImConversationType.GROUP) {
      const group = groupMap.get(targetId)
      name = group?.name || name || `群 ${targetId}`
      avatar = group?.avatar || avatar
    }

    // 读位置：首次见到的会话把历史标记为已读，避免一进来全是未读
    let readMessageId = readMap.get(clientConversationId)?.messageId
    if (readMessageId == null) {
      readMessageId = last.id || 0
      newReads.push({
        clientConversationId,
        conversationType: type,
        targetId,
        messageId: readMessageId,
        updateTime: Date.now(),
      })
    }
    const unreadCount = list.filter(item => !item.selfSend && (item.id || 0) > readMessageId!).length

    result.push({
      clientConversationId,
      type,
      targetId,
      name,
      avatar,
      unreadCount,
      lastContent: getMessageSummary(last.type, last.content),
      lastSendTime: last.sendTime,
      lastSenderId: last.senderId,
      lastMessageType: last.type,
      lastMessageId: last.id,
      lastSelfSend: last.selfSend,
      top: old?.top,
      silent: old?.silent,
      deleted: old?.deleted,
    })
  })

  // 持久化
  if (newReads.length) {
    await db.bulkPut<ConversationReadDO>('conversationReads', newReads)
  }
  await db.bulkPut<ConversationDO>('conversations', result)
  return result
}

/** 会话排序：置顶优先，再按最近时间倒序 */
function sortConversations(list: ConversationDO[]): ConversationDO[] {
  return list
    .filter(item => !item.deleted)
    .sort((a, b) => {
      if (!!a.top !== !!b.top) {
        return a.top ? -1 : 1
      }
      return (b.lastSendTime || 0) - (a.lastSendTime || 0)
    })
}

/** 加载会话列表（拉取 + 聚合） */
async function load() {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    await initImDb()
    const self = selfUserId()
    const [friends, groups] = await Promise.all([getMyFriendList(), getMyGroupList()])
    const friendMap = new Map(friends.map(item => [item.friendUserId, item]))
    const groupMap = new Map(groups.map(item => [item.id, item]))

    await pullMessages(
      ImSettingKeys.privateMessageMaxId,
      minId => pullPrivateMessages({ minId, size: PULL_PAGE_SIZE }),
      vo => mapPrivateMessage(vo, self),
    )
    await pullMessages(
      ImSettingKeys.groupMessageMaxId,
      minId => pullGroupMessages({ minId, size: PULL_PAGE_SIZE }),
      vo => mapGroupMessage(vo, self),
    )

    const list = await rebuildConversations(friendMap, groupMap)
    conversations.value = sortConversations(list)
    loaded = true
  } finally {
    loading.value = false
  }
}

const activeClientConversationId = ref('') // 当前打开的会话（实时消息不计未读）

/** 设置/清除当前打开的会话 */
function setActiveConversation(type: number | null, targetId?: number) {
  activeClientConversationId.value = type && targetId ? getClientConversationId(type, targetId) : ''
}

/** 把通知 payload 转成本地消息（仅私聊/群聊） */
function buildIncomingMessage(conversationType: number, payload: any): MessageDO | null {
  const self = selfUserId()
  if (conversationType === ImConversationType.PRIVATE) {
    return mapPrivateMessage(payload, self)
  }
  if (conversationType === ImConversationType.GROUP) {
    return mapGroupMessage(payload, self)
  }
  return null
}

/** 应用一条实时消息：写库 + 更新会话摘要/未读 + 重排 */
async function applyIncomingMessage(message: MessageDO) {
  await initImDb()
  const db = getImDb()
  await db.put<MessageDO>('messages', message)
  const ccid = message.clientConversationId
  let conv = conversations.value.find(item => item.clientConversationId === ccid)
  if (!conv) {
    conv = {
      clientConversationId: ccid,
      type: message.conversationType,
      targetId: message.targetId,
      name: message.conversationType === ImConversationType.GROUP ? `群 ${message.targetId}` : `用户 ${message.targetId}`,
      avatar: '',
      unreadCount: 0,
      lastContent: '',
      lastSendTime: 0,
    }
    conversations.value.push(conv)
  }
  conv.lastContent = getMessageSummary(message.type, message.content)
  conv.lastSendTime = message.sendTime
  conv.lastSenderId = message.senderId
  conv.lastMessageId = message.id
  conv.lastSelfSend = message.selfSend
  if (!message.selfSend && ccid !== activeClientConversationId.value) {
    conv.unreadCount = (conv.unreadCount || 0) + 1
  }
  await db.put<ConversationDO>('conversations', JSON.parse(JSON.stringify(conv)))
  conversations.value = sortConversations([...conversations.value])
  // 当前会话打开中：顺手推进读位置，保持已读
  if (ccid === activeClientConversationId.value && message.id) {
    await markConversationRead(message.conversationType, message.targetId, message.id)
  }
}

/** 标记会话已读（进入聊天页时调用） */
async function markConversationRead(type: number, targetId: number, messageId: number) {
  const clientConversationId = getClientConversationId(type, targetId)
  await initImDb()
  const db = getImDb()
  await db.put<ConversationReadDO>('conversationReads', {
    clientConversationId,
    conversationType: type,
    targetId,
    messageId,
    updateTime: Date.now(),
  })
  const target = conversations.value.find(item => item.clientConversationId === clientConversationId)
  if (target) {
    target.unreadCount = 0
  }
}

/** 更新会话本地设置并持久化 + 重排 */
async function updateConversationLocal(clientConversationId: string, patch: Partial<ConversationDO>) {
  const target = conversations.value.find(item => item.clientConversationId === clientConversationId)
  if (!target) {
    return
  }
  Object.assign(target, patch)
  await initImDb()
  await getImDb().put<ConversationDO>('conversations', JSON.parse(JSON.stringify(target)))
  conversations.value = sortConversations([...conversations.value])
}

/** 置顶 / 取消置顶 */
async function setConversationTop(clientConversationId: string, top: boolean) {
  await updateConversationLocal(clientConversationId, { top })
}

/** 免打扰 / 取消免打扰 */
async function setConversationSilent(clientConversationId: string, silent: boolean) {
  await updateConversationLocal(clientConversationId, { silent })
}

/** 删除会话（本地软删，再来新消息会重新出现） */
async function removeConversation(clientConversationId: string) {
  await updateConversationLocal(clientConversationId, { deleted: true })
}

/** 会话列表 composable（模块级单例状态，列表页与聊天页共享） */
export function useImConversations() {
  return {
    conversations,
    loading,
    isLoaded: () => loaded,
    load,
    markConversationRead,
    setActiveConversation,
    buildIncomingMessage,
    applyIncomingMessage,
    setConversationTop,
    setConversationSilent,
    removeConversation,
  }
}
