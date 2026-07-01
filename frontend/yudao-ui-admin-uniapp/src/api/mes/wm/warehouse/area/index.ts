import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface WmWarehouseAreaQueryParams extends PageParam {
  code?: string
  name?: string
  warehouseId?: number
  locationId?: number
}

export interface WmWarehouseAreaVO {
  id: number
  code: string
  name: string
  warehouseId: number | null
  warehouseName: string | null
  locationId: number
  locationName: string | null
  area: number | null
  maxLoad: number | null
  positionX: number | null
  positionY: number | null
  positionZ: number | null
  status: number
  frozen: boolean
  allowItemMixing: boolean
  allowBatchMixing: boolean
  remark: string | null
  createTime: string | number
}

export interface WmWarehouseAreaCreateReqVO {
  code: string
  name: string
  locationId: number
  area?: number
  maxLoad?: number
  positionX?: number
  positionY?: number
  positionZ?: number
  status: number
  frozen: boolean
  allowItemMixing: boolean
  allowBatchMixing: boolean
  remark?: string
}

export interface WmWarehouseAreaUpdateReqVO extends WmWarehouseAreaCreateReqVO {
  id: number
}

export function getWarehouseAreaPage(params: WmWarehouseAreaQueryParams) {
  return http.get<PageResult<WmWarehouseAreaVO>>(`/mes/wm/warehouse-area/page`, params)
}

export function getWarehouseAreaSimpleList(locationId?: number) {
  return http.get<WmWarehouseAreaVO[]>(`/mes/wm/warehouse-area/simple-list`, { locationId })
}

export function getWarehouseArea(id: number) {
  return http.get<WmWarehouseAreaVO>(`/mes/wm/warehouse-area/get?id=${id}`)
}

export function createWarehouseArea(data: WmWarehouseAreaCreateReqVO) {
  return http.post<number>(`/mes/wm/warehouse-area/create`, data)
}

export function updateWarehouseArea(data: WmWarehouseAreaUpdateReqVO) {
  return http.put<boolean>(`/mes/wm/warehouse-area/update`, data)
}

export function deleteWarehouseArea(id: number) {
  return http.delete<boolean>(`/mes/wm/warehouse-area/delete?id=${id}`)
}
