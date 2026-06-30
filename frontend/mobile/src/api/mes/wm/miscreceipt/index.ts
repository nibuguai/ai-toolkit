import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// MES 杂项入库单 VO
export interface WmMiscReceiptVO {
  id: number
  code: string
  name: string
  type: number
  sourceDocType?: string
  sourceDocId?: number
  sourceDocCode?: string
  receiptDate: string | Date
  status: number
  remark?: string
  createTime?: string | Date
}

export interface WmMiscReceiptQueryParams extends PageParam {
  code?: string
  name?: string
  type?: number
  sourceDocType?: string
  sourceDocCode?: string
  receiptDate?: string[] | Date[]
  status?: number
}

export interface WmMiscReceiptCreateReqVO {
  code: string
  name: string
  type: number
  sourceDocType?: string
  sourceDocId?: number
  sourceDocCode?: string
  receiptDate: string | number | Date
  remark?: string
}

export interface WmMiscReceiptUpdateReqVO extends WmMiscReceiptCreateReqVO {
  id: number
}

/** 查询杂项入库单分页 */
export function getMiscReceiptPage(params: WmMiscReceiptQueryParams) {
  return http.get<PageResult<WmMiscReceiptVO>>('/mes/wm/misc-receipt/page', params)
}

/** 查询杂项入库单详情 */
export function getMiscReceipt(id: number) {
  return http.get<WmMiscReceiptVO>(`/mes/wm/misc-receipt/get?id=${id}`)
}

/** 新增杂项入库单 */
export function createMiscReceipt(data: WmMiscReceiptCreateReqVO) {
  return http.post<number>('/mes/wm/misc-receipt/create', data)
}

/** 修改杂项入库单 */
export function updateMiscReceipt(data: WmMiscReceiptUpdateReqVO) {
  return http.put<boolean>('/mes/wm/misc-receipt/update', data)
}

/** 删除杂项入库单 */
export function deleteMiscReceipt(id: number) {
  return http.delete<boolean>(`/mes/wm/misc-receipt/delete?id=${id}`)
}

/** 提交审批 */
export function submitMiscReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/misc-receipt/submit?id=${id}`)
}

/** 执行入库 */
export function finishMiscReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/misc-receipt/finish?id=${id}`)
}

/** 取消杂项入库单 */
export function cancelMiscReceipt(id: number) {
  return http.put<boolean>(`/mes/wm/misc-receipt/cancel?id=${id}`)
}

/** 导出杂项入库单 Excel */
export function exportMiscReceipt(params: WmMiscReceiptQueryParams) {
  return http.get<Blob>('/mes/wm/misc-receipt/export-excel', params)
}

export const WmMiscReceiptApi = {
  getMiscReceiptPage,
  getMiscReceipt,
  createMiscReceipt,
  updateMiscReceipt,
  deleteMiscReceipt,
  submitMiscReceipt,
  finishMiscReceipt,
  cancelMiscReceipt,
  exportMiscReceipt,
}
