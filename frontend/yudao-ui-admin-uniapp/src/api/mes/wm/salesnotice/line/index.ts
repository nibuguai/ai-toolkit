import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 发货通知单行查询参数 */
export interface WmSalesNoticeLineQueryParams extends PageParam {
  noticeId?: number // 发货通知单编号
}

/** MES 发货通知单行 VO */
export interface WmSalesNoticeLineVO {
  id: number // 行编号
  noticeId: number // 发货通知单编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位名称
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  quantity?: number // 发货数量
  oqcCheckFlag?: boolean // 是否检验
  remark?: string // 备注
  createTime?: string | number // 创建时间
}

/** MES 发货通知单行创建参数 */
export interface WmSalesNoticeLineCreateReqVO {
  noticeId?: number // 发货通知单编号
  itemId?: number // 物料编号
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  quantity?: number // 发货数量
  oqcCheckFlag?: boolean // 是否检验
  remark?: string // 备注
}

/** MES 发货通知单行更新参数 */
export interface WmSalesNoticeLineUpdateReqVO extends WmSalesNoticeLineCreateReqVO {
  id: number // 行编号
}

/** 查询发货通知单行分页 */
export function getSalesNoticeLinePage(params: WmSalesNoticeLineQueryParams) {
  return http.get<PageResult<WmSalesNoticeLineVO>>('/mes/wm/sales-notice-line/page', params)
}

/** 查询发货通知单行详情 */
export function getSalesNoticeLine(id: number) {
  return http.get<WmSalesNoticeLineVO>(`/mes/wm/sales-notice-line/get?id=${id}`)
}

/** 新增发货通知单行 */
export function createSalesNoticeLine(data: WmSalesNoticeLineCreateReqVO) {
  return http.post<number>('/mes/wm/sales-notice-line/create', data)
}

/** 修改发货通知单行 */
export function updateSalesNoticeLine(data: WmSalesNoticeLineUpdateReqVO) {
  return http.put<boolean>('/mes/wm/sales-notice-line/update', data)
}

/** 删除发货通知单行 */
export function deleteSalesNoticeLine(id: number) {
  return http.delete<boolean>(`/mes/wm/sales-notice-line/delete?id=${id}`)
}

export const WmSalesNoticeLineApi = {
  getSalesNoticeLinePage,
  getSalesNoticeLine,
  createSalesNoticeLine,
  updateSalesNoticeLine,
  deleteSalesNoticeLine,
}
