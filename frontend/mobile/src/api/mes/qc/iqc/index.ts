import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface QcIqcPageParam extends PageParam {
  code?: string
  vendorId?: number
  vendorBatch?: string
  itemId?: number
  checkResult?: number
  inspectorUserId?: number
  receiveDate?: string[]
  inspectDate?: string[]
}

export interface QcIqcVO {
  id: number // 编号
  code: string // 检验单编号
  name: string // 检验单名称
  templateId?: number // 检验模板 ID
  sourceDocType?: number // 来源单据类型
  sourceDocId?: number // 来源单据 ID
  sourceLineId?: number // 来源单据行 ID
  sourceDocCode?: string // 来源单据编号
  vendorId: number // 供应商 ID
  vendorNickname?: string // 供应商简称（关联查询）
  vendorBatch?: string // 供应商批次号
  itemId: number // 产品物料 ID
  itemCode?: string // 产品物料编码（关联查询）
  itemName?: string // 产品物料名称（关联查询）
  itemSpecification?: string // 规格型号（关联查询）
  unitName?: string // 单位名称（关联查询）
  receivedQuantity: number // 本次接收数量
  checkQuantity?: number // 本次检测数量
  qualifiedQuantity: number // 合格品数量
  unqualifiedQuantity: number // 不合格品数量
  criticalRate?: number // 致命缺陷率（%）
  majorRate?: number // 严重缺陷率（%）
  minorRate?: number // 轻微缺陷率（%）
  criticalQuantity?: number // 致命缺陷数量
  majorQuantity?: number // 严重缺陷数量
  minorQuantity?: number // 轻微缺陷数量
  checkResult?: number // 检测结果
  receiveDate: Date | string // 来料日期
  inspectDate: Date | string // 检测日期
  inspectorUserId: number // 检测人员用户 ID
  inspectorNickname?: string // 检测人员昵称
  status: number // 状态
  remark?: string // 备注
  createTime?: string // 创建时间
}

export interface QcIqcCreateReqVO {
  code: string
  name: string
  sourceDocType?: number
  sourceDocId?: number
  sourceLineId?: number
  vendorId: number
  vendorBatch?: string
  itemId: number
  receivedQuantity: number
  qualifiedQuantity: number
  unqualifiedQuantity: number
  inspectorUserId: number
  inspectDate: string
  checkResult?: number
  receiveDate: string
  remark?: string
}

export interface QcIqcUpdateReqVO extends QcIqcCreateReqVO {
  id: number
}

/** 查询来料检验单分页 */
export function getIqcPage(params: QcIqcPageParam) {
  return http.get<PageResult<QcIqcVO>>(`/mes/qc/iqc/page`, params)
}

/** 查询来料检验单详情 */
export function getIqc(id: number) {
  return http.get<QcIqcVO>(`/mes/qc/iqc/get?id=${id}`)
}

/** 新增来料检验单 */
export function createIqc(data: QcIqcCreateReqVO) {
  return http.post<number>(`/mes/qc/iqc/create`, data)
}

/** 修改来料检验单 */
export function updateIqc(data: QcIqcUpdateReqVO) {
  return http.put<boolean>(`/mes/qc/iqc/update`, data)
}

/** 完成来料检验单 */
export function finishIqc(id: number) {
  return http.put<boolean>(`/mes/qc/iqc/finish?id=${id}`)
}

/** 删除来料检验单 */
export function deleteIqc(id: number) {
  return http.delete<boolean>(`/mes/qc/iqc/delete?id=${id}`)
}

/** 导出来料检验单 Excel */
export function exportIqc(params: QcIqcPageParam) {
  return http.get<Blob>(`/mes/qc/iqc/export-excel`, params)
}

export const QcIqcApi = {
  getIqcPage,
  getIqc,
  createIqc,
  updateIqc,
  finishIqc,
  deleteIqc,
  exportIqc,
}
