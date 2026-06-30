import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 生产流转卡分页参数 */
export interface ProCardQueryParams extends PageParam {
  code?: string
  workOrderId?: number
  itemId?: number
  batchCode?: string
}

/** MES 生产流转卡 VO */
export interface ProCardVO {
  id: number // 编号
  code?: string // 流转卡编码
  workOrderId: number // 生产工单编号
  workOrderCode?: string // 工单编码
  workOrderName?: string // 工单名称
  itemId: number // 产品物料编号
  batchCode?: string // 批次号
  itemCode?: string // 产品编码
  itemName?: string // 产品名称
  specification?: string // 规格型号
  unitMeasureId?: number // 单位编号
  unitMeasureName?: string // 单位名称
  transferedQuantity: number // 流转数量
  status?: number // 状态
  remark?: string // 备注
  createTime?: number | string // 创建时间
}

/** MES 生产流转卡创建参数 */
export interface ProCardCreateReqVO {
  code: string
  workOrderId: number
  itemId: number
  batchCode?: string
  transferedQuantity: number
  remark?: string
}

/** MES 生产流转卡更新参数 */
export interface ProCardUpdateReqVO extends ProCardCreateReqVO {
  id: number
}

/** 查询生产流转卡分页 */
export function getCardPage(params: ProCardQueryParams) {
  return http.get<PageResult<ProCardVO>>('/mes/pro/card/page', params)
}

/** 查询生产流转卡详情 */
export function getCard(id: number) {
  return http.get<ProCardVO>(`/mes/pro/card/get?id=${id}`)
}

/** 新增生产流转卡 */
export function createCard(data: ProCardCreateReqVO) {
  return http.post<number>('/mes/pro/card/create', data)
}

/** 修改生产流转卡 */
export function updateCard(data: ProCardUpdateReqVO) {
  return http.put<boolean>('/mes/pro/card/update', data)
}

/** 删除生产流转卡 */
export function deleteCard(id: number) {
  return http.delete<boolean>(`/mes/pro/card/delete?id=${id}`)
}

/** 导出生产流转卡 Excel */
export function exportCard(params: Partial<ProCardQueryParams>) {
  return http.get<Blob>('/mes/pro/card/export-excel', params)
}

/** 提交生产流转卡 */
export function submitCard(id: number) {
  return http.put<boolean>(`/mes/pro/card/submit?id=${id}`)
}

/** 完成生产流转卡 */
export function finishCard(id: number) {
  return http.put<boolean>(`/mes/pro/card/finish?id=${id}`)
}

/** 取消生产流转卡 */
export function cancelCard(id: number) {
  return http.put<boolean>(`/mes/pro/card/cancel?id=${id}`)
}

export const ProCardApi = {
  getCardPage,
  getCard,
  createCard,
  updateCard,
  deleteCard,
  exportCard,
  submitCard,
  finishCard,
  cancelCard,
}
