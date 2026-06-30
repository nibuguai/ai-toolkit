import { http } from '@/http/http'

export interface DvMachineryTypeVO {
  id: number
  parentId: number
  code: string
  name: string
  sort: number
  status: number
  remark: string | null
  createTime: string | number
  children?: DvMachineryTypeVO[]
  parentName?: string
}

export interface DvMachineryTypeQueryParams {
  name?: string
  status?: number
}

export interface DvMachineryTypeCreateReqVO {
  parentId: number
  code: string
  name: string
  sort: number
  status: number
  remark?: string
}

export interface DvMachineryTypeUpdateReqVO extends DvMachineryTypeCreateReqVO {
  id: number
}

export function getMachineryTypeList(params?: DvMachineryTypeQueryParams) {
  return http.get<DvMachineryTypeVO[]>(`/mes/dv/machinery-type/list`, params)
}

export function getMachineryType(id: number) {
  return http.get<DvMachineryTypeVO>(`/mes/dv/machinery-type/get?id=${id}`)
}

export function createMachineryType(data: DvMachineryTypeCreateReqVO) {
  return http.post<number>(`/mes/dv/machinery-type/create`, data)
}

export function updateMachineryType(data: DvMachineryTypeUpdateReqVO) {
  return http.put<boolean>(`/mes/dv/machinery-type/update`, data)
}

export function deleteMachineryType(id: number) {
  return http.delete<boolean>(`/mes/dv/machinery-type/delete?id=${id}`)
}
