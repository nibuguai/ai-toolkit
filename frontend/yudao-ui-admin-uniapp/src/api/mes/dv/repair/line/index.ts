import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface DvRepairLineQueryParams extends PageParam {
  repairId?: number
}

// MES 维修工单行 VO
export interface DvRepairLineVO {
  id: number // 编号
  repairId: number // 维修工单编号
  subjectId: number // 项目编号
  subjectName?: string // 项目名称
  subjectContent?: string // 项目内容
  subjectStandard?: string // 项目标准
  malfunction?: string // 故障描述
  malfunctionUrl?: string // 故障图片 URL
  description?: string // 维修描述
  remark?: string // 备注
}

export interface DvRepairLineCreateReqVO {
  repairId: number
  subjectId?: number
  malfunction?: string
  malfunctionUrl?: string
  description?: string
  remark?: string
}

export interface DvRepairLineUpdateReqVO extends DvRepairLineCreateReqVO {
  id: number
}

/** 查询维修工单行分页 */
export function getRepairLinePage(params: DvRepairLineQueryParams) {
  return http.get<PageResult<DvRepairLineVO>>('/mes/dv/repair-line/page', params)
}

/** 查询维修工单行详情 */
export function getRepairLine(id: number) {
  return http.get<DvRepairLineVO>(`/mes/dv/repair-line/get?id=${id}`)
}

/** 新增维修工单行 */
export function createRepairLine(data: DvRepairLineCreateReqVO) {
  return http.post<number>('/mes/dv/repair-line/create', data)
}

/** 修改维修工单行 */
export function updateRepairLine(data: DvRepairLineUpdateReqVO) {
  return http.put<boolean>('/mes/dv/repair-line/update', data)
}

/** 删除维修工单行 */
export function deleteRepairLine(id: number) {
  return http.delete<boolean>(`/mes/dv/repair-line/delete?id=${id}`)
}

export const DvRepairLineApi = {
  getRepairLinePage,
  getRepairLine,
  createRepairLine,
  updateRepairLine,
  deleteRepairLine,
}
