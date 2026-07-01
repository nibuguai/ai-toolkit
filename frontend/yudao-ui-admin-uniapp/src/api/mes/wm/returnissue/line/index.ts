import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 生产退料单行分页参数 */
export interface WmReturnIssueLineQueryParams extends PageParam {
  issueId?: number
}

/** MES 生产退料单行 VO */
export interface WmReturnIssueLineVO {
  id: number
  issueId: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  materialStockId?: number
  quantity: number
  batchId?: number
  batchCode?: string
  rqcCheckFlag?: boolean
  qualityStatus?: number
  rqcId?: number
  remark?: string
  createTime?: string
}

/** MES 生产退料单行创建参数 */
export interface WmReturnIssueLineCreateReqVO {
  issueId: number
  itemId?: number
  materialStockId?: number
  quantity?: number
  batchId?: number
  batchCode?: string
  rqcCheckFlag: boolean
  remark?: string
}

/** MES 生产退料单行更新参数 */
export interface WmReturnIssueLineUpdateReqVO extends WmReturnIssueLineCreateReqVO {
  id: number
}

/** 查询生产退料单行分页 */
export function getReturnIssueLinePage(params: WmReturnIssueLineQueryParams) {
  return http.get<PageResult<WmReturnIssueLineVO>>('/mes/wm/return-issue-line/page', params)
}

/** 查询生产退料单行详情 */
export function getReturnIssueLine(id: number) {
  return http.get<WmReturnIssueLineVO>(`/mes/wm/return-issue-line/get?id=${id}`)
}

/** 新增生产退料单行 */
export function createReturnIssueLine(data: WmReturnIssueLineCreateReqVO) {
  return http.post<number>('/mes/wm/return-issue-line/create', data)
}

/** 修改生产退料单行 */
export function updateReturnIssueLine(data: WmReturnIssueLineUpdateReqVO) {
  return http.put<boolean>('/mes/wm/return-issue-line/update', data)
}

/** 删除生产退料单行 */
export function deleteReturnIssueLine(id: number) {
  return http.delete<boolean>(`/mes/wm/return-issue-line/delete?id=${id}`)
}

export const WmReturnIssueLineApi = {
  getReturnIssueLinePage,
  getReturnIssueLine,
  createReturnIssueLine,
  updateReturnIssueLine,
  deleteReturnIssueLine,
}
