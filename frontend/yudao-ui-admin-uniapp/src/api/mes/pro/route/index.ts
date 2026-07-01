import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// MES 工艺路线 VO
export interface ProRouteVO {
  id?: number // 编号
  code: string // 工艺路线编码
  name: string // 工艺路线名称
  description?: string // 工艺路线说明
  status?: number // 状态
  remark?: string // 备注
  createTime?: number | string // 创建时间
}

export interface ProRouteQueryParams extends PageParam {
  code?: string // 工艺路线编码
  name?: string // 工艺路线名称
  status?: number // 状态
}

export interface ProRouteCreateReqVO {
  code: string // 工艺路线编码
  name: string // 工艺路线名称
  description?: string // 工艺路线说明
  remark?: string // 备注
}

export interface ProRouteUpdateReqVO extends ProRouteCreateReqVO {
  id: number // 编号
}

/** 查询工艺路线分页 */
export function getRoutePage(params: ProRouteQueryParams) {
  return http.get<PageResult<ProRouteVO>>('/mes/pro/route/page', params)
}

/** 查询工艺路线精简列表 */
export function getRouteSimpleList() {
  return http.get<ProRouteVO[]>('/mes/pro/route/simple-list')
}

/** 查询工艺路线详情 */
export function getRoute(id: number) {
  return http.get<ProRouteVO>(`/mes/pro/route/get?id=${id}`)
}

/** 新增工艺路线 */
export function createRoute(data: ProRouteCreateReqVO) {
  return http.post<number>('/mes/pro/route/create', data)
}

/** 修改工艺路线 */
export function updateRoute(data: ProRouteUpdateReqVO) {
  return http.put<boolean>('/mes/pro/route/update', data)
}

/** 修改工艺路线状态 */
export function updateRouteStatus(id: number, status: number) {
  return http.put<boolean>(`/mes/pro/route/update-status?id=${id}&status=${status}`)
}

/** 删除工艺路线 */
export function deleteRoute(id: number) {
  return http.delete<boolean>(`/mes/pro/route/delete?id=${id}`)
}

/** 导出工艺路线 Excel */
export function exportRoute(params: ProRouteQueryParams) {
  return http.get<Blob>('/mes/pro/route/export-excel', params)
}

export const ProRouteApi = {
  getRoutePage,
  getRouteSimpleList,
  getRoute,
  createRoute,
  updateRoute,
  updateRouteStatus,
  deleteRoute,
  exportRoute,
}
