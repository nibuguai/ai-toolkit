import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 产品入库单行分页参数 */
export interface WmProductReceiptLineQueryParams extends PageParam {
  receiptId?: number
}

/** MES 产品入库单行 VO */
export interface WmProductReceiptLineVO {
  id: number
  receiptId: number
  itemId: number
  materialStockId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  quantity: number
  batchId?: number
  batchCode?: string
  remark?: string
  createTime?: string
}

/** MES 产品入库单行创建参数 */
export interface WmProductReceiptLineCreateReqVO {
  receiptId: number
  itemId: number
  materialStockId?: number
  quantity: number
  batchId?: number
  batchCode?: string
  remark?: string
}

/** MES 产品入库单行更新参数 */
export interface WmProductReceiptLineUpdateReqVO extends WmProductReceiptLineCreateReqVO {
  id: number
}

/** 查询产品入库单行分页 */
export function getProductReceiptLinePage(params: WmProductReceiptLineQueryParams) {
  return http.get<PageResult<WmProductReceiptLineVO>>('/mes/wm/product-receipt-line/page', params)
}

/** 查询产品入库单行详情 */
export function getProductReceiptLine(id: number) {
  return http.get<WmProductReceiptLineVO>(`/mes/wm/product-receipt-line/get?id=${id}`)
}

/** 新增产品入库单行 */
export function createProductReceiptLine(data: WmProductReceiptLineCreateReqVO) {
  return http.post<number>('/mes/wm/product-receipt-line/create', data)
}

/** 修改产品入库单行 */
export function updateProductReceiptLine(data: WmProductReceiptLineUpdateReqVO) {
  return http.put<boolean>('/mes/wm/product-receipt-line/update', data)
}

/** 删除产品入库单行 */
export function deleteProductReceiptLine(id: number) {
  return http.delete<boolean>(`/mes/wm/product-receipt-line/delete?id=${id}`)
}

export const WmProductReceiptLineApi = {
  getProductReceiptLinePage,
  getProductReceiptLine,
  createProductReceiptLine,
  updateProductReceiptLine,
  deleteProductReceiptLine,
}
