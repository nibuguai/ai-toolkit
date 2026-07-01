import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface DvCheckPlanQueryParams extends PageParam {
  code?: string
  name?: string
  type?: number
  status?: number
}

export interface DvCheckPlanVO {
  id: number
  code: string
  name: string
  type: number
  startDate?: string | number | null
  endDate?: string | number | null
  cycleType: number
  cycleCount: number
  status: number
  remark?: string | null
  createTime?: string | number
}

export interface DvCheckPlanCreateReqVO {
  code: string
  name: string
  type: number
  startDate?: string | number
  endDate?: string | number
  cycleType: number
  cycleCount: number
  status?: number
  remark?: string
}

export interface DvCheckPlanUpdateReqVO extends DvCheckPlanCreateReqVO {
  id: number
}

/** 查询点检保养方案分页 */
export function getCheckPlanPage(params: DvCheckPlanQueryParams) {
  return http.get<PageResult<DvCheckPlanVO>>('/mes/dv/check-plan/page', params)
}

/** 查询点检保养方案详情 */
export function getCheckPlan(id: number) {
  return http.get<DvCheckPlanVO>(`/mes/dv/check-plan/get?id=${id}`)
}

/** 新增点检保养方案 */
export function createCheckPlan(data: DvCheckPlanCreateReqVO) {
  return http.post<number>('/mes/dv/check-plan/create', data)
}

/** 修改点检保养方案 */
export function updateCheckPlan(data: DvCheckPlanUpdateReqVO) {
  return http.put<boolean>('/mes/dv/check-plan/update', data)
}

/** 启用点检保养方案 */
export function enableCheckPlan(id: number) {
  return http.put<boolean>(`/mes/dv/check-plan/enable?id=${id}`)
}

/** 停用点检保养方案 */
export function disableCheckPlan(id: number) {
  return http.put<boolean>(`/mes/dv/check-plan/disable?id=${id}`)
}

/** 删除点检保养方案 */
export function deleteCheckPlan(id: number) {
  return http.delete<boolean>(`/mes/dv/check-plan/delete?id=${id}`)
}

/** 导出点检保养方案 Excel */
export function exportCheckPlan(params: DvCheckPlanQueryParams) {
  return http.get<Blob>('/mes/dv/check-plan/export-excel', params)
}

export const DvCheckPlanApi = {
  getCheckPlanPage,
  getCheckPlan,
  createCheckPlan,
  updateCheckPlan,
  enableCheckPlan,
  disableCheckPlan,
  deleteCheckPlan,
  exportCheckPlan,
}
