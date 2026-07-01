import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface MdClientQueryParams extends PageParam {
  code?: string
  name?: string
  nickname?: string
  status?: number
}

export interface MdClientVO {
  id: number
  code: string
  name: string
  nickname: string | null
  englishName: string | null
  description: string | null
  logo: string | null
  type: number
  address: string | null
  website: string | null
  email: string | null
  telephone: string | null
  contact1Name: string | null
  contact1Telephone: string | null
  contact1Email: string | null
  contact2Name: string | null
  contact2Telephone: string | null
  contact2Email: string | null
  creditCode: string | null
  status: number
  remark: string | null
  createTime: string | number
}

export interface MdClientCreateReqVO {
  code: string
  name: string
  nickname?: string
  englishName?: string
  description?: string
  logo?: string
  type: number
  address?: string
  website?: string
  email?: string
  telephone?: string
  contact1Name?: string
  contact1Telephone?: string
  contact1Email?: string
  contact2Name?: string
  contact2Telephone?: string
  contact2Email?: string
  creditCode?: string
  status: number
  remark?: string
}

export interface MdClientUpdateReqVO extends MdClientCreateReqVO {
  id: number
}

export function getClientPage(params: MdClientQueryParams) {
  return http.get<PageResult<MdClientVO>>(`/mes/md-client/page`, params)
}
export function getClient(id: number) {
  return http.get<MdClientVO>(`/mes/md-client/get?id=${id}`)
}
export function createClient(data: MdClientCreateReqVO) {
  return http.post<number>(`/mes/md-client/create`, data)
}
export function updateClient(data: MdClientUpdateReqVO) {
  return http.put<boolean>(`/mes/md-client/update`, data)
}
export function deleteClient(id: number) {
  return http.delete<boolean>(`/mes/md-client/delete?id=${id}`)
}
export function exportClient(params: MdClientQueryParams) {
  return http.get<Blob>(`/mes/md-client/export-excel`, params)
}
export const MdClientApi = { getClientPage, getClient, createClient, updateClient, deleteClient, exportClient }
