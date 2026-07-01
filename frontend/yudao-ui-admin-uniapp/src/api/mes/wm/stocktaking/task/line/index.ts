import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface StockTakingTaskLineVO {
  id?: number
  taskId: number
  materialStockId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  batchId?: number
  batchCode?: string
  quantity?: number
  takingQuantity?: number
  differenceQuantity?: number
  warehouseId?: number
  warehouseName?: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  status?: number
  remark?: string
}

/** 盘点任务行新增参数 */
export interface StockTakingTaskLineCreateReqVO {
  taskId: number // 盘点任务编号
  materialStockId?: number // 库存记录编号
  itemId: number // 物料编号
  batchId?: number // 批次编号
  quantity: number // 账面数量
  warehouseId: number // 仓库编号
  locationId?: number // 库区编号
  areaId?: number // 库位编号
  remark?: string // 备注
}

/** 盘点任务行修改参数 */
export interface StockTakingTaskLineUpdateReqVO extends StockTakingTaskLineCreateReqVO {
  id: number
}

export interface StockTakingTaskLineSimpleVO {
  id: number
  itemId: number
  itemCode: string
  itemName: string
  specification?: string
  unitMeasureName?: string
  batchCode?: string
  warehouseId: number
  warehouseName: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  quantity: number
}

/** 请求数据 */
export function getStockTakingTaskLinePage(params: PageParam) {
  return http.get<PageResult<StockTakingTaskLineVO>>('/mes/wm/stocktaking-task-line/page', params)
}

/** 请求数据 */
export function getStockTakingTaskLineSimpleList(taskId: number) {
  return http.get<StockTakingTaskLineVO[]>('/mes/wm/stocktaking-task-line/simple-list', { taskId })
}

/** 请求数据 */
export function getStockTakingTaskLine(id: number) {
  return http.get<StockTakingTaskLineVO>('/mes/wm/stocktaking-task-line/get', { id })
}

/** 请求数据 */
export function createStockTakingTaskLine(data: StockTakingTaskLineCreateReqVO) {
  return http.post<number>('/mes/wm/stocktaking-task-line/create', data)
}

/** 请求数据 */
export function updateStockTakingTaskLine(data: StockTakingTaskLineUpdateReqVO) {
  return http.put<boolean>('/mes/wm/stocktaking-task-line/update', data)
}

/** 请求数据 */
export function deleteStockTakingTaskLine(id: number) {
  return http.delete<boolean>(`/mes/wm/stocktaking-task-line/delete?id=${id}`)
}

export const StockTakingTaskLineApi = {
  getStockTakingTaskLinePage,
  getStockTakingTaskLineSimpleList,
  getStockTakingTaskLine,
  createStockTakingTaskLine,
  updateStockTakingTaskLine,
  deleteStockTakingTaskLine,
}
