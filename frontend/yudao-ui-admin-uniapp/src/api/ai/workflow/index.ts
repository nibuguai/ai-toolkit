import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 工作流 */
export interface WorkflowVO {
  id?: number
  code?: string
  name?: string
  remark?: string
  status?: number
  graph?: string
  createTime?: string
}

/** 查询工作流分页 */
export function getWorkflowPage(params: PageParam) {
  return http.get<PageResult<WorkflowVO>>('/ai/workflow/page', params)
}

/** 查询工作流详情 */
export function getWorkflow(id: number) {
  return http.get<WorkflowVO>(`/ai/workflow/get?id=${id}`)
}

/** 新增工作流 */
export function createWorkflow(data: WorkflowVO) {
  return http.post<number>('/ai/workflow/create', data)
}

/** 修改工作流 */
export function updateWorkflow(data: WorkflowVO) {
  return http.put<boolean>('/ai/workflow/update', data)
}

/** 删除工作流 */
export function deleteWorkflow(id: number) {
  return http.delete<boolean>(`/ai/workflow/delete?id=${id}`)
}

/** 测试工作流 */
export function testWorkflow(data: Record<string, any>) {
  return http.post<any>('/ai/workflow/test', data)
}
