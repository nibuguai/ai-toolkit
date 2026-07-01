import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface BatchPageParam extends PageParam {
  code?: string
  itemId?: number
  vendorId?: number
  clientId?: number
  salesOrderCode?: string
  purchaseOrderCode?: string
  workOrderId?: number
  taskId?: number
  workstationId?: number
  toolId?: number
  moldId?: number
  lotNumber?: string
  qualityStatus?: number
  produceDate?: string[]
  expireDate?: string[]
  receiptDate?: string[]
}

export interface BatchVO {
  id: number
  code: string
  itemId: number
  itemCode?: string
  itemName?: string
  itemSpecification?: string
  unitName?: string
  produceDate?: string
  expireDate?: string
  receiptDate?: string
  vendorId?: number
  vendorCode?: string
  vendorName?: string
  clientId?: number
  clientCode?: string
  clientName?: string
  purchaseOrderCode?: string
  salesOrderCode?: string
  workOrderId?: number
  workOrderCode?: string
  taskId?: number
  taskCode?: string
  workstationId?: number
  workstationCode?: string
  toolId?: number
  toolCode?: string
  moldId?: number
  lotNumber?: string
  qualityStatus?: number
  remark?: string
  createTime?: string
}

/** 获取批次详情 */
export function getBatch(id: number) {
  return http.get<BatchVO>(`/mes/wm/batch/get?id=${id}`)
}

/** 获取批次分页 */
export function getBatchPage(params: BatchPageParam) {
  return http.get<PageResult<BatchVO>>('/mes/wm/batch/page', params)
}

/** 向前追溯 */
export function getForwardList(code: string) {
  return http.get<BatchVO[]>('/mes/wm/batch/forward-list', { code })
}

/** 向后追溯 */
export function getBackwardList(code: string) {
  return http.get<BatchVO[]>('/mes/wm/batch/backward-list', { code })
}

export const BatchApi = {
  getBatch,
  getBatchPage,
  getForwardList,
  getBackwardList,
}
