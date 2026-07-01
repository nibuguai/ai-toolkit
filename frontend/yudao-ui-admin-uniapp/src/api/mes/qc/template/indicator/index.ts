import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface QcTemplateIndicatorPageParam extends PageParam {
  templateId?: number
}

// MES 质检方案-检测指标项 VO
export interface QcTemplateIndicatorVO {
  id: number // 编号
  templateId: number // 质检方案ID
  indicatorId: number // 质检指标ID
  checkMethod: string // 检测方法
  standardValue: number // 标准值
  unitMeasureId: number // 计量单位ID
  thresholdMax: number // 误差上限
  thresholdMin: number // 误差下限
  docUrl: string // 说明图URL
  remark: string // 备注
  // JOIN mes_qc_indicator
  indicatorCode: string // 检测项编码
  indicatorName: string // 检测项名称
  indicatorType: number // 检测项类型
  indicatorTool: string // 检测工具
  // JOIN mes_md_unit_measure
  unitMeasureName: string // 计量单位名称
  createTime?: string // 创建时间
}

export interface QcTemplateIndicatorCreateReqVO {
  templateId: number
  indicatorId: number
  checkMethod?: string
  standardValue?: number
  unitMeasureId?: number
  thresholdMax?: number
  thresholdMin?: number
  docUrl?: string
  remark?: string
}

export interface QcTemplateIndicatorUpdateReqVO extends QcTemplateIndicatorCreateReqVO {
  id: number
}

/** 查询检测指标项分页 */
export function getTemplateIndicatorPage(params: QcTemplateIndicatorPageParam) {
  return http.get<PageResult<QcTemplateIndicatorVO>>(`/mes/qc/template/indicator/page`, params)
}

/** 查询检测指标项详情 */
export function getTemplateIndicator(id: number) {
  return http.get<QcTemplateIndicatorVO>(`/mes/qc/template/indicator/get?id=${id}`)
}

/** 新增检测指标项 */
export function createTemplateIndicator(data: QcTemplateIndicatorCreateReqVO) {
  return http.post<number>(`/mes/qc/template/indicator/create`, data)
}

/** 修改检测指标项 */
export function updateTemplateIndicator(data: QcTemplateIndicatorUpdateReqVO) {
  return http.put<boolean>(`/mes/qc/template/indicator/update`, data)
}

/** 删除检测指标项 */
export function deleteTemplateIndicator(id: number) {
  return http.delete<boolean>(`/mes/qc/template/indicator/delete?id=${id}`)
}

export const QcTemplateIndicatorApi = {
  getTemplateIndicatorPage,
  getTemplateIndicator,
  createTemplateIndicator,
  updateTemplateIndicator,
  deleteTemplateIndicator,
}
