import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 库存台账查询参数 */
export interface WmMaterialStockQueryParams extends PageParam {
  virtualFilter?: 'all' | 'exclude' | 'only' // 虚拟仓过滤模式
  itemTypeId?: number // 物料分类编号
  itemId?: number // 物料编号
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  warehouseId?: number // 仓库编号
  locationId?: number // 库区编号
  areaId?: number // 库位编号
  vendorId?: number // 供应商编号
  frozen?: boolean // 是否冻结
}

/** MES 库存台账 VO */
export interface WmMaterialStockVO {
  id: number
  itemTypeId?: number
  itemId: number
  itemCode: string
  itemName: string
  specification?: string
  unitMeasureName?: string
  batchId?: number
  batchCode?: string
  warehouseId: number
  warehouseCode?: string
  warehouseName: string
  locationId: number
  locationName: string
  areaId?: number
  areaName?: string
  vendorId?: number
  vendorName?: string
  quantity: number
  receiptTime?: string
  frozen: boolean
  createTime?: string
}

/** 查询库存台账分页 */
export function getMaterialStockPage(params: WmMaterialStockQueryParams) {
  return http.get<PageResult<WmMaterialStockVO>>('/mes/wm/material-stock/page', params)
}

/** 查询库存记录详情 */
export function getMaterialStock(id: number) {
  return http.get<WmMaterialStockVO>(`/mes/wm/material-stock/get?id=${id}`)
}

/** 更新库存冻结状态 */
export function updateMaterialStockFrozen(data: { frozen: boolean, id: number }) {
  return http.put<boolean>('/mes/wm/material-stock/update-frozen', data)
}

/** 导出库存台账 Excel */
export function exportMaterialStock(params: WmMaterialStockQueryParams) {
  return http.get<Blob>('/mes/wm/material-stock/export-excel', params)
}

export const WmMaterialStockApi = {
  getMaterialStockPage,
  getMaterialStock,
  updateMaterialStockFrozen,
  exportMaterialStock,
}
