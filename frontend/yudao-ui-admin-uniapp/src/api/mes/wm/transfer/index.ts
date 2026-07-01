import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// MES 转移单 VO
export interface WmTransferVO {
  id: number
  code: string
  name: string
  type: number
  deliveryFlag?: boolean
  recipientName?: string
  recipientTelephone?: string
  destinationAddress?: string
  carrier?: string
  shippingNumber?: string
  confirmFlag?: boolean
  transferDate: string | Date
  status: number
  remark?: string
  createTime?: string
}

export interface WmTransferQueryParams extends PageParam {
  code?: string
  name?: string
  type?: number
  status?: number
}

export interface WmTransferCreateReqVO {
  code: string
  name: string
  type: number
  deliveryFlag: boolean
  recipientName?: string
  recipientTelephone?: string
  destinationAddress?: string
  carrier?: string
  shippingNumber?: string
  transferDate: string | Date
  remark?: string
}

export interface WmTransferUpdateReqVO extends WmTransferCreateReqVO {
  id: number
}

/** 查询转移单分页 */
export function getTransferPage(params: WmTransferQueryParams) {
  return http.get<PageResult<WmTransferVO>>('/mes/wm/transfer/page', params)
}

/** 查询转移单详情 */
export function getTransfer(id: number) {
  return http.get<WmTransferVO>(`/mes/wm/transfer/get?id=${id}`)
}

/** 新增转移单 */
export function createTransfer(data: WmTransferCreateReqVO) {
  return http.post<number>('/mes/wm/transfer/create', data)
}

/** 修改转移单 */
export function updateTransfer(data: WmTransferUpdateReqVO) {
  return http.put<boolean>('/mes/wm/transfer/update', data)
}

/** 删除转移单 */
export function deleteTransfer(id: number) {
  return http.delete<boolean>(`/mes/wm/transfer/delete?id=${id}`)
}

/** 提交转移单 */
export function submitTransfer(id: number) {
  return http.put<boolean>(`/mes/wm/transfer/submit?id=${id}`)
}

/** 到货确认 */
export function confirmTransfer(id: number) {
  return http.put<boolean>(`/mes/wm/transfer/confirm?id=${id}`)
}

/** 执行上架 */
export function stockTransfer(id: number) {
  return http.put<boolean>(`/mes/wm/transfer/stock?id=${id}`)
}

/** 完成转移 */
export function finishTransfer(id: number) {
  return http.put<boolean>(`/mes/wm/transfer/finish?id=${id}`)
}

/** 取消转移单 */
export function cancelTransfer(id: number) {
  return http.put<boolean>(`/mes/wm/transfer/cancel?id=${id}`)
}

/** 导出转移单 Excel */
export function exportTransfer(params: WmTransferQueryParams) {
  return http.get<Blob>('/mes/wm/transfer/export-excel', params)
}

export const WmTransferApi = {
  getTransferPage,
  getTransfer,
  createTransfer,
  updateTransfer,
  deleteTransfer,
  submitTransfer,
  confirmTransfer,
  stockTransfer,
  finishTransfer,
  cancelTransfer,
  exportTransfer,
}
