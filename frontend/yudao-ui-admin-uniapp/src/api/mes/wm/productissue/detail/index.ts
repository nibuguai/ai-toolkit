import { http } from '@/http/http'

/** MES 领料出库明细 VO */
export interface WmProductIssueDetailVO {
  id: number // 明细编号
  issueId: number // 领料单编号
  lineId: number // 领料单行编号
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

/** MES 领料出库明细创建参数 */
export interface WmProductIssueDetailCreateReqVO {
  issueId?: number // 领料单编号
  lineId?: number // 领料单行编号
  materialStockId?: number // 库存记录编号
  itemId?: number // 物料编号
  quantity?: number // 拣货数量
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  warehouseId?: number // 仓库编号
  locationId?: number // 库区编号
  areaId?: number // 库位编号
  remark?: string // 备注
}

/** MES 领料出库明细更新参数 */
export interface WmProductIssueDetailUpdateReqVO extends WmProductIssueDetailCreateReqVO {
  id: number // 明细编号
}

/** 查询领料出库明细列表（按行编号） */
export function getProductIssueDetailListByLineId(lineId: number) {
  return http.get<WmProductIssueDetailVO[]>('/mes/wm/product-issue-detail/list-by-line', { lineId })
}

/** 查询领料出库明细详情 */
export function getProductIssueDetail(id: number) {
  return http.get<WmProductIssueDetailVO>(`/mes/wm/product-issue-detail/get?id=${id}`)
}

/** 新增领料出库明细 */
export function createProductIssueDetail(data: WmProductIssueDetailCreateReqVO) {
  return http.post<number>('/mes/wm/product-issue-detail/create', data)
}

/** 修改领料出库明细 */
export function updateProductIssueDetail(data: WmProductIssueDetailUpdateReqVO) {
  return http.put<boolean>('/mes/wm/product-issue-detail/update', data)
}

/** 删除领料出库明细 */
export function deleteProductIssueDetail(id: number) {
  return http.delete<boolean>(`/mes/wm/product-issue-detail/delete?id=${id}`)
}

export const WmProductIssueDetailApi = {
  getProductIssueDetailListByLineId,
  getProductIssueDetail,
  createProductIssueDetail,
  updateProductIssueDetail,
  deleteProductIssueDetail,
}
