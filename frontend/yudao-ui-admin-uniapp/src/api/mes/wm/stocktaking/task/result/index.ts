import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 盘点结果分页查询参数 */
export interface StockTakingResultQueryParams extends PageParam {
  taskId?: number // 盘点任务编号
  lineId?: number // 盘点清单行编号
  itemId?: number // 物料编号
}

export interface StockTakingResultVO {
  id?: number
  taskId?: number
  lineId?: number
  materialStockId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  batchId?: number
  batchCode?: string
  warehouseId?: number
  warehouseName?: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  quantity?: number
  remark?: string
  createTime?: string
}

/** 盘点结果新增参数 */
export interface StockTakingResultCreateReqVO {
  taskId: number // 盘点任务编号
  lineId?: number // 盘点清单行编号
  materialStockId?: number // 库存记录编号
  itemId: number // 物料编号
  batchId?: number // 批次编号
  batchCode?: string // 批次编码
  warehouseId: number // 仓库编号
  locationId: number // 库区编号
  areaId: number // 库位编号
  takingQuantity: number // 盘点数量
  remark?: string // 备注
}

/** 盘点结果修改参数 */
export interface StockTakingResultUpdateReqVO extends StockTakingResultCreateReqVO {
  id: number
}

/** 请求数据 */
export function getStockTakingResultPage(params: StockTakingResultQueryParams) {
  return http.get<PageResult<StockTakingResultVO>>('/mes/wm/stocktaking-task-result/page', params)
}

/** 请求数据 */
export function getStockTakingResult(id: number) {
  return http.get<StockTakingResultVO>('/mes/wm/stocktaking-task-result/get', { id })
}

/** 请求数据 */
export function createStockTakingResult(data: StockTakingResultCreateReqVO) {
  return http.post<number>('/mes/wm/stocktaking-task-result/create', data)
}

/** 请求数据 */
export function updateStockTakingResult(data: StockTakingResultUpdateReqVO) {
  return http.put<boolean>('/mes/wm/stocktaking-task-result/update', data)
}

/** 请求数据 */
export function deleteStockTakingResult(id: number) {
  return http.delete<boolean>(`/mes/wm/stocktaking-task-result/delete?id=${id}`)
}

export const StockTakingResultApi = {
  getStockTakingResultPage,
  getStockTakingResult,
  createStockTakingResult,
  updateStockTakingResult,
  deleteStockTakingResult,
}
