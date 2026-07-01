import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 到货通知单行查询参数 */
export interface WmArrivalNoticeLineQueryParams extends PageParam {
  noticeId?: number // 到货通知单编号
}

/** MES 到货通知单行 VO */
export interface WmArrivalNoticeLineVO {
  id: number // 行编号
  noticeId: number // 到货通知单编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位
  arrivalQuantity: number // 到货数量
  qualifiedQuantity?: number // 合格数量
  iqcCheckFlag: boolean // 是否需要来料检验
  iqcId?: number // 来料检验单编号
  iqcCode?: string // 来料检验单编码
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** MES 到货通知单行创建参数 */
export interface WmArrivalNoticeLineCreateReqVO {
  noticeId: number // 到货通知单编号
  itemId?: number // 物料编号
  arrivalQuantity?: number // 到货数量
  iqcCheckFlag?: boolean // 是否需要来料检验
  remark?: string // 备注
}

/** MES 到货通知单行更新参数 */
export interface WmArrivalNoticeLineUpdateReqVO extends WmArrivalNoticeLineCreateReqVO {
  id: number // 行编号
}

/** 查询到货通知单行分页 */
export function getArrivalNoticeLinePage(params: WmArrivalNoticeLineQueryParams) {
  return http.get<PageResult<WmArrivalNoticeLineVO>>('/mes/wm/arrival-notice-line/page', params)
}

/** 查询到货通知单行详情 */
export function getArrivalNoticeLine(id: number) {
  return http.get<WmArrivalNoticeLineVO>(`/mes/wm/arrival-notice-line/get?id=${id}`)
}

/** 新增到货通知单行 */
export function createArrivalNoticeLine(data: WmArrivalNoticeLineCreateReqVO) {
  return http.post<number>('/mes/wm/arrival-notice-line/create', data)
}

/** 修改到货通知单行 */
export function updateArrivalNoticeLine(data: WmArrivalNoticeLineUpdateReqVO) {
  return http.put<boolean>('/mes/wm/arrival-notice-line/update', data)
}

/** 删除到货通知单行 */
export function deleteArrivalNoticeLine(id: number) {
  return http.delete<boolean>(`/mes/wm/arrival-notice-line/delete?id=${id}`)
}

export const WmArrivalNoticeLineApi = {
  getArrivalNoticeLinePage,
  getArrivalNoticeLine,
  createArrivalNoticeLine,
  updateArrivalNoticeLine,
  deleteArrivalNoticeLine,
}
