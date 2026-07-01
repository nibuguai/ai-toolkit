import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 质检指标 */
export interface QcIndicatorVO {
  id: number // 编号
  code: string // 检测项编码
  name: string // 检测项名称
  type: number // 检测项类型
  tool?: string // 检测工具
  resultType: number // 结果值类型
  resultSpecification?: string // 结果值属性
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** MES 质检指标分页参数 */
export interface QcIndicatorPageParam extends PageParam {
  code?: string
  name?: string
  type?: number
  resultType?: number
}

/** MES 质检指标创建参数 */
export interface QcIndicatorCreateReqVO {
  code: string
  name: string
  type: number
  tool?: string
  resultType: number
  resultSpecification?: string
  remark?: string
}

/** MES 质检指标更新参数 */
export interface QcIndicatorUpdateReqVO extends QcIndicatorCreateReqVO {
  id: number
}

/** 查询质检指标分页 */
export function getIndicatorPage(params: QcIndicatorPageParam) {
  return http.get<PageResult<QcIndicatorVO>>(`/mes/qc/indicator/page`, params)
}

/** 查询质检指标详情 */
export function getIndicator(id: number) {
  return http.get<QcIndicatorVO>(`/mes/qc/indicator/get?id=${id}`)
}

/** 新增质检指标 */
export function createIndicator(data: QcIndicatorCreateReqVO) {
  return http.post<number>(`/mes/qc/indicator/create`, data)
}

/** 修改质检指标 */
export function updateIndicator(data: QcIndicatorUpdateReqVO) {
  return http.put<boolean>(`/mes/qc/indicator/update`, data)
}

/** 删除质检指标 */
export function deleteIndicator(id: number) {
  return http.delete<boolean>(`/mes/qc/indicator/delete?id=${id}`)
}

/** 导出质检指标 Excel */
export function exportIndicator(params: QcIndicatorPageParam) {
  return http.get<Blob>(`/mes/qc/indicator/export-excel`, params)
}

export const QcIndicatorApi = {
  getIndicatorPage,
  getIndicator,
  createIndicator,
  updateIndicator,
  deleteIndicator,
  exportIndicator,
}
