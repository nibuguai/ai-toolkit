import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 盘点任务分页查询参数 */
export interface StockTakingTaskQueryParams extends PageParam {
  code?: string // 任务编码
  name?: string // 任务名称
  type?: number // 盘点类型
  status?: number // 单据状态
  userId?: number // 盘点人
  planId?: number // 盘点方案
  takingDate?: string[] // 盘点日期范围
}

/** 盘点任务新增参数 */
export interface StockTakingTaskCreateReqVO {
  code: string // 任务编码
  name: string // 任务名称
  takingDate?: string | number | Date // 盘点日期
  type: number // 盘点类型
  userId: number // 盘点人
  planId: number // 盘点方案
  blindFlag: boolean // 是否盲盘
  frozen: boolean // 是否冻结库存
  startTime?: string | number | Date // 动态盘点开始时间
  endTime?: string | number | Date // 动态盘点结束时间
  remark?: string // 备注
}

/** 盘点任务修改参数 */
export interface StockTakingTaskUpdateReqVO extends StockTakingTaskCreateReqVO {
  id: number
}

/** 盘点任务 VO */
export interface StockTakingTaskVO {
  id: number
  code: string
  name: string
  takingDate?: string | number
  type: number
  userId: number
  userNickname?: string
  planId: number
  planCode?: string
  planName?: string
  blindFlag: boolean
  frozen: boolean
  startTime?: string | number
  endTime?: string | number
  status: number
  remark?: string
  createTime?: string | number
}

/** 获取盘点任务分页 */
export function getStockTakingPage(params: StockTakingTaskQueryParams) {
  return http.get<PageResult<StockTakingTaskVO>>('/mes/wm/stocktaking-task/page', params)
}

/** 获取盘点任务详情 */
export function getStockTaking(id: number) {
  return http.get<StockTakingTaskVO>(`/mes/wm/stocktaking-task/get?id=${id}`)
}

/** 创建盘点任务 */
export function createStockTaking(data: StockTakingTaskCreateReqVO) {
  return http.post<number>('/mes/wm/stocktaking-task/create', data)
}

/** 修改盘点任务 */
export function updateStockTaking(data: StockTakingTaskUpdateReqVO) {
  return http.put<boolean>('/mes/wm/stocktaking-task/update', data)
}

/** 删除盘点任务 */
export function deleteStockTaking(id: number) {
  return http.delete<boolean>(`/mes/wm/stocktaking-task/delete?id=${id}`)
}

/** 提交盘点任务 */
export function submitStockTaking(id: number) {
  return http.put<boolean>(`/mes/wm/stocktaking-task/submit?id=${id}`)
}

/** 取消盘点任务 */
export function cancelStockTaking(id: number) {
  return http.put<boolean>(`/mes/wm/stocktaking-task/cancel?id=${id}`)
}

/** 完成盘点任务 */
export function finishStockTaking(id: number) {
  return http.put<boolean>('/mes/wm/stocktaking-task/finish', { id })
}

/** 导出盘点任务 */
export function exportStockTaking(params: StockTakingTaskQueryParams) {
  return http.get<Blob>('/mes/wm/stocktaking-task/export-excel', params)
}

export const StockTakingApi = {
  getStockTakingPage,
  getStockTaking,
  createStockTaking,
  updateStockTaking,
  deleteStockTaking,
  submitStockTaking,
  cancelStockTaking,
  finishStockTaking,
  exportStockTaking,
}
