import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 盘点方案分页查询参数 */
export interface StockTakingPlanQueryParams extends PageParam {
  code?: string // 方案编码
  name?: string // 方案名称
  type?: number // 盘点类型
  status?: number // 状态
}

/** 盘点方案新增参数 */
export interface StockTakingPlanCreateReqVO {
  code: string // 方案编码
  name: string // 方案名称
  type: number // 盘点类型
  startTime?: string | number | Date // 计划开始时间
  endTime?: string | number | Date // 计划结束时间
  blindFlag: boolean // 是否盲盘
  frozen: boolean // 是否冻结库存
  remark?: string // 备注
}

/** 盘点方案修改参数 */
export interface StockTakingPlanUpdateReqVO extends StockTakingPlanCreateReqVO {
  id: number
}

/** 盘点方案 VO */
export interface StockTakingPlanVO {
  id: number
  code: string
  name: string
  type: number
  startTime?: string | number
  endTime?: string | number
  blindFlag: boolean
  frozen: boolean
  status: number
  remark?: string
  createTime?: string | number
}

/** 盘点方案参数分页查询参数 */
export interface StockTakingPlanParamQueryParams extends PageParam {
  planId: number // 方案编号
}

/** 盘点方案参数 VO */
export interface StockTakingPlanParamVO {
  id: number
  planId: number
  type: number
  valueId?: number
  valueCode?: string
  valueName?: string
  remark?: string
}

/** 盘点方案参数新增参数 */
export interface StockTakingPlanParamCreateReqVO {
  planId: number // 方案编号
  type: number // 参数类型
  valueId?: number // 参数值编号
  valueCode?: string // 参数值编码
  valueName?: string // 参数值名称
  remark?: string // 备注
}

/** 盘点方案参数修改参数 */
export interface StockTakingPlanParamUpdateReqVO extends StockTakingPlanParamCreateReqVO {
  id: number
}

/** 更新盘点方案状态 */
export function updateStockTakingPlanStatus(id: number, status: number) {
  return http.put<boolean>(`/mes/wm/stocktaking-plan/update-status?id=${id}&status=${status}`)
}

/** 获取盘点方案分页 */
export function getStockTakingPlanPage(params: StockTakingPlanQueryParams) {
  return http.get<PageResult<StockTakingPlanVO>>('/mes/wm/stocktaking-plan/page', params)
}

/** 获取盘点方案详情 */
export function getStockTakingPlan(id: number) {
  return http.get<StockTakingPlanVO>(`/mes/wm/stocktaking-plan/get?id=${id}`)
}

/** 创建盘点方案 */
export function createStockTakingPlan(data: StockTakingPlanCreateReqVO) {
  return http.post<number>('/mes/wm/stocktaking-plan/create', data)
}

/** 修改盘点方案 */
export function updateStockTakingPlan(data: StockTakingPlanUpdateReqVO) {
  return http.put<boolean>('/mes/wm/stocktaking-plan/update', data)
}

/** 删除盘点方案 */
export function deleteStockTakingPlan(id: number) {
  return http.delete<boolean>(`/mes/wm/stocktaking-plan/delete?id=${id}`)
}

/** 导出盘点方案 */
export function exportStockTakingPlan(params: StockTakingPlanQueryParams) {
  return http.get<Blob>('/mes/wm/stocktaking-plan/export-excel', params)
}

/** 获取盘点方案参数分页 */
export function getStockTakingPlanParamPage(params: StockTakingPlanParamQueryParams) {
  return http.get<PageResult<StockTakingPlanParamVO>>('/mes/wm/stocktaking-plan-param/page', params)
}

/** 获取盘点方案参数详情 */
export function getStockTakingPlanParam(id: number) {
  return http.get<StockTakingPlanParamVO>(`/mes/wm/stocktaking-plan-param/get?id=${id}`)
}

/** 创建盘点方案参数 */
export function createStockTakingPlanParam(data: StockTakingPlanParamCreateReqVO) {
  return http.post<number>('/mes/wm/stocktaking-plan-param/create', data)
}

/** 修改盘点方案参数 */
export function updateStockTakingPlanParam(data: StockTakingPlanParamUpdateReqVO) {
  return http.put<boolean>('/mes/wm/stocktaking-plan-param/update', data)
}

/** 删除盘点方案参数 */
export function deleteStockTakingPlanParam(id: number) {
  return http.delete<boolean>(`/mes/wm/stocktaking-plan-param/delete?id=${id}`)
}

export const StockTakingPlanApi = {
  updateStockTakingPlanStatus,
  getStockTakingPlanPage,
  getStockTakingPlan,
  createStockTakingPlan,
  updateStockTakingPlan,
  deleteStockTakingPlan,
  exportStockTakingPlan,
}

export const StockTakingPlanParamApi = {
  getStockTakingPlanParamPage,
  getStockTakingPlanParam,
  createStockTakingPlanParam,
  updateStockTakingPlanParam,
  deleteStockTakingPlanParam,
}
