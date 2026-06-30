import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface TmToolQueryParams extends PageParam {
  code?: string
  name?: string
  brand?: string
  specification?: string
  toolTypeId?: number
  status?: number
}

export interface TmToolVO {
  id: number
  code: string
  name: string
  brand?: string | null
  specification?: string | null
  toolTypeId: number
  toolTypeName?: string
  quantity: number
  availableQuantity: number
  maintenType?: number | null
  nextMaintenPeriod?: number | null
  nextMaintenDate?: string | number | null
  status: number
  remark?: string | null
  createTime?: string | number
}

export interface TmToolCreateReqVO {
  code: string
  name: string
  brand?: string
  specification?: string
  toolTypeId: number
  quantity: number
  availableQuantity: number
  maintenType?: number
  nextMaintenPeriod?: number
  nextMaintenDate?: string | number
  status: number
  remark?: string
}

export interface TmToolUpdateReqVO extends TmToolCreateReqVO {
  id: number
}

export function getToolPage(params: TmToolQueryParams) {
  return http.get<PageResult<TmToolVO>>(`/mes/tm/tool/page`, params)
}

export function getTool(id: number) {
  return http.get<TmToolVO>(`/mes/tm/tool/get?id=${id}`)
}

export function exportTool(params: TmToolQueryParams) {
  return http.get<Blob>(`/mes/tm/tool/export-excel`, params)
}

export function createTool(data: TmToolCreateReqVO) {
  return http.post<number>(`/mes/tm/tool/create`, data)
}

export function updateTool(data: TmToolUpdateReqVO) {
  return http.put<boolean>(`/mes/tm/tool/update`, data)
}

export function deleteTool(id: number) {
  return http.delete<boolean>(`/mes/tm/tool/delete?id=${id}`)
}
