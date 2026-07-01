import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface WmWarehouseLocationQueryParams extends PageParam {
  code?: string
  name?: string
  warehouseId?: number
}

export interface WmWarehouseLocationVO {
  id: number
  code: string
  name: string
  warehouseId: number
  warehouseName: string | null
  area: number | null
  frozen: boolean
  remark: string | null
  createTime: string | number
}

export interface WmWarehouseLocationCreateReqVO {
  code: string
  name: string
  warehouseId: number
  area?: number
  frozen: boolean
  remark?: string
}

export interface WmWarehouseLocationUpdateReqVO extends WmWarehouseLocationCreateReqVO {
  id: number
}

export function getWarehouseLocationPage(params: WmWarehouseLocationQueryParams) {
  return http.get<PageResult<WmWarehouseLocationVO>>(`/mes/wm/warehouse-location/page`, params)
}

export function getWarehouseLocationSimpleList(warehouseId?: number) {
  return http.get<WmWarehouseLocationVO[]>(`/mes/wm/warehouse-location/simple-list`, { warehouseId })
}

export function getWarehouseLocation(id: number) {
  return http.get<WmWarehouseLocationVO>(`/mes/wm/warehouse-location/get?id=${id}`)
}

export function createWarehouseLocation(data: WmWarehouseLocationCreateReqVO) {
  return http.post<number>(`/mes/wm/warehouse-location/create`, data)
}

export function updateWarehouseLocation(data: WmWarehouseLocationUpdateReqVO) {
  return http.put<boolean>(`/mes/wm/warehouse-location/update`, data)
}

export function deleteWarehouseLocation(id: number) {
  return http.delete<boolean>(`/mes/wm/warehouse-location/delete?id=${id}`)
}

export const WmWarehouseLocationApi = {
  getWarehouseLocationPage,
  getWarehouseLocationSimpleList,
  getWarehouseLocation,
  createWarehouseLocation,
  updateWarehouseLocation,
  deleteWarehouseLocation,
}
