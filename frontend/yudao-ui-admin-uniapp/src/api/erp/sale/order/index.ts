import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** ERP 销售订单明细 */
export interface SaleOrderItem {
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

/** ERP 销售订单 */
export interface SaleOrder {
  id?: number // 订单工单编号
  no?: string // 销售订单号
  customerId?: number // 客户编号
  accountId?: number // 结算账户编号
  saleUserId?: number // 销售人员编号
  orderTime?: string | number | Date // 订单时间
  discountPercent?: number // 优惠率
  discountPrice?: number // 收款优惠
  totalPrice?: number // 优惠后金额
  depositPrice?: number // 收取订金
  totalCount?: number // 合计数量
  status?: number // 状态
  remark?: string // 备注
  fileUrl?: string // 附件地址
  outCount?: number // 销售出库数量
  returnCount?: number // 销售退货数量
  items?: SaleOrderItem[] // 订单明细
}

/** 获取销售订单分页列表 */
export function getSaleOrderPage(params: PageParam) {
  return http.get<PageResult<SaleOrder>>('/erp/sale-order/page', params)
}

/** 获取销售订单详情 */
export function getSaleOrder(id: number) {
  return http.get<SaleOrder>(`/erp/sale-order/get?id=${id}`)
}

/** 创建销售订单 */
export function createSaleOrder(data: SaleOrder) {
  return http.post<number>('/erp/sale-order/create', data)
}

/** 更新销售订单 */
export function updateSaleOrder(data: SaleOrder) {
  return http.put<boolean>('/erp/sale-order/update', data)
}

/** 更新销售订单状态 */
export function updateSaleOrderStatus(id: number, status: number) {
  return http.put<boolean>('/erp/sale-order/update-status', undefined, { id, status })
}

/** 删除销售订单 */
export function deleteSaleOrder(ids: number[]) {
  return http.delete<boolean>('/erp/sale-order/delete', undefined, { ids: ids.join(',') })
}
