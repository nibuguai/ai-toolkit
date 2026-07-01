import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface DvMachineryQueryParams extends PageParam {
  code?: string
  name?: string
  machineryTypeId?: number
  workshopId?: number
  status?: number
}

export interface DvMachineryVO {
  id: number
  code: string
  name: string
  brand?: string | null
  specification?: string | null
  machineryTypeId: number
  machineryTypeName?: string
  workshopId: number
  workshopName?: string
  status: number
  lastMaintenTime?: string | number | null
  lastCheckTime?: string | number | null
  remark?: string | null
  createTime?: string | number
}

export interface DvMachineryCreateReqVO {
  code: string
  name: string
  brand?: string
  specification?: string
  machineryTypeId: number
  workshopId: number
  status: number
  remark?: string
}

export interface DvMachineryUpdateReqVO extends DvMachineryCreateReqVO {
  id: number
}

export function getMachineryPage(params: DvMachineryQueryParams) {
  return http.get<PageResult<DvMachineryVO>>(`/mes/dv/machinery/page`, params)
}

export function getMachinery(id: number) {
  return http.get<DvMachineryVO>(`/mes/dv/machinery/get?id=${id}`)
}

export function exportMachinery(params: DvMachineryQueryParams) {
  return http.get<Blob>(`/mes/dv/machinery/export-excel`, params)
}

export function createMachinery(data: DvMachineryCreateReqVO) {
  return http.post<number>(`/mes/dv/machinery/create`, data)
}

export function updateMachinery(data: DvMachineryUpdateReqVO) {
  return http.put<boolean>(`/mes/dv/machinery/update`, data)
}

export function deleteMachinery(id: number) {
  return http.delete<boolean>(`/mes/dv/machinery/delete?id=${id}`)
}
