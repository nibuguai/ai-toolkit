import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface ProAndonRecordQueryParams extends PageParam {
  workstationId?: number
  userId?: number
  handlerUserId?: number
  status?: number
  createTime?: [string, string]
}

export interface ProAndonRecordVO {
  id: number
  configId?: number
  workstationId: number
  workstationCode?: string
  workstationName?: string
  userId: number
  userNickname?: string
  workOrderId?: number
  workOrderCode?: string
  processId?: number
  processName?: string
  reason?: string
  level?: number
  status: number
  handleTime?: string | number
  handlerUserId?: number
  handlerUserNickname?: string
  remark?: string
  createTime?: string | number
}

export interface ProAndonRecordCreateReqVO {
  configId: number
  workstationId: number
  userId: number
  workOrderId?: number
  processId?: number
  remark?: string
}

export interface ProAndonRecordUpdateReqVO {
  id: number
  handleTime?: string | number
  handlerUserId?: number
  remark?: string
  status: number
}

/** 查询安灯记录分页 */
export function getAndonRecordPage(params: ProAndonRecordQueryParams) {
  return http.get<PageResult<ProAndonRecordVO>>(`/mes/pro/andon-record/page`, params)
}

/** 查询安灯记录详情 */
export function getAndonRecord(id: number) {
  return http.get<ProAndonRecordVO>(`/mes/pro/andon-record/get?id=${id}`)
}

/** 新增安灯记录 */
export function createAndonRecord(data: ProAndonRecordCreateReqVO) {
  return http.post<number>(`/mes/pro/andon-record/create`, data)
}

/** 删除安灯记录 */
export function deleteAndonRecord(id: number) {
  return http.delete<boolean>(`/mes/pro/andon-record/delete?id=${id}`)
}

/** 更新安灯记录（保存/已处置） */
export function updateAndonRecord(data: ProAndonRecordUpdateReqVO) {
  return http.put<boolean>(`/mes/pro/andon-record/update`, data)
}

/** 导出安灯记录 Excel */
export function exportAndonRecord(params: Partial<ProAndonRecordQueryParams>) {
  return http.get<Blob>(`/mes/pro/andon-record/export-excel`, params)
}

export const ProAndonRecordApi = {
  getAndonRecordPage,
  getAndonRecord,
  createAndonRecord,
  deleteAndonRecord,
  updateAndonRecord,
  exportAndonRecord,
}
