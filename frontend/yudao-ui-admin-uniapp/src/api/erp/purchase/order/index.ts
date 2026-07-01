import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** ERP 采购订单明细 */
export interface PurchaseOrderItem {
  id?: number
  productId?: number
  productName?: string
  productUnitName?: string
  productBarCode?: string
  productPrice?: number
  stockCount?: number
  count?: number
  totalProductPrice?: number
  taxPercent?: number
  taxPrice?: number
  totalPrice?: number
  remark?: string
}

/** ERP 采购订单 */
export interface PurchaseOrder {
  id?: number // 订单工单编号
  no?: string // 采购订单号
  supplierId?: number // 供应商编号
  accountId?: number // 结算账户编号
  orderTime?: string | number | Date // 订单时间
  discountPercent?: number // 优惠率
  discountPrice?: number // 付款优惠
  totalPrice?: number // 优惠后金额
  depositPrice?: number // 支付订金
  totalCount?: number // 合计数量
  status?: number // 状态
  remark?: string // 备注
  fileUrl?: string // 附件地址
  inCount?: number // 采购入库数量
  returnCount?: number // 采购退货数量
  items?: PurchaseOrderItem[] // 订单明细
}

/** 获取采购订单分页列表 */
export function getPurchaseOrderPage(params: PageParam) {
  return http.get<PageResult<PurchaseOrder>>('/erp/purchase-order/page', params)
}

/** 获取采购订单详情 */
export function getPurchaseOrder(id: number) {
  return http.get<PurchaseOrder>(`/erp/purchase-order/get?id=${id}`)
}

/** 创建采购订单 */
export function createPurchaseOrder(data: PurchaseOrder) {
  return http.post<number>('/erp/purchase-order/create', data)
}

/** 更新采购订单 */
export function updatePurchaseOrder(data: PurchaseOrder) {
  return http.put<boolean>('/erp/purchase-order/update', data)
}

/** 更新采购订单状态 */
export function updatePurchaseOrderStatus(id: number, status: number) {
  return http.put<boolean>('/erp/purchase-order/update-status', undefined, { id, status })
}

/** 删除采购订单 */
export function deletePurchaseOrder(ids: number[]) {
  return http.delete<boolean>('/erp/purchase-order/delete', undefined, { ids: ids.join(',') })
}
