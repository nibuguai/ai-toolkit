import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 装箱单分页查询参数 */
export interface WmPackageQueryParams extends PageParam {
  code?: string // 装箱单编号
  salesOrderCode?: string // 销售订单编号
  clientId?: number // 客户编号
  parentId?: number // 父箱编号
  inspectorUserId?: number // 检查员编号
  status?: number // 单据状态
}

/** 装箱单 VO */
export interface WmPackageVO {
  id: number
  code: string
  parentId?: number
  packageDate?: string | number
  salesOrderCode?: string
  invoiceCode?: string
  clientId?: number
  clientCode?: string
  clientName?: string
  clientNickname?: string
  length?: number
  width?: number
  height?: number
  sizeUnitId?: number
  sizeUnitName?: string
  netWeight?: number
  grossWeight?: number
  weightUnitId?: number
  weightUnitName?: string
  inspectorUserId?: number
  inspectorName?: string
  status: number
  remark?: string
  createTime: string
}

/** 装箱单创建参数 */
export interface WmPackageCreateReqVO {
  code: string
  packageDate: string | number | Date
  salesOrderCode?: string
  invoiceCode?: string
  clientId?: number
  length?: number
  width?: number
  height?: number
  sizeUnitId?: number
  netWeight?: number
  grossWeight?: number
  weightUnitId?: number
  inspectorUserId?: number
  remark?: string
}

/** 装箱单修改参数 */
export interface WmPackageUpdateReqVO extends WmPackageCreateReqVO {
  id: number
}

/** 创建装箱单 */
export function createPackage(data: WmPackageCreateReqVO) {
  return http.post<number>('/mes/wm/package/create', data)
}

/** 修改装箱单 */
export function updatePackage(data: WmPackageUpdateReqVO) {
  return http.put<boolean>('/mes/wm/package/update', data)
}

/** 删除装箱单 */
export function deletePackage(id: number) {
  return http.delete<boolean>(`/mes/wm/package/delete?id=${id}`)
}

/** 获取装箱单详情 */
export function getPackage(id: number) {
  return http.get<WmPackageVO>(`/mes/wm/package/get?id=${id}`)
}

/** 分页查询装箱单 */
export function getPackagePage(params: WmPackageQueryParams) {
  return http.get<PageResult<WmPackageVO>>('/mes/wm/package/page', params)
}

/** 完成装箱单 */
export function finishPackage(id: number) {
  return http.put<boolean>(`/mes/wm/package/finish?id=${id}`)
}

/** 添加子箱 */
export function addChildPackage(parentId: number, childId: number) {
  return http.put<boolean>('/mes/wm/package/add-child-package', undefined, { parentId, childId })
}

/** 移除子箱 */
export function removeChildPackage(childId: number) {
  return http.put<boolean>(`/mes/wm/package/remove-child-package?childId=${childId}`)
}

export const WmPackageApi = {
  createPackage,
  updatePackage,
  deletePackage,
  getPackage,
  getPackagePage,
  finishPackage,
  addChildPackage,
  removeChildPackage,
}
