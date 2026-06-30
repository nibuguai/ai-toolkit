import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 生产退料单分页参数 */
export interface WmReturnIssueQueryParams extends PageParam {
  code?: string
  name?: string
  workstationId?: number
  workOrderId?: number
  type?: number
}

/** MES 生产退料单 VO */
export interface WmReturnIssueVO {
  id: number
  code: string
  name?: string
  workstationId?: number
  workstationCode?: string
  workstationName?: string
  workOrderId?: number
  workOrderCode?: string
  type?: number
  returnDate?: string | number
  status?: number
  remark?: string
  createTime?: string
}

/** MES 生产退料单创建参数 */
export interface WmReturnIssueCreateReqVO {
  code: string
  name: string
  workOrderId: number
  workstationId?: number
  type: number
  returnDate?: string | number
  remark?: string
}

/** MES 生产退料单更新参数 */
export interface WmReturnIssueUpdateReqVO extends WmReturnIssueCreateReqVO {
  id: number
}

/** 查询生产退料单分页 */
export function getReturnIssuePage(params: WmReturnIssueQueryParams) {
  return http.get<PageResult<WmReturnIssueVO>>('/mes/wm/return-issue/page', params)
}

/** 查询生产退料单详情 */
export function getReturnIssue(id: number) {
  return http.get<WmReturnIssueVO>(`/mes/wm/return-issue/get?id=${id}`)
}

/** 新增生产退料单 */
export function createReturnIssue(data: WmReturnIssueCreateReqVO) {
  return http.post<number>('/mes/wm/return-issue/create', data)
}

/** 修改生产退料单 */
export function updateReturnIssue(data: WmReturnIssueUpdateReqVO) {
  return http.put<boolean>('/mes/wm/return-issue/update', data)
}

/** 删除生产退料单 */
export function deleteReturnIssue(id: number) {
  return http.delete<boolean>(`/mes/wm/return-issue/delete?id=${id}`)
}

/** 提交生产退料单（草稿 → 待检验/待上架） */
export function submitReturnIssue(id: number) {
  return http.put<boolean>(`/mes/wm/return-issue/submit?id=${id}`)
}

/** 入库上架 */
export function stockReturnIssue(id: number) {
  return http.put<boolean>(`/mes/wm/return-issue/stock?id=${id}`)
}

/** 取消生产退料单 */
export function cancelReturnIssue(id: number) {
  return http.put<boolean>(`/mes/wm/return-issue/cancel?id=${id}`)
}

/** 完成生产退料单 */
export function finishReturnIssue(id: number) {
  return http.put<boolean>(`/mes/wm/return-issue/finish?id=${id}`)
}

/** 导出生产退料单 Excel */
export function exportReturnIssue(params: WmReturnIssueQueryParams) {
  return http.get<Blob>('/mes/wm/return-issue/export-excel', params)
}

export const WmReturnIssueApi = {
  getReturnIssuePage,
  getReturnIssue,
  createReturnIssue,
  updateReturnIssue,
  deleteReturnIssue,
  submitReturnIssue,
  stockReturnIssue,
  cancelReturnIssue,
  finishReturnIssue,
  exportReturnIssue,
}
