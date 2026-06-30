import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface DvMaintenRecordLineQueryParams extends PageParam {
  recordId?: number
}

// MES 设备保养记录明细 VO
export interface DvMaintenRecordLineVO {
  id: number // 编号
  recordId: number // 保养记录编号
  subjectId: number // 项目编号
  subjectCode?: string // 项目编码
  subjectName?: string // 项目名称
  subjectContent?: string // 项目内容
  subjectStandard?: string // 项目标准
  status: number // 保养结果
  result?: string // 异常描述
  remark?: string // 备注
}

export interface DvMaintenRecordLineCreateReqVO {
  recordId: number
  subjectId?: number
  status?: number
  result?: string
  remark?: string
}

export interface DvMaintenRecordLineUpdateReqVO extends DvMaintenRecordLineCreateReqVO {
  id: number
}

/** 查询设备保养记录明细分页 */
export function getMaintenRecordLinePage(params: DvMaintenRecordLineQueryParams) {
  return http.get<PageResult<DvMaintenRecordLineVO>>('/mes/dv/mainten-record-line/page', params)
}

/** 查询设备保养记录明细详情 */
export function getMaintenRecordLine(id: number) {
  return http.get<DvMaintenRecordLineVO>(`/mes/dv/mainten-record-line/get?id=${id}`)
}

/** 新增设备保养记录明细 */
export function createMaintenRecordLine(data: DvMaintenRecordLineCreateReqVO) {
  return http.post<number>('/mes/dv/mainten-record-line/create', data)
}

/** 修改设备保养记录明细 */
export function updateMaintenRecordLine(data: DvMaintenRecordLineUpdateReqVO) {
  return http.put<boolean>('/mes/dv/mainten-record-line/update', data)
}

/** 删除设备保养记录明细 */
export function deleteMaintenRecordLine(id: number) {
  return http.delete<boolean>(`/mes/dv/mainten-record-line/delete?id=${id}`)
}

export const DvMaintenRecordLineApi = {
  getMaintenRecordLinePage,
  getMaintenRecordLine,
  createMaintenRecordLine,
  updateMaintenRecordLine,
  deleteMaintenRecordLine,
}
