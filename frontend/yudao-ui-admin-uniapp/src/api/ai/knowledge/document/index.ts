import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 知识库文档 */
export interface KnowledgeDocumentVO {
  id?: number
  knowledgeId?: number
  knowledgeName?: string
  name?: string
  contentLength?: number
  tokens?: number
  segmentMaxTokens?: number
  retrievalCount?: number
  status?: number
  createTime?: string
}

/** 查询知识库文档分页 */
export function getKnowledgeDocumentPage(params: PageParam) {
  return http.get<PageResult<KnowledgeDocumentVO>>('/ai/knowledge/document/page', params)
}

/** 查询知识库文档详情 */
export function getKnowledgeDocument(id: number) {
  return http.get<KnowledgeDocumentVO>(`/ai/knowledge/document/get?id=${id}`)
}

/** 新增知识库文档 */
export function createKnowledgeDocument(data: Record<string, any>) {
  return http.post<number>('/ai/knowledge/document/create', data)
}

/** 批量新增知识库文档 */
export function createKnowledgeDocumentList(data: Record<string, any>) {
  return http.post<number[]>('/ai/knowledge/document/create-list', data)
}

/** 修改知识库文档 */
export function updateKnowledgeDocument(data: Record<string, any>) {
  return http.put<boolean>('/ai/knowledge/document/update', data)
}

/** 修改知识库文档状态 */
export function updateKnowledgeDocumentStatus(data: Record<string, any>) {
  return http.put<boolean>('/ai/knowledge/document/update-status', data)
}

/** 删除知识库文档 */
export function deleteKnowledgeDocument(id: number) {
  return http.delete<boolean>(`/ai/knowledge/document/delete?id=${id}`)
}

/** AI 知识库文档 API */
export const KnowledgeDocumentApi = {
  getKnowledgeDocumentPage,
  getKnowledgeDocument,
  createKnowledgeDocument,
  createKnowledgeDocumentList,
  updateKnowledgeDocument,
  updateKnowledgeDocumentStatus,
  deleteKnowledgeDocument,
}
