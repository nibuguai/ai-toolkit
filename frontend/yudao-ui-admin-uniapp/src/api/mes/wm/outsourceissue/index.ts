import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 外协发料单分页参数 */
export interface WmOutsourceIssueQueryParams extends PageParam {
  code?: string
  name?: string
  vendorId?: number
  workOrderId?: number
  issueDate?: [string, string]
}

// MES 外协发料单 VO
export interface WmOutsourceIssueVO {
  id: number
  code: string
  name: string
  vendorId?: number
  vendorCode?: string
  vendorName?: string
  workOrderId: number
  workOrderCode?: string
  workOrderName?: string
  issueDate?: string | number
  status: number
  remark?: string
  createTime?: string
}

/** MES 外协发料单创建参数 */
export interface WmOutsourceIssueCreateReqVO {
  code: string
  name: string
  vendorId?: number
  workOrderId: number
  issueDate?: string | number
  remark?: string
}

/** MES 外协发料单更新参数 */
export interface WmOutsourceIssueUpdateReqVO extends WmOutsourceIssueCreateReqVO {
  id: number
}

/** 查询外协发料单分页 */
export function getOutsourceIssuePage(params: WmOutsourceIssueQueryParams) {
  return http.get<PageResult<WmOutsourceIssueVO>>('/mes/wm/outsource-issue/page', params)
}

/** 查询外协发料单详情 */
export function getOutsourceIssue(id: number) {
  return http.get<WmOutsourceIssueVO>(`/mes/wm/outsource-issue/get?id=${id}`)
}

/** 新增外协发料单 */
export function createOutsourceIssue(data: WmOutsourceIssueCreateReqVO) {
  return http.post<number>('/mes/wm/outsource-issue/create', data)
}

/** 修改外协发料单 */
export function updateOutsourceIssue(data: WmOutsourceIssueUpdateReqVO) {
  return http.put<boolean>('/mes/wm/outsource-issue/update', data)
}

/** 删除外协发料单 */
export function deleteOutsourceIssue(id: number) {
  return http.delete<boolean>(`/mes/wm/outsource-issue/delete?id=${id}`)
}

/** 提交到待拣货 */
export function submitOutsourceIssue(id: number) {
  return http.put<boolean>(`/mes/wm/outsource-issue/submit?id=${id}`)
}

/** 执行拣货 */
export function stockOutsourceIssue(id: number) {
  return http.put<boolean>(`/mes/wm/outsource-issue/stock?id=${id}`)
}

/** 完成外协发料出库 */
export function finishOutsourceIssue(id: number) {
  return http.put<boolean>(`/mes/wm/outsource-issue/finish?id=${id}`)
}

/** 取消外协发料单 */
export function cancelOutsourceIssue(id: number) {
  return http.put<boolean>(`/mes/wm/outsource-issue/cancel?id=${id}`)
}

/** 校验外协发料单数量 */
export function checkOutsourceIssueQuantity(id: number) {
  return http.get<boolean>(`/mes/wm/outsource-issue/check-quantity?id=${id}`)
}

/** 导出外协发料单 Excel */
export function exportOutsourceIssue(params: WmOutsourceIssueQueryParams) {
  return http.get<Blob>('/mes/wm/outsource-issue/export-excel', params)
}

export const WmOutsourceIssueApi = {
  getOutsourceIssuePage,
  getOutsourceIssue,
  createOutsourceIssue,
  updateOutsourceIssue,
  deleteOutsourceIssue,
  submitOutsourceIssue,
  stockOutsourceIssue,
  finishOutsourceIssue,
  cancelOutsourceIssue,
  checkOutsourceIssueQuantity,
  exportOutsourceIssue,
}
