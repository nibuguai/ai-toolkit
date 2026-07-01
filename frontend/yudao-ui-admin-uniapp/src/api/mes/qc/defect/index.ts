import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 缺陷类型 */
export interface QcDefectVO {
  id: number // 编号
  code: string // 缺陷编码
  name: string // 缺陷描述
  type: number // 检测项类型
  level: number // 缺陷等级
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** MES 缺陷类型分页参数 */
export interface QcDefectPageParam extends PageParam {
  code?: string
  name?: string
  type?: number
  level?: number
}

/** MES 缺陷类型创建参数 */
export interface QcDefectCreateReqVO {
  code: string
  name: string
  type: number
  level: number
  remark?: string
}

/** MES 缺陷类型更新参数 */
export interface QcDefectUpdateReqVO extends QcDefectCreateReqVO {
  id: number
}

/** 查询缺陷类型分页 */
export function getDefectPage(params: QcDefectPageParam) {
  return http.get<PageResult<QcDefectVO>>(`/mes/qc/defect/page`, params)
}

/** 查询缺陷类型精简列表 */
export function getDefectSimpleList() {
  return http.get<QcDefectVO[]>(`/mes/qc/defect/simple-list`)
}

/** 查询缺陷类型详情 */
export function getDefect(id: number) {
  return http.get<QcDefectVO>(`/mes/qc/defect/get?id=${id}`)
}

/** 新增缺陷类型 */
export function createDefect(data: QcDefectCreateReqVO) {
  return http.post<number>(`/mes/qc/defect/create`, data)
}

/** 修改缺陷类型 */
export function updateDefect(data: QcDefectUpdateReqVO) {
  return http.put<boolean>(`/mes/qc/defect/update`, data)
}

/** 删除缺陷类型 */
export function deleteDefect(id: number) {
  return http.delete<boolean>(`/mes/qc/defect/delete?id=${id}`)
}

/** 导出缺陷类型 Excel */
export function exportDefect(params: QcDefectPageParam) {
  return http.get<Blob>(`/mes/qc/defect/export-excel`, params)
}

export const QcDefectApi = {
  getDefectPage,
  getDefectSimpleList,
  getDefect,
  createDefect,
  updateDefect,
  deleteDefect,
  exportDefect,
}
