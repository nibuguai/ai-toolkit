import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface QcTemplateItemPageParam extends PageParam {
  templateId?: number
}

// MES 质检方案-产品关联 VO
export interface QcTemplateItemVO {
  id: number // 编号
  templateId: number // 质检方案ID
  itemId: number // 产品物料ID
  quantityCheck: number // 最低检测数
  quantityUnqualified: number // 最大不合格数
  criticalRate: number // 最大致命缺陷率（%）
  majorRate: number // 最大严重缺陷率（%）
  minorRate: number // 最大轻微缺陷率（%）
  remark: string // 备注
  // JOIN mes_md_item
  itemCode: string // 物料编码
  itemName: string // 物料名称
  specification: string // 规格型号
  unitMeasureName: string // 计量单位名称
  createTime?: string // 创建时间
}

export interface QcTemplateItemCreateReqVO {
  templateId: number
  itemId: number
  quantityCheck?: number
  quantityUnqualified?: number
  criticalRate?: number
  majorRate?: number
  minorRate?: number
  remark?: string
}

export interface QcTemplateItemUpdateReqVO extends QcTemplateItemCreateReqVO {
  id: number
}

/** 查询产品关联分页 */
export function getTemplateItemPage(params: QcTemplateItemPageParam) {
  return http.get<PageResult<QcTemplateItemVO>>(`/mes/qc/template/item/page`, params)
}

/** 查询产品关联详情 */
export function getTemplateItem(id: number) {
  return http.get<QcTemplateItemVO>(`/mes/qc/template/item/get?id=${id}`)
}

/** 新增产品关联 */
export function createTemplateItem(data: QcTemplateItemCreateReqVO) {
  return http.post<number>(`/mes/qc/template/item/create`, data)
}

/** 修改产品关联 */
export function updateTemplateItem(data: QcTemplateItemUpdateReqVO) {
  return http.put<boolean>(`/mes/qc/template/item/update`, data)
}

/** 删除产品关联 */
export function deleteTemplateItem(id: number) {
  return http.delete<boolean>(`/mes/qc/template/item/delete?id=${id}`)
}

export const QcTemplateItemApi = {
  getTemplateItemPage,
  getTemplateItem,
  createTemplateItem,
  updateTemplateItem,
  deleteTemplateItem,
}
