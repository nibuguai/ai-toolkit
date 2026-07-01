import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface MdWorkshopQueryParams extends PageParam {
  code?: string
  name?: string
  status?: number
}

export interface MdWorkshopVO {
  id: number
  code: string
  name: string
  area: number | null
  chargeUserId: number | null
  chargeUserName: string | null
  status: number
  remark: string | null
  createTime: string | number
}

export interface MdWorkshopCreateReqVO {
  code: string
  name: string
  area?: number
  chargeUserId?: number
  status: number
  remark?: string
}

export interface MdWorkshopUpdateReqVO extends MdWorkshopCreateReqVO {
  id: number
}

export function getWorkshopPage(params: MdWorkshopQueryParams) {
  return http.get<PageResult<MdWorkshopVO>>(`/mes/md-workshop/page`, params)
}

export function getWorkshopSimpleList() {
  return http.get<MdWorkshopVO[]>(`/mes/md-workshop/simple-list`)
}

export function getWorkshop(id: number) {
  return http.get<MdWorkshopVO>(`/mes/md-workshop/get?id=${id}`)
}

export function createWorkshop(data: MdWorkshopCreateReqVO) {
  return http.post<number>(`/mes/md-workshop/create`, data)
}

export function updateWorkshop(data: MdWorkshopUpdateReqVO) {
  return http.put<boolean>(`/mes/md-workshop/update`, data)
}

export function deleteWorkshop(id: number) {
  return http.delete<boolean>(`/mes/md-workshop/delete?id=${id}`)
}

export function exportWorkshop(params: MdWorkshopQueryParams) {
  return http.get<Blob>(`/mes/md-workshop/export-excel`, params)
}

export const MdWorkshopApi = {
  getWorkshopPage,
  getWorkshopSimpleList,
  getWorkshop,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  exportWorkshop,
}
