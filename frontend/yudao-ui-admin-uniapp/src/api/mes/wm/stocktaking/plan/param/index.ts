import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface StockTakingPlanParamVO {
  id?: number
  planId?: number
  type?: number
  valueId?: number
  valueCode?: string
  valueName?: string
  remark?: string
}

/** 请求数据 */
export function getStockTakingPlanParam(id: number) {
  return http.get<StockTakingPlanParamVO>('/mes/wm/stocktaking-plan-param/get?id=' + id)
}

/** 请求数据 */
export function getStockTakingPlanParamPage(params: PageParam) {
  return http.get<PageResult<StockTakingPlanParamVO>>('/mes/wm/stocktaking-plan-param/page', params)
}

/** 请求数据 */
export function createStockTakingPlanParam(data: StockTakingPlanParamVO) {
  return http.post<number>('/mes/wm/stocktaking-plan-param/create', data)
}

/** 请求数据 */
export function updateStockTakingPlanParam(data: StockTakingPlanParamVO) {
  return http.put<boolean>('/mes/wm/stocktaking-plan-param/update', data)
}

/** 请求数据 */
export function deleteStockTakingPlanParam(id: number) {
  return http.delete<boolean>('/mes/wm/stocktaking-plan-param/delete?id=' + id)
}

export const StockTakingPlanParamApi = {
  getStockTakingPlanParam,
  getStockTakingPlanParamPage,
  createStockTakingPlanParam,
  updateStockTakingPlanParam,
  deleteStockTakingPlanParam,
}
