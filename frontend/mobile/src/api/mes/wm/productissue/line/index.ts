import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 领料出库单行查询参数 */
export interface WmProductIssueLineQueryParams extends PageParam {
  issueId?: number // 领料单编号
}

/** MES 领料出库单行 VO */
export interface WmProductIssueLineVO {
  id: number // 行编号
  issueId: number // 领料单编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位名称
  quantity?: number // 领料数量
  batchId?: number // 批次编号
  remark?: string // 备注
  createTime?: string | number // 创建时间
}

/** MES 领料出库单行创建参数 */
export interface WmProductIssueLineCreateReqVO {
  issueId?: number // 领料单编号
  itemId?: number // 物料编号
  quantity?: number // 领料数量
  batchId?: number // 批次编号
  remark?: string // 备注
}

/** MES 领料出库单行更新参数 */
export interface WmProductIssueLineUpdateReqVO extends WmProductIssueLineCreateReqVO {
  id: number // 行编号
}

/** 查询领料出库单行分页 */
export function getProductIssueLinePage(params: WmProductIssueLineQueryParams) {
  return http.get<PageResult<WmProductIssueLineVO>>('/mes/wm/product-issue-line/page', params)
}

/** 查询领料出库单行详情 */
export function getProductIssueLine(id: number) {
  return http.get<WmProductIssueLineVO>(`/mes/wm/product-issue-line/get?id=${id}`)
}

/** 查询领料出库单行列表（按领料单编号） */
export function getProductIssueLineListByIssueId(issueId: number) {
  return http.get<WmProductIssueLineVO[]>('/mes/wm/product-issue-line/list-by-issue', { issueId })
}

/** 新增领料出库单行 */
export function createProductIssueLine(data: WmProductIssueLineCreateReqVO) {
  return http.post<number>('/mes/wm/product-issue-line/create', data)
}

/** 修改领料出库单行 */
export function updateProductIssueLine(data: WmProductIssueLineUpdateReqVO) {
  return http.put<boolean>('/mes/wm/product-issue-line/update', data)
}

/** 删除领料出库单行 */
export function deleteProductIssueLine(id: number) {
  return http.delete<boolean>(`/mes/wm/product-issue-line/delete?id=${id}`)
}

export const WmProductIssueLineApi = {
  getProductIssueLinePage,
  getProductIssueLine,
  getProductIssueLineListByIssueId,
  createProductIssueLine,
  updateProductIssueLine,
  deleteProductIssueLine,
}
