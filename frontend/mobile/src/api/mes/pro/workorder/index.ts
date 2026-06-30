import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 生产工单分页参数 */
export interface ProWorkOrderQueryParams extends PageParam {
  code?: string
  name?: string
  orderSourceCode?: string
  productId?: number
  clientId?: number
  type?: number
  status?: number
  requestDate?: [string, string]
}

/** MES 生产工单 VO */
export interface ProWorkOrderVO {
  id: number // 编号
  code: string // 工单编码
  name: string // 工单名称
  type: number // 工单类型
  orderSourceType: number // 来源类型
  orderSourceCode?: string // 来源单据编号
  productId: number // 产品编号
  productName?: string // 产品名称
  productCode?: string // 产品编码
  productSpecification?: string // 规格型号
  unitMeasureName?: string // 单位名称
  quantity: number // 生产数量
  quantityProduced?: number // 已生产数量
  quantityChanged?: number // 调整数量
  quantityScheduled?: number // 已排产数量
  clientId?: number // 客户编号
  clientCode?: string // 客户编码
  clientName?: string // 客户名称
  vendorId?: number // 供应商编号
  vendorName?: string // 供应商名称
  vendorCode?: string // 供应商编码
  batchCode?: string // 批次号
  requestDate: number | string // 需求日期
  parentId?: number // 父工单编号
  parentCode?: string // 父工单编码
  finishDate?: number | string // 完成时间
  cancelDate?: number | string // 取消时间
  status: number // 工单状态
  remark?: string // 备注
  createTime?: string // 创建时间
  children?: ProWorkOrderVO[] // 子工单
}

/** MES 生产工单创建参数 */
export interface ProWorkOrderCreateReqVO {
  parentId?: number
  code: string
  name: string
  type: number
  orderSourceType: number
  orderSourceCode?: string
  productId: number
  quantity: number
  clientId?: number
  vendorId?: number
  batchCode?: string
  requestDate: number | string
  remark?: string
}

/** MES 生产工单更新参数 */
export interface ProWorkOrderUpdateReqVO extends ProWorkOrderCreateReqVO {
  id: number
}

/** 查询生产工单分页 */
export function getWorkOrderPage(params: ProWorkOrderQueryParams) {
  return http.get<PageResult<ProWorkOrderVO>>(`/mes/pro/work-order/page`, params)
}

/** 查询生产工单详情 */
export function getWorkOrder(id: number) {
  return http.get<ProWorkOrderVO>(`/mes/pro/work-order/get?id=${id}`)
}

/** 新增生产工单 */
export function createWorkOrder(data: ProWorkOrderCreateReqVO) {
  return http.post<number>(`/mes/pro/work-order/create`, data)
}

/** 修改生产工单 */
export function updateWorkOrder(data: ProWorkOrderUpdateReqVO) {
  return http.put<boolean>(`/mes/pro/work-order/update`, data)
}

/** 删除生产工单 */
export function deleteWorkOrder(id: number) {
  return http.delete<boolean>(`/mes/pro/work-order/delete?id=${id}`)
}

/** 导出生产工单 Excel */
export function exportWorkOrder(params: Partial<ProWorkOrderQueryParams>) {
  return http.get<Blob>(`/mes/pro/work-order/export-excel`, params)
}

/** 完成工单 */
export function finishWorkOrder(id: number) {
  return http.put<boolean>(`/mes/pro/work-order/finish?id=${id}`)
}

/** 取消工单 */
export function cancelWorkOrder(id: number) {
  return http.put<boolean>(`/mes/pro/work-order/cancel?id=${id}`)
}

/** 确认工单 */
export function confirmWorkOrder(id: number) {
  return http.put<boolean>(`/mes/pro/work-order/confirm?id=${id}`)
}

export const ProWorkOrderApi = {
  getWorkOrderPage,
  getWorkOrder,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  exportWorkOrder,
  finishWorkOrder,
  cancelWorkOrder,
  confirmWorkOrder,
}
