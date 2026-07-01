import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 供应商查询参数 */
export interface MdVendorQueryParams extends PageParam {
  code?: string
  name?: string
  nickname?: string
  englishName?: string
  status?: number
}

/** MES 供应商 VO */
export interface MdVendorVO {
  id: number
  code: string
  name: string
  nickname: string | null
  englishName: string | null
  description: string | null
  logo: string | null
  level: string | null
  score: number | null
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

/** MES 供应商创建参数 */
export interface MdVendorCreateReqVO {
  code: string
  name: string
  nickname?: string
  englishName?: string
  description?: string
  logo?: string
  level?: string
  score?: number
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

/** MES 供应商更新参数 */
export interface MdVendorUpdateReqVO extends MdVendorCreateReqVO {
  id: number
}

/** 查询供应商分页 */
export function getVendorPage(params: MdVendorQueryParams) {
  return http.get<PageResult<MdVendorVO>>(`/mes/md-vendor/page`, params)
}

/** 查询供应商详情 */
export function getVendor(id: number) {
  return http.get<MdVendorVO>(`/mes/md-vendor/get?id=${id}`)
}

/** 新增供应商 */
export function createVendor(data: MdVendorCreateReqVO) {
  return http.post<number>(`/mes/md-vendor/create`, data)
}

/** 修改供应商 */
export function updateVendor(data: MdVendorUpdateReqVO) {
  return http.put<boolean>(`/mes/md-vendor/update`, data)
}

/** 删除供应商 */
export function deleteVendor(id: number) {
  return http.delete<boolean>(`/mes/md-vendor/delete?id=${id}`)
}

/** 导出供应商 Excel */
export function exportVendor(params: MdVendorQueryParams) {
  return http.get<Blob>(`/mes/md-vendor/export-excel`, params)
}

export const MdVendorApi = { getVendorPage, getVendor, createVendor, updateVendor, deleteVendor, exportVendor }
