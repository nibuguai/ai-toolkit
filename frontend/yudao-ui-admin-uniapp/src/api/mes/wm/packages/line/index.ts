import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 装箱明细分页查询参数 */
export interface WmPackageLineQueryParams extends PageParam {
  packageId: number // 装箱单编号
}

/** 装箱明细创建参数 */
export interface WmPackageLineCreateReqVO {
  packageId: number // 装箱单编号
  materialStockId?: number // 库存记录编号
  itemId: number // 产品物料编号
  quantity: number // 装箱数量
  workOrderId: number // 生产工单编号
  expireDate?: string | number | Date // 有效期
  remark?: string // 备注
}

/** 装箱明细修改参数 */
export interface WmPackageLineUpdateReqVO extends WmPackageLineCreateReqVO {
  id: number
}

/** 装箱明细 VO */
export interface WmPackageLineVO {
  id: number
  packageId: number
  materialStockId?: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  quantity: number
  workOrderId?: number
  workOrderCode?: string
  batchCode?: string
  expireDate?: string | number
  remark?: string
  createTime?: string
}

/** 创建装箱明细 */
export function createPackageLine(data: WmPackageLineCreateReqVO) {
  return http.post<number>('/mes/wm/package-line/create', data)
}

/** 修改装箱明细 */
export function updatePackageLine(data: WmPackageLineUpdateReqVO) {
  return http.put<boolean>('/mes/wm/package-line/update', data)
}

/** 删除装箱明细 */
export function deletePackageLine(id: number) {
  return http.delete<boolean>(`/mes/wm/package-line/delete?id=${id}`)
}

/** 获取装箱明细详情 */
export function getPackageLine(id: number) {
  return http.get<WmPackageLineVO>(`/mes/wm/package-line/get?id=${id}`)
}

/** 分页查询装箱明细 */
export function getPackageLinePage(params: WmPackageLineQueryParams) {
  return http.get<PageResult<WmPackageLineVO>>('/mes/wm/package-line/page', params)
}

export const WmPackageLineApi = {
  createPackageLine,
  updatePackageLine,
  deletePackageLine,
  getPackageLine,
  getPackageLinePage,
}
