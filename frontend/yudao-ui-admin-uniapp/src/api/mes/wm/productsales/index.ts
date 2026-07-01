import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 销售出库单查询参数 */
export interface WmProductSalesQueryParams extends PageParam {
  code?: string // 出库单编号
  name?: string // 出库单名称
  salesOrderCode?: string // 销售订单编号
  clientId?: number // 客户编号
  shipmentDate?: string[] // 出库日期范围
  status?: number // 单据状态
}

/** MES 销售出库单 VO */
export interface WmProductSalesVO {
  id: number // 销售出库编号
  code: string // 出库单编号
  name?: string // 出库单名称
  clientId: number // 客户编号
  clientCode?: string // 客户编码
  clientName?: string // 客户名称
  salesOrderCode?: string // 销售订单编号
  salesDate?: string | number // 出库日期
  shipmentDate?: string | number // 兼容旧字段
  noticeId?: number // 发货通知单编号
  noticeCode?: string // 发货通知单号
  contactName?: string // 收货人
  contactTelephone?: string // 联系方式
  contactAddress?: string // 收货地址
  carrier?: string // 承运商
  shippingNumber?: string // 运输单号
  status: number // 单据状态
  remark?: string // 备注
  createTime?: string | number // 创建时间
}

/** MES 销售出库单创建参数 */
export interface WmProductSalesCreateReqVO {
  code?: string // 出库单编号
  name?: string // 出库单名称
  clientId?: number // 客户编号
  salesOrderCode?: string // 销售订单编号
  salesDate?: string | number // 出库日期
  noticeId?: number // 发货通知单编号
  contactName?: string // 收货人
  contactTelephone?: string // 联系方式
  contactAddress?: string // 收货地址
  carrier?: string // 承运商
  shippingNumber?: string // 运输单号
  remark?: string // 备注
}

/** MES 销售出库单更新参数 */
export interface WmProductSalesUpdateReqVO extends WmProductSalesCreateReqVO {
  id: number // 销售出库编号
}

/** MES 销售出库单填写运单参数 */
export interface WmProductSalesShippingReqVO {
  id: number // 销售出库编号
  carrier?: string // 承运商
  shippingNumber?: string // 运输单号
}

/** 查询销售出库单分页 */
export function getProductSalesPage(params: WmProductSalesQueryParams) {
  return http.get<PageResult<WmProductSalesVO>>('/mes/wm/product-sales/page', params)
}

/** 查询销售出库单详情 */
export function getProductSales(id: number) {
  return http.get<WmProductSalesVO>(`/mes/wm/product-sales/get?id=${id}`)
}

/** 新增销售出库单 */
export function createProductSales(data: WmProductSalesCreateReqVO) {
  return http.post<number>('/mes/wm/product-sales/create', data)
}

/** 修改销售出库单 */
export function updateProductSales(data: WmProductSalesUpdateReqVO) {
  return http.put<boolean>('/mes/wm/product-sales/update', data)
}

/** 删除销售出库单 */
export function deleteProductSales(id: number) {
  return http.delete<boolean>(`/mes/wm/product-sales/delete?id=${id}`)
}

/** 提交销售出库单 */
export function submitProductSales(id: number) {
  return http.put<boolean>(`/mes/wm/product-sales/submit?id=${id}`)
}

/** 校验销售出库单数量 */
export function checkProductSalesQuantity(id: number) {
  return http.get<boolean>(`/mes/wm/product-sales/check-quantity?id=${id}`)
}

/** 执行拣货 */
export function stockProductSales(id: number) {
  return http.put<boolean>(`/mes/wm/product-sales/stock?id=${id}`)
}

/** 填写运单 */
export function shippingProductSales(data: WmProductSalesShippingReqVO) {
  return http.put<boolean>('/mes/wm/product-sales/shipping', data)
}

/** 执行出库 */
export function finishProductSales(id: number) {
  return http.put<boolean>(`/mes/wm/product-sales/finish?id=${id}`)
}

/** 取消销售出库单 */
export function cancelProductSales(id: number) {
  return http.put<boolean>(`/mes/wm/product-sales/cancel?id=${id}`)
}

/** 导出销售出库单 Excel */
export function exportProductSales(params: WmProductSalesQueryParams) {
  return http.get<Blob>('/mes/wm/product-sales/export-excel', params)
}

export const WmProductSalesApi = {
  getProductSalesPage,
  getProductSales,
  createProductSales,
  updateProductSales,
  deleteProductSales,
  submitProductSales,
  checkProductSalesQuantity,
  stockProductSales,
  shippingProductSales,
  finishProductSales,
  cancelProductSales,
  exportProductSales,
}
