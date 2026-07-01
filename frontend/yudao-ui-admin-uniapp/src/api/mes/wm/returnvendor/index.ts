import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 供应商退货单查询参数 */
export interface WmReturnVendorQueryParams extends PageParam {
  code?: string // 退货单编号
  name?: string // 退货单名称
  purchaseOrderCode?: string // 采购订单编号
  vendorId?: number // 供应商编号
}

/** MES 供应商退货单 VO */
export interface WmReturnVendorVO {
  id: number // 退货单编号
  code: string // 退货单编码
  name: string // 退货单名称
  purchaseOrderCode?: string // 采购订单编号
  vendorId: number // 供应商编号
  vendorCode?: string // 供应商编码
  vendorName?: string // 供应商名称
  vendorNickname?: string // 供应商简称
  returnDate?: string | number // 退货日期
  returnReason?: string // 退货原因
  transportCode?: string // 物流单号
  transportTelephone?: string // 物流联系电话
  status: number // 单据状态
  remark?: string // 备注
  createTime?: string | number // 创建时间
}

/** MES 供应商退货单创建参数 */
export interface WmReturnVendorCreateReqVO {
  code?: string // 退货单编码
  name?: string // 退货单名称
  purchaseOrderCode?: string // 采购订单编号
  vendorId?: number // 供应商编号
  returnDate?: string | number // 退货日期
  returnReason?: string // 退货原因
  transportCode?: string // 物流单号
  transportTelephone?: string // 物流联系电话
  remark?: string // 备注
}

/** MES 供应商退货单更新参数 */
export interface WmReturnVendorUpdateReqVO extends WmReturnVendorCreateReqVO {
  id: number // 退货单编号
}

/** 查询供应商退货单分页 */
export function getReturnVendorPage(params: WmReturnVendorQueryParams) {
  return http.get<PageResult<WmReturnVendorVO>>('/mes/wm/return-vendor/page', params)
}

/** 查询供应商退货单详情 */
export function getReturnVendor(id: number) {
  return http.get<WmReturnVendorVO>(`/mes/wm/return-vendor/get?id=${id}`)
}

/** 新增供应商退货单 */
export function createReturnVendor(data: WmReturnVendorCreateReqVO) {
  return http.post<number>('/mes/wm/return-vendor/create', data)
}

/** 修改供应商退货单 */
export function updateReturnVendor(data: WmReturnVendorUpdateReqVO) {
  return http.put<boolean>('/mes/wm/return-vendor/update', data)
}

/** 删除供应商退货单 */
export function deleteReturnVendor(id: number) {
  return http.delete<boolean>(`/mes/wm/return-vendor/delete?id=${id}`)
}

/** 提交供应商退货单 */
export function submitReturnVendor(id: number) {
  return http.put<boolean>(`/mes/wm/return-vendor/submit?id=${id}`)
}

/** 执行拣货 */
export function stockReturnVendor(id: number) {
  return http.put<boolean>(`/mes/wm/return-vendor/stock?id=${id}`)
}

/** 取消供应商退货单 */
export function cancelReturnVendor(id: number) {
  return http.put<boolean>(`/mes/wm/return-vendor/cancel?id=${id}`)
}

/** 完成供应商退货单（执行退货） */
export function finishReturnVendor(id: number) {
  return http.put<boolean>(`/mes/wm/return-vendor/finish?id=${id}`)
}

/** 校验供应商退货单数量（每行明细数量之和是否等于行退货数量） */
export function checkReturnVendorQuantity(id: number) {
  return http.get<boolean>(`/mes/wm/return-vendor/check-quantity?id=${id}`)
}

/** 导出供应商退货单 Excel */
export function exportReturnVendor(params: WmReturnVendorQueryParams) {
  return http.get<Blob>('/mes/wm/return-vendor/export-excel', params)
}

export const WmReturnVendorApi = {
  getReturnVendorPage,
  getReturnVendor,
  createReturnVendor,
  updateReturnVendor,
  deleteReturnVendor,
  submitReturnVendor,
  stockReturnVendor,
  cancelReturnVendor,
  finishReturnVendor,
  checkReturnVendorQuantity,
  exportReturnVendor,
}
