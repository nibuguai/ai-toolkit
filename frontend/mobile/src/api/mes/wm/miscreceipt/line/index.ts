import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// MES 杂项入库单行 VO
export interface WmMiscReceiptLineVO {
  id: number
  receiptId: number
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

export interface WmMiscReceiptLineQueryParams extends PageParam {
  receiptId: number
}

export interface WmMiscReceiptLineCreateReqVO {
  receiptId: number
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

export interface WmMiscReceiptLineUpdateReqVO extends WmMiscReceiptLineCreateReqVO {
  id: number
}

/** 查询杂项入库单行分页 */
export function getMiscReceiptLinePage(params: WmMiscReceiptLineQueryParams) {
  return http.get<PageResult<WmMiscReceiptLineVO>>('/mes/wm/misc-receipt-line/page', params)
}

/** 查询杂项入库单行详情 */
export function getMiscReceiptLine(id: number) {
  return http.get<WmMiscReceiptLineVO>(`/mes/wm/misc-receipt-line/get?id=${id}`)
}

/** 查询杂项入库单行列表 */
export function getMiscReceiptLineListByReceiptId(receiptId: number) {
  return http.get<WmMiscReceiptLineVO[]>(`/mes/wm/misc-receipt-line/list-by-receipt-id?receiptId=${receiptId}`)
}

/** 新增杂项入库单行 */
export function createMiscReceiptLine(data: WmMiscReceiptLineCreateReqVO) {
  return http.post<number>('/mes/wm/misc-receipt-line/create', data)
}

/** 修改杂项入库单行 */
export function updateMiscReceiptLine(data: WmMiscReceiptLineUpdateReqVO) {
  return http.put<boolean>('/mes/wm/misc-receipt-line/update', data)
}

/** 删除杂项入库单行 */
export function deleteMiscReceiptLine(id: number) {
  return http.delete<boolean>(`/mes/wm/misc-receipt-line/delete?id=${id}`)
}

export const WmMiscReceiptLineApi = {
  getMiscReceiptLinePage,
  getMiscReceiptLine,
  getMiscReceiptLineListByReceiptId,
  createMiscReceiptLine,
  updateMiscReceiptLine,
  deleteMiscReceiptLine,
}
