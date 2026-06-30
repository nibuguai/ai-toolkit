import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 采购入库单行查询参数 */
export interface WmItemReceiptLineQueryParams extends PageParam {
  receiptId?: number // 入库单编号
  vendorId?: number // 供应商编号
}

/** MES 采购入库单行 VO */
export interface WmItemReceiptLineVO {
  id: number // 行编号
  receiptId: number // 入库单编号
  receiptCode?: string // 入库单编码
  purchaseOrderCode?: string // 采购订单号
  arrivalNoticeLineId?: number // 到货通知单行编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位
  receivedQuantity: number // 入库数量
  batchId?: number // 批次编号
  batchCode?: string // 批次编码
  productionDate?: string | number // 生产日期
  expireDate?: string | number // 有效期
  lotNumber?: string // 生产批号
  remark?: string // 备注
  createTime?: string | number // 创建时间
}

/** MES 采购入库单行创建参数 */
export interface WmItemReceiptLineCreateReqVO {
  receiptId: number // 入库单编号
  arrivalNoticeLineId?: number // 到货通知单行编号
  itemId?: number // 物料编号
  receivedQuantity?: number // 入库数量
  productionDate?: string | number // 生产日期
  expireDate?: string | number // 有效期
  lotNumber?: string // 生产批号
  remark?: string // 备注
}

/** MES 采购入库单行更新参数 */
export interface WmItemReceiptLineUpdateReqVO extends WmItemReceiptLineCreateReqVO {
  id: number // 行编号
}

/** 查询采购入库单行分页 */
export function getItemReceiptLinePage(params: WmItemReceiptLineQueryParams) {
  return http.get<PageResult<WmItemReceiptLineVO>>('/mes/wm/item-receipt-line/page', params)
}

/** 查询采购入库单行详情 */
export function getItemReceiptLine(id: number) {
  return http.get<WmItemReceiptLineVO>(`/mes/wm/item-receipt-line/get?id=${id}`)
}

/** 新增采购入库单行 */
export function createItemReceiptLine(data: WmItemReceiptLineCreateReqVO) {
  return http.post<number>('/mes/wm/item-receipt-line/create', data)
}

/** 修改采购入库单行 */
export function updateItemReceiptLine(data: WmItemReceiptLineUpdateReqVO) {
  return http.put<boolean>('/mes/wm/item-receipt-line/update', data)
}

/** 删除采购入库单行 */
export function deleteItemReceiptLine(id: number) {
  return http.delete<boolean>(`/mes/wm/item-receipt-line/delete?id=${id}`)
}

export const WmItemReceiptLineApi = {
  getItemReceiptLinePage,
  getItemReceiptLine,
  createItemReceiptLine,
  updateItemReceiptLine,
  deleteItemReceiptLine,
}
