import { http } from '@/http/http'

/** MES 销售出库明细 VO */
export interface WmProductSalesDetailVO {
  id: number // 明细编号
  lineId: number // 出库单行编号
  salesId: number // 出库单编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位名称
  quantity: number // 拣货数量
  materialStockId?: number // 库存记录编号
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

/** MES 销售出库明细创建参数 */
export interface WmProductSalesDetailCreateReqVO {
  lineId?: number // 出库单行编号
  salesId?: number // 出库单编号
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

/** MES 销售出库明细更新参数 */
export interface WmProductSalesDetailUpdateReqVO extends WmProductSalesDetailCreateReqVO {
  id: number // 明细编号
}

/** 查询销售出库明细列表（按行编号） */
export function getProductSalesDetailListByLineId(lineId: number) {
  return http.get<WmProductSalesDetailVO[]>('/mes/wm/product-sales-detail/list-by-line', { lineId })
}

/** 查询销售出库明细详情 */
export function getProductSalesDetail(id: number) {
  return http.get<WmProductSalesDetailVO>(`/mes/wm/product-sales-detail/get?id=${id}`)
}

/** 新增销售出库明细 */
export function createProductSalesDetail(data: WmProductSalesDetailCreateReqVO) {
  return http.post<number>('/mes/wm/product-sales-detail/create', data)
}

/** 修改销售出库明细 */
export function updateProductSalesDetail(data: WmProductSalesDetailUpdateReqVO) {
  return http.put<boolean>('/mes/wm/product-sales-detail/update', data)
}

/** 删除销售出库明细 */
export function deleteProductSalesDetail(id: number) {
  return http.delete<boolean>(`/mes/wm/product-sales-detail/delete?id=${id}`)
}

export const WmProductSalesDetailApi = {
  getProductSalesDetailListByLineId,
  getProductSalesDetail,
  createProductSalesDetail,
  updateProductSalesDetail,
  deleteProductSalesDetail,
}
