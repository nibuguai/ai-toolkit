import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface DvCheckRecordLineQueryParams extends PageParam {
  recordId?: number
}

// MES 设备点检记录明细 VO
export interface DvCheckRecordLineVO {
  id: number // 编号
  recordId: number // 点检记录编号
  subjectId: number // 点检项目编号
  subjectCode?: string // 项目编码
  subjectName?: string // 项目名称
  subjectContent?: string // 检查内容
  subjectStandard?: string // 检查标准
  checkStatus: number // 点检结果
  checkResult?: string // 异常描述
  remark?: string // 备注
}

export interface DvCheckRecordLineCreateReqVO {
  recordId: number
  subjectId?: number
  checkStatus?: number
  checkResult?: string
  remark?: string
}

export interface DvCheckRecordLineUpdateReqVO extends DvCheckRecordLineCreateReqVO {
  id: number
}

/** 查询设备点检记录明细分页 */
export function getCheckRecordLinePage(params: DvCheckRecordLineQueryParams) {
  return http.get<PageResult<DvCheckRecordLineVO>>('/mes/dv/check-record-line/page', params)
}

/** 查询设备点检记录明细详情 */
export function getCheckRecordLine(id: number) {
  return http.get<DvCheckRecordLineVO>(`/mes/dv/check-record-line/get?id=${id}`)
}

/** 新增设备点检记录明细 */
export function createCheckRecordLine(data: DvCheckRecordLineCreateReqVO) {
  return http.post<number>('/mes/dv/check-record-line/create', data)
}

/** 修改设备点检记录明细 */
export function updateCheckRecordLine(data: DvCheckRecordLineUpdateReqVO) {
  return http.put<boolean>('/mes/dv/check-record-line/update', data)
}

/** 删除设备点检记录明细 */
export function deleteCheckRecordLine(id: number) {
  return http.delete<boolean>(`/mes/dv/check-record-line/delete?id=${id}`)
}

export const DvCheckRecordLineApi = {
  getCheckRecordLinePage,
  getCheckRecordLine,
  createCheckRecordLine,
  updateCheckRecordLine,
  deleteCheckRecordLine,
}
