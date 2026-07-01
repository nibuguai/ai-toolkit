import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface TmToolTypeQueryParams extends PageParam {
  code?: string
  name?: string
  maintenType?: number
}

export interface TmToolTypeVO {
  id: number
  code: string
  name: string
  codeFlag: boolean
  maintenType?: number | null
  maintenPeriod?: number | null
  remark?: string | null
  createTime?: string | number
}

export interface TmToolTypeCreateReqVO {
  code: string
  name: string
  codeFlag: boolean
  maintenType?: number
  maintenPeriod?: number
  remark?: string
}

export interface TmToolTypeUpdateReqVO extends TmToolTypeCreateReqVO {
  id: number
}

export function getToolTypePage(params: TmToolTypeQueryParams) {
  return http.get<PageResult<TmToolTypeVO>>(`/mes/tm/tool-type/page`, params)
}

export function getToolTypeSimpleList() {
  return http.get<TmToolTypeVO[]>(`/mes/tm/tool-type/simple-list`)
}

export function getToolType(id: number) {
  return http.get<TmToolTypeVO>(`/mes/tm/tool-type/get?id=${id}`)
}

export function exportToolType(params: TmToolTypeQueryParams) {
  return http.get<Blob>(`/mes/tm/tool-type/export-excel`, params)
}

export function createToolType(data: TmToolTypeCreateReqVO) {
  return http.post<number>(`/mes/tm/tool-type/create`, data)
}

export function updateToolType(data: TmToolTypeUpdateReqVO) {
  return http.put<boolean>(`/mes/tm/tool-type/update`, data)
}

export function deleteToolType(id: number) {
  return http.delete<boolean>(`/mes/tm/tool-type/delete?id=${id}`)
}
