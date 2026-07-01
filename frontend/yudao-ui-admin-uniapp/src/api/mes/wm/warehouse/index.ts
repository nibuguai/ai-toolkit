import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface WmWarehouseQueryParams extends PageParam {
  code?: string
  name?: string
  status?: number
}

export interface WmWarehouseVO {
  id: number
  code: string
  name: string
  address: string | null
  area: number | null
  chargeUserId: number | null
  chargeUserName?: string | null
  frozen: boolean
  remark: string | null
  createTime: string | number
}

export interface WmWarehouseCreateReqVO {
  code: string
  name: string
  address?: string
  area?: number
  chargeUserId?: number
  frozen: boolean
  remark?: string
}

export interface WmWarehouseUpdateReqVO extends WmWarehouseCreateReqVO {
  id: number
}

export function getWarehousePage(params: WmWarehouseQueryParams) {
  return http.get<PageResult<WmWarehouseVO>>(`/mes/wm/warehouse/page`, params)
}

export function getWarehouseSimpleList() {
  return http.get<WmWarehouseVO[]>(`/mes/wm/warehouse/simple-list`)
}

export function getWarehouse(id: number) {
  return http.get<WmWarehouseVO>(`/mes/wm/warehouse/get?id=${id}`)
}

export function createWarehouse(data: WmWarehouseCreateReqVO) {
  return http.post<number>(`/mes/wm/warehouse/create`, data)
}

export function updateWarehouse(data: WmWarehouseUpdateReqVO) {
  return http.put<boolean>(`/mes/wm/warehouse/update`, data)
}

export function deleteWarehouse(id: number) {
  return http.delete<boolean>(`/mes/wm/warehouse/delete?id=${id}`)
}

export const WmWarehouseApi = {
  getWarehousePage,
  getWarehouseSimpleList,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
}
