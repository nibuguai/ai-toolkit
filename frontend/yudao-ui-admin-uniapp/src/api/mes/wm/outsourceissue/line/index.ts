import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 外协发料单行查询参数 */
export interface WmOutsourceIssueLineQueryParams extends PageParam {
  issueId?: number // 发料单编号
}

/** MES 外协发料单行 VO */
export interface WmOutsourceIssueLineVO {
  id: number // 行编号
  issueId: number // 发料单编号
  materialStockId?: number // 库存记录编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位名称
  quantity?: number // 发料数量
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  remark?: string // 备注
  createTime?: string | number // 创建时间
}

/** MES 外协发料单行创建参数 */
export interface WmOutsourceIssueLineCreateReqVO {
  issueId?: number // 发料单编号
  itemId?: number // 物料编号
  quantity?: number // 发料数量
  materialStockId?: number // 库存记录编号
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  remark?: string // 备注
}

/** MES 外协发料单行更新参数 */
export interface WmOutsourceIssueLineUpdateReqVO extends WmOutsourceIssueLineCreateReqVO {
  id: number // 行编号
}

/** 查询外协发料单行分页 */
export function getOutsourceIssueLinePage(params: WmOutsourceIssueLineQueryParams) {
  return http.get<PageResult<WmOutsourceIssueLineVO>>('/mes/wm/outsource-issue-line/page', params)
}

/** 查询外协发料单行详情 */
export function getOutsourceIssueLine(id: number) {
  return http.get<WmOutsourceIssueLineVO>(`/mes/wm/outsource-issue-line/get?id=${id}`)
}

/** 查询外协发料单行列表（按发料单编号） */
export function getOutsourceIssueLineListByIssueId(issueId: number) {
  return http.get<WmOutsourceIssueLineVO[]>('/mes/wm/outsource-issue-line/list-by-issue-id', { issueId })
}

/** 新增外协发料单行 */
export function createOutsourceIssueLine(data: WmOutsourceIssueLineCreateReqVO) {
  return http.post<number>('/mes/wm/outsource-issue-line/create', data)
}

/** 修改外协发料单行 */
export function updateOutsourceIssueLine(data: WmOutsourceIssueLineUpdateReqVO) {
  return http.put<boolean>('/mes/wm/outsource-issue-line/update', data)
}

/** 删除外协发料单行 */
export function deleteOutsourceIssueLine(id: number) {
  return http.delete<boolean>(`/mes/wm/outsource-issue-line/delete?id=${id}`)
}

export const WmOutsourceIssueLineApi = {
  getOutsourceIssueLinePage,
  getOutsourceIssueLine,
  getOutsourceIssueLineListByIssueId,
  createOutsourceIssueLine,
  updateOutsourceIssueLine,
  deleteOutsourceIssueLine,
}
