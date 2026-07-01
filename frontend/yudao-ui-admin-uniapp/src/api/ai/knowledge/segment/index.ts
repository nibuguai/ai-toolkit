import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 知识库分段 */
export interface KnowledgeSegmentVO {
  id?: number
  documentId?: number
  documentName?: string
  knowledgeId?: number
  vectorId?: string
  content?: string
  contentLength?: number
  tokens?: number
  retrievalCount?: number
  status?: number
  createTime?: string
}

/** 查询知识库分段分页 */
export function getKnowledgeSegmentPage(params: PageParam) {
  return http.get<PageResult<KnowledgeSegmentVO>>('/ai/knowledge/segment/page', params)
}

/** 查询知识库分段详情 */
export function getKnowledgeSegment(id: number) {
  return http.get<KnowledgeSegmentVO>(`/ai/knowledge/segment/get?id=${id}`)
}

/** 删除知识库分段 */
export function deleteKnowledgeSegment(id: number) {
  return http.delete<boolean>(`/ai/knowledge/segment/delete?id=${id}`)
}

/** 新增知识库分段 */
export function createKnowledgeSegment(data: KnowledgeSegmentVO) {
  return http.post<number>('/ai/knowledge/segment/create', data)
}

/** 修改知识库分段 */
export function updateKnowledgeSegment(data: KnowledgeSegmentVO) {
  return http.put<boolean>('/ai/knowledge/segment/update', data)
}

/** 修改知识库分段状态 */
export function updateKnowledgeSegmentStatus(data: Record<string, any>) {
  return http.put<boolean>('/ai/knowledge/segment/update-status', data)
}

/** 切片内容 */
export function splitContent(url: string, segmentMaxTokens: number) {
  return http.get<string[]>('/ai/knowledge/segment/split', { url, segmentMaxTokens })
}

/** 获取文档处理列表 */
export function getKnowledgeSegmentProcessList(documentIds: number[]) {
  return http.get<KnowledgeSegmentVO[]>('/ai/knowledge/segment/get-process-list', { documentIds: documentIds.join(',') })
}

/** 搜索知识库分段 */
export function searchKnowledgeSegment(params: Record<string, any>) {
  return http.get<KnowledgeSegmentVO[]>('/ai/knowledge/segment/search', params)
}

/** AI 知识库分段 API */
export const KnowledgeSegmentApi = {
  getKnowledgeSegmentPage,
  getKnowledgeSegment,
  deleteKnowledgeSegment,
  createKnowledgeSegment,
  updateKnowledgeSegment,
  updateKnowledgeSegmentStatus,
  splitContent,
  getKnowledgeSegmentProcessList,
  searchKnowledgeSegment,
}
