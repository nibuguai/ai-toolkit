import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface QcTemplatePageParam extends PageParam {
  code?: string
  name?: string
  type?: number
  status?: number
}

export interface QcTemplateExportParam {
  code?: string
  name?: string
  type?: number
  status?: number
}

// MES 质检方案 VO
export interface QcTemplateVO {
  id: number // 编号
  code: string // 方案编号
  name: string // 方案名称
  types: number[] // 检测种类
  status: number // 状态
  remark: string // 备注
  createTime?: string // 创建时间
}

export interface QcTemplateCreateReqVO {
  code: string
  name: string
  types: number[]
  status: number
  remark?: string
}

export interface QcTemplateUpdateReqVO extends QcTemplateCreateReqVO {
  id: number
}

/** 查询质检方案分页 */
export function getTemplatePage(params: QcTemplatePageParam) {
  return http.get<PageResult<QcTemplateVO>>(`/mes/qc/template/page`, params)
}

/** 查询质检方案详情 */
export function getTemplate(id: number) {
  return http.get<QcTemplateVO>(`/mes/qc/template/get?id=${id}`)
}

/** 新增质检方案 */
export function createTemplate(data: QcTemplateCreateReqVO) {
  return http.post<number>(`/mes/qc/template/create`, data)
}

/** 修改质检方案 */
export function updateTemplate(data: QcTemplateUpdateReqVO) {
  return http.put<boolean>(`/mes/qc/template/update`, data)
}

/** 删除质检方案 */
export function deleteTemplate(id: number) {
  return http.delete<boolean>(`/mes/qc/template/delete?id=${id}`)
}

/** 导出质检方案 Excel */
export function exportTemplate(params: QcTemplateExportParam) {
  return http.get<ArrayBuffer>(`/mes/qc/template/export-excel`, params)
}

export const QcTemplateApi = {
  getTemplatePage,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  exportTemplate,
}
