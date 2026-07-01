import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface ProWorkRecordLogQueryParams extends PageParam {
  userId?: number
  workstationId?: number
  type?: number
  createTime?: [string, string]
}

export interface ProWorkRecordLogVO {
  id: number
  userId: number
  userNickname: string
  workstationId: number
  workstationCode: string
  workstationName: string
  type: number
  remark?: string
  createTime: string | number
}

export interface ProWorkRecordVO {
  userId: number
  userNickname: string
  workstationId?: number
  workstationCode?: string
  workstationName?: string
  type?: number
  clockInTime?: string | number
  clockOutTime?: string | number
}

/** 查询工作记录分页 */
export function getWorkRecordLogPage(params: ProWorkRecordLogQueryParams) {
  return http.get<PageResult<ProWorkRecordLogVO>>(`/mes/pro/workrecord/log/page`, params)
}

/** 查询工作记录详情 */
export function getWorkRecordLog(id: number) {
  return http.get<ProWorkRecordLogVO>(`/mes/pro/workrecord/log/get?id=${id}`)
}

/** 导出工作记录 Excel */
export function exportWorkRecordLog(params: Partial<ProWorkRecordLogQueryParams>) {
  return http.get<Blob>(`/mes/pro/workrecord/log/export-excel`, params)
}

/** 上线（绑定工作站） */
export function clockInWorkRecord(workstationId: number) {
  return http.put<number>(`/mes/pro/workrecord/clock-in?workstationId=${workstationId}`)
}

/** 下线（解绑工作站） */
export function clockOutWorkRecord() {
  return http.put<number>(`/mes/pro/workrecord/clock-out`)
}

/** 获取当前用户绑定的工作站 */
export function getMyWorkRecord() {
  return http.get<ProWorkRecordVO | null>(`/mes/pro/workrecord/get-my`)
}

export const ProWorkRecordApi = {
  getWorkRecordLogPage,
  getWorkRecordLog,
  exportWorkRecordLog,
  clockInWorkRecord,
  clockOutWorkRecord,
  getMyWorkRecord,
}
