import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'
import { sendSsePost } from '@/api/ai/utils'

/** AI 聊天消息 */
export interface ChatMessageVO {
  id?: number
  conversationId?: number
  type?: string
  userId?: string
  roleId?: string
  model?: number | string
  modelId?: number
  content?: string
  reasoningContent?: string
  attachmentUrls?: string[]
  tokens?: number
  segmentIds?: number[]
  segments?: Array<{
    id: number
    content: string
    documentId: number
    documentName: string
  }>
  webSearchPages?: Array<{
    name: string
    icon: string
    title: string
    url: string
    snippet: string
    summary: string
  }>
  createTime?: string
  roleAvatar?: string
  userAvatar?: string
}

/** 消息列表 */
export function getChatMessageListByConversationId(conversationId: number | null) {
  return http.get<ChatMessageVO[]>(`/ai/chat/message/list-by-conversation-id?conversationId=${conversationId}`)
}

/** 发送 Stream 消息 */
export function sendChatMessageStream(
  conversationId: number,
  content: string,
  ctrl: AbortController,
  enableContext: boolean,
  enableWebSearch: boolean,
  onMessage?: (res: { data: string }) => void | Promise<void>,
  onError?: (...args: any[]) => void,
  onClose?: (...args: any[]) => void,
  attachmentUrls?: string[],
) {
  return sendSsePost('/ai/chat/message/send-stream', {
    data: {
      conversationId,
      content,
      useContext: enableContext,
      useSearch: enableWebSearch,
      attachmentUrls: attachmentUrls || [],
    },
    ctrl,
    onMessage,
    onError,
    onClose,
  })
}

/** 删除消息 */
export function deleteChatMessage(id: number | string) {
  return http.delete<boolean>(`/ai/chat/message/delete?id=${id}`)
}

/** 删除指定对话的消息 */
export function deleteByConversationId(conversationId: number) {
  return http.delete<boolean>(`/ai/chat/message/delete-by-conversation-id?conversationId=${conversationId}`)
}

/** 获得消息分页 */
export function getChatMessagePage(params: PageParam) {
  return http.get<PageResult<ChatMessageVO>>('/ai/chat/message/page', params)
}

/** 管理员删除消息 */
export function deleteChatMessageByAdmin(id: number) {
  return http.delete<boolean>(`/ai/chat/message/delete-by-admin?id=${id}`)
}

/** AI 聊天消息 API */
export const ChatMessageApi = {
  getChatMessageListByConversationId,
  sendChatMessageStream,
  deleteChatMessage,
  deleteByConversationId,
  getChatMessagePage,
  deleteChatMessageByAdmin,
}
