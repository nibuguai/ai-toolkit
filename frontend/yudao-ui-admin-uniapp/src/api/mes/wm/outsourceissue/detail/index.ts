import { http } from '@/http/http'

/** MES 外协发料单明细 VO */
export interface WmOutsourceIssueDetailVO {
  id: number // 明细编号
  lineId: number // 发料单行编号
  issueId: number // 发料单编号
  materialStockId?: number // 库存记录编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位名称
  quantity: number // 拣货数量
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  warehouseId?: number // 仓库编号
  warehouseName?: string // 仓库名称
  locationId?: number // 库区编号
  locationName?: string // 库区名称
  areaId?: number // 库位编号
  areaName?: string // 库位名称
  remark?: string // 备注
  createTime?: string | number // 创建时间
}

/** MES 外协发料单明细创建参数 */
export interface WmOutsourceIssueDetailCreateReqVO {
  lineId?: number // 发料单行编号
  issueId?: number // 发料单编号
  itemId?: number // 物料编号
  materialStockId?: number // 库存记录编号
  quantity?: number // 拣货数量
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  warehouseId?: number // 仓库编号
  locationId?: number // 库区编号
  areaId?: number // 库位编号
  remark?: string // 备注
}

/** MES 外协发料单明细更新参数 */
export interface WmOutsourceIssueDetailUpdateReqVO extends WmOutsourceIssueDetailCreateReqVO {
  id: number // 明细编号
}

/** 查询外协发料单明细列表（按行编号） */
export function getOutsourceIssueDetailListByLineId(lineId: number) {
  return http.get<WmOutsourceIssueDetailVO[]>('/mes/wm/outsource-issue-detail/list-by-line', { lineId })
}

/** 查询外协发料单明细详情 */
export function getOutsourceIssueDetail(id: number) {
  return http.get<WmOutsourceIssueDetailVO>(`/mes/wm/outsource-issue-detail/get?id=${id}`)
}

/** 新增外协发料单明细 */
export function createOutsourceIssueDetail(data: WmOutsourceIssueDetailCreateReqVO) {
  return http.post<number>('/mes/wm/outsource-issue-detail/create', data)
}

/** 修改外协发料单明细 */
export function updateOutsourceIssueDetail(data: WmOutsourceIssueDetailUpdateReqVO) {
  return http.put<boolean>('/mes/wm/outsource-issue-detail/update', data)
}

/** 删除外协发料单明细 */
export function deleteOutsourceIssueDetail(id: number) {
  return http.delete<boolean>(`/mes/wm/outsource-issue-detail/delete?id=${id}`)
}

export const WmOutsourceIssueDetailApi = {
  getOutsourceIssueDetailListByLineId,
  getOutsourceIssueDetail,
  createOutsourceIssueDetail,
  updateOutsourceIssueDetail,
  deleteOutsourceIssueDetail,
}
