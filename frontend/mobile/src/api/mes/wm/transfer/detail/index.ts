import { http } from '@/http/http'

// MES 调拨明细 VO
export interface WmTransferDetailVO {
  id: number
  lineId: number
  transferId: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitName?: string
  unitMeasureName?: string
  quantity: number
  batchId: number
  batchCode?: string
  toWarehouseId: number
  toWarehouseName?: string
  toLocationId: number
  toLocationName?: string
  toAreaId: number
  toAreaName?: string
  remark?: string
  createTime?: string
}

export interface WmTransferDetailCreateReqVO {
  lineId: number
  transferId: number
  itemId: number
  quantity: number
  batchId?: number
  toWarehouseId: number
  toLocationId: number
  toAreaId: number
  remark?: string
}

export interface WmTransferDetailUpdateReqVO extends WmTransferDetailCreateReqVO {
  id: number
}

/** 查询调拨明细列表（按行编号） */
export function getTransferDetailListByLineId(lineId: number) {
  return http.get<WmTransferDetailVO[]>('/mes/wm/transfer-detail/list-by-line', { lineId })
}

/** 查询调拨明细详情 */
export function getTransferDetail(id: number) {
  return http.get<WmTransferDetailVO>(`/mes/wm/transfer-detail/get?id=${id}`)
}

/** 新增调拨明细 */
export function createTransferDetail(data: WmTransferDetailCreateReqVO) {
  return http.post<number>('/mes/wm/transfer-detail/create', data)
}

/** 修改调拨明细 */
export function updateTransferDetail(data: WmTransferDetailUpdateReqVO) {
  return http.put<boolean>('/mes/wm/transfer-detail/update', data)
}

/** 删除调拨明细 */
export function deleteTransferDetail(id: number) {
  return http.delete<boolean>(`/mes/wm/transfer-detail/delete?id=${id}`)
}

export const WmTransferDetailApi = {
  getTransferDetailListByLineId,
  getTransferDetail,
  createTransferDetail,
  updateTransferDetail,
  deleteTransferDetail,
}
