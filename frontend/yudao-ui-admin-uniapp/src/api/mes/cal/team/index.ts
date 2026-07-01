import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 班组分页参数 */
export interface CalTeamQueryParams extends PageParam {
  code?: string
  name?: string
  calendarType?: number
}

/** MES 班组 VO */
export interface CalTeamVO {
  id?: number
  code: string // 班组编码
  name: string // 班组名称
  calendarType: number // 班组类型
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** MES 班组创建参数 */
export interface CalTeamCreateReqVO {
  code: string
  name: string
  calendarType: number
  remark?: string
}

/** MES 班组更新参数 */
export interface CalTeamUpdateReqVO extends CalTeamCreateReqVO {
  id: number
}

/** 查询班组分页 */
export function getTeamPage(params: CalTeamQueryParams) {
  return http.get<PageResult<CalTeamVO>>(`/mes/cal/team/page`, params)
}

/** 查询班组详情 */
export function getTeam(id: number) {
  return http.get<CalTeamVO>(`/mes/cal/team/get?id=${id}`)
}

/** 新增班组 */
export function createTeam(data: CalTeamCreateReqVO) {
  return http.post<number>(`/mes/cal/team/create`, data)
}

/** 修改班组 */
export function updateTeam(data: CalTeamUpdateReqVO) {
  return http.put<boolean>(`/mes/cal/team/update`, data)
}

/** 删除班组 */
export function deleteTeam(id: number) {
  return http.delete<boolean>(`/mes/cal/team/delete?id=${id}`)
}

/** 获得班组列表（全量，用于下拉选择） */
export function getTeamList() {
  return http.get<CalTeamVO[]>(`/mes/cal/team/list`)
}

/** 导出班组 Excel */
export function exportTeam(params: Partial<CalTeamQueryParams>) {
  return http.get<Blob>(`/mes/cal/team/export-excel`, params)
}

export const CalTeamApi = {
  getTeamPage,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamList,
  exportTeam,
}
