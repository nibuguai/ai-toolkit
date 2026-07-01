import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface MdWorkstationQueryParams extends PageParam {
  code?: string
  name?: string
  workshopId?: number
  processId?: number
  status?: number
}

export interface MdWorkstationVO {
  id: number
  code: string
  name: string
  address: string | null
  workshopId: number
  workshopName: string | null
  processId: number | null
  processName: string | null
  warehouseId: number | null
  locationId: number | null
  areaId: number | null
  status: number
  remark: string | null
  createTime: string | number
}

export interface MdWorkstationCreateReqVO {
  code: string
  name: string
  address?: string
  workshopId: number
  processId: number
  warehouseId?: number
  locationId?: number
  areaId?: number
  status: number
  remark?: string
}

export interface MdWorkstationUpdateReqVO extends MdWorkstationCreateReqVO {
  id: number
}

export function getWorkstationPage(params: MdWorkstationQueryParams) {
  return http.get<PageResult<MdWorkstationVO>>(`/mes/md-workstation/page`, params)
}

export function getWorkstation(id: number) {
  return http.get<MdWorkstationVO>(`/mes/md-workstation/get?id=${id}`)
}

export function createWorkstation(data: MdWorkstationCreateReqVO) {
  return http.post<number>(`/mes/md-workstation/create`, data)
}

export function updateWorkstation(data: MdWorkstationUpdateReqVO) {
  return http.put<boolean>(`/mes/md-workstation/update`, data)
}

export function deleteWorkstation(id: number) {
  return http.delete<boolean>(`/mes/md-workstation/delete?id=${id}`)
}

export function exportWorkstation(params: MdWorkstationQueryParams) {
  return http.get<Blob>(`/mes/md-workstation/export-excel`, params)
}

export const MdWorkstationApi = {
  getWorkstationPage,
  getWorkstation,
  createWorkstation,
  updateWorkstation,
  deleteWorkstation,
  exportWorkstation,
}
