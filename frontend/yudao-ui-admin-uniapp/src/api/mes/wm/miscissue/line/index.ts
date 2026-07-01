import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// MES 杂项出库单行 VO
export interface WmMiscIssueLineVO {
  id: number
  issueId: number
  sourceDocLineId?: number
  materialStockId?: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  quantity: number
  batchId?: number
  batchCode?: string
  warehouseId: number
  warehouseName?: string
  locationId: number
  locationName?: string
  areaId: number
  areaName?: string
  remark?: string
  createTime?: string | Date
}

export interface WmMiscIssueLineQueryParams extends PageParam {
  issueId: number
}

export interface WmMiscIssueLineCreateReqVO {
  issueId: number
  sourceDocLineId?: number
  materialStockId?: number
  itemId: number
  quantity: number
  batchId?: number
  batchCode?: string
  warehouseId: number
  locationId: number
  areaId: number
  remark?: string
}

export interface WmMiscIssueLineUpdateReqVO extends WmMiscIssueLineCreateReqVO {
  id: number
}

/** 查询杂项出库单行分页 */
export function getMiscIssueLinePage(params: WmMiscIssueLineQueryParams) {
  return http.get<PageResult<WmMiscIssueLineVO>>('/mes/wm/misc-issue-line/page', params)
}

/** 根据出库单ID查询杂项出库单行列表 */
export function getMiscIssueLineListByIssueId(issueId: number) {
  return http.get<WmMiscIssueLineVO[]>(`/mes/wm/misc-issue-line/list-by-issue-id?issueId=${issueId}`)
}

/** 查询杂项出库单行详情 */
export function getMiscIssueLine(id: number) {
  return http.get<WmMiscIssueLineVO>(`/mes/wm/misc-issue-line/get?id=${id}`)
}

/** 新增杂项出库单行 */
export function createMiscIssueLine(data: WmMiscIssueLineCreateReqVO) {
  return http.post<number>('/mes/wm/misc-issue-line/create', data)
}

/** 修改杂项出库单行 */
export function updateMiscIssueLine(data: WmMiscIssueLineUpdateReqVO) {
  return http.put<boolean>('/mes/wm/misc-issue-line/update', data)
}

/** 删除杂项出库单行 */
export function deleteMiscIssueLine(id: number) {
  return http.delete<boolean>(`/mes/wm/misc-issue-line/delete?id=${id}`)
}

export const WmMiscIssueLineApi = {
  getMiscIssueLinePage,
  getMiscIssueLineListByIssueId,
  getMiscIssueLine,
  createMiscIssueLine,
  updateMiscIssueLine,
  deleteMiscIssueLine,
}
