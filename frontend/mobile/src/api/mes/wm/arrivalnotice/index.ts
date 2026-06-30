import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface WmArrivalNoticeQueryParams extends PageParam {
  code?: string
  name?: string
  purchaseOrderCode?: string
  vendorId?: number
  arrivalDate?: string[]
  status?: number
}

// MES 到货通知单 VO
export interface WmArrivalNoticeVO {
  id: number
  code: string
  name: string
  purchaseOrderCode?: string
  vendorId: number
  vendorCode?: string
  vendorName?: string
  arrivalDate?: string | number
  contactName?: string
  contactTelephone?: string
  status?: number
  remark?: string
  createTime?: string | number
}

export interface WmArrivalNoticeCreateReqVO {
  code?: string
  name?: string
  purchaseOrderCode?: string
  vendorId?: number
  arrivalDate?: string | number
  contactName?: string
  contactTelephone?: string
  remark?: string
}

export interface WmArrivalNoticeUpdateReqVO extends WmArrivalNoticeCreateReqVO {
  id: number
}

/** 查询到货通知单分页 */
export function getArrivalNoticePage(params: WmArrivalNoticeQueryParams) {
  return http.get<PageResult<WmArrivalNoticeVO>>('/mes/wm/arrival-notice/page', params)
}

/** 查询到货通知单详情 */
export function getArrivalNotice(id: number) {
  return http.get<WmArrivalNoticeVO>(`/mes/wm/arrival-notice/get?id=${id}`)
}

/** 新增到货通知单 */
export function createArrivalNotice(data: WmArrivalNoticeCreateReqVO) {
  return http.post<number>('/mes/wm/arrival-notice/create', data)
}

/** 修改到货通知单 */
export function updateArrivalNotice(data: WmArrivalNoticeUpdateReqVO) {
  return http.put<boolean>('/mes/wm/arrival-notice/update', data)
}

/** 删除到货通知单 */
export function deleteArrivalNotice(id: number) {
  return http.delete<boolean>(`/mes/wm/arrival-notice/delete?id=${id}`)
}

/** 提交到货通知单 */
export function submitArrivalNotice(id: number) {
  return http.put<boolean>(`/mes/wm/arrival-notice/submit?id=${id}`)
}

/** 导出到货通知单 Excel */
export function exportArrivalNotice(params: WmArrivalNoticeQueryParams) {
  return http.get<Blob>('/mes/wm/arrival-notice/export-excel', params)
}

export const WmArrivalNoticeApi = {
  getArrivalNoticePage,
  getArrivalNotice,
  createArrivalNotice,
  updateArrivalNotice,
  deleteArrivalNotice,
  submitArrivalNotice,
  exportArrivalNotice,
}
