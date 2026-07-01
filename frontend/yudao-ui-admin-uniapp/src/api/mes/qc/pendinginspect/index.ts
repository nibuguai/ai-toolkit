import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface QcPendingInspectPageParam extends PageParam {
  sourceDocCode?: string
  qcType?: number
  itemId?: number
}

export interface QcPendingInspectVO {
  sourceDocType: number
  sourceDocId: number
  sourceLineId: number
  sourceDocCode: string
  qcType: number
  itemId: number
  itemCode: string
  itemName: string
  specification: string
  unitName: string
  quantity: number
  vendorId?: number
  vendorName?: string
  workOrderId?: number
  workstationId?: number
  workstationName?: string
  taskId?: number
  taskCode?: string
  clientId?: number
  clientName?: string
  recordTime: string
}

/** 查询待检任务分页 */
export function getPendingInspectPage(params: QcPendingInspectPageParam) {
  return http.get<PageResult<QcPendingInspectVO>>('/mes/qc/pending-inspect/page', params)
}

export const QcPendingInspectApi = {
  getPendingInspectPage,
}
