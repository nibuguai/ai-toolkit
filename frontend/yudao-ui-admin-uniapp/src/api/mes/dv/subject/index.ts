import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface DvSubjectQueryParams extends PageParam {
  code?: string
  name?: string
  type?: number
  status?: number
}

export interface DvSubjectVO {
  id: number
  code: string
  name?: string | null
  type: number
  content: string
  standard?: string | null
  status: number
  remark?: string | null
  createTime?: string | number
}

export interface DvSubjectCreateReqVO {
  code: string
  name?: string
  type: number
  content: string
  standard?: string
  status: number
  remark?: string
}

export interface DvSubjectUpdateReqVO extends DvSubjectCreateReqVO {
  id: number
}

/** 查询点检保养项目分页 */
export function getSubjectPage(params: DvSubjectQueryParams) {
  return http.get<PageResult<DvSubjectVO>>(`/mes/dv/subject/page`, params)
}

/** 查询点检保养项目详情 */
export function getSubject(id: number) {
  return http.get<DvSubjectVO>(`/mes/dv/subject/get?id=${id}`)
}

/** 新增点检保养项目 */
export function createSubject(data: DvSubjectCreateReqVO) {
  return http.post<number>(`/mes/dv/subject/create`, data)
}

/** 修改点检保养项目 */
export function updateSubject(data: DvSubjectUpdateReqVO) {
  return http.put<boolean>(`/mes/dv/subject/update`, data)
}

/** 删除点检保养项目 */
export function deleteSubject(id: number) {
  return http.delete<boolean>(`/mes/dv/subject/delete?id=${id}`)
}

/** 导出点检保养项目 Excel */
export function exportSubject(params: DvSubjectQueryParams) {
  return http.get<Blob>(`/mes/dv/subject/export-excel`, params)
}

export const DvSubjectApi = {
  getSubjectPage,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  exportSubject,
}
