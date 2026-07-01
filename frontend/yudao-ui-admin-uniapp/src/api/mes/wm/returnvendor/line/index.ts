import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 供应商退货单行查询参数 */
export interface WmReturnVendorLineQueryParams extends PageParam {
  returnId: number // 退货单编号
}

/** MES 供应商退货单行 VO */
export interface WmReturnVendorLineVO {
  id: number // 行编号
  returnId: number // 退货单编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  specification?: string // 规格型号
  unitMeasureName?: string // 单位名称
  quantity: number // 退货数量
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  remark?: string // 备注
  createTime?: string | number // 创建时间
}

/** MES 供应商退货单行创建参数 */
export interface WmReturnVendorLineCreateReqVO {
  returnId?: number // 退货单编号
  itemId?: number // 物料编号
  quantity?: number // 退货数量
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  remark?: string // 备注
}

/** MES 供应商退货单行更新参数 */
export interface WmReturnVendorLineUpdateReqVO extends WmReturnVendorLineCreateReqVO {
  id: number // 行编号
}

/** 查询供应商退货单行分页 */
export function getReturnVendorLinePage(params: WmReturnVendorLineQueryParams) {
  return http.get<PageResult<WmReturnVendorLineVO>>('/mes/wm/return-vendor-line/page', params)
}

/** 查询供应商退货单行列表 */
export function getReturnVendorLineListByReturnId(returnId: number) {
  return http.get<WmReturnVendorLineVO[]>(`/mes/wm/return-vendor-line/list-by-return-vendor?returnId=${returnId}`)
}

/** 查询供应商退货单行详情 */
export function getReturnVendorLine(id: number) {
  return http.get<WmReturnVendorLineVO>(`/mes/wm/return-vendor-line/get?id=${id}`)
}

/** 新增供应商退货单行 */
export function createReturnVendorLine(data: WmReturnVendorLineCreateReqVO) {
  return http.post<number>('/mes/wm/return-vendor-line/create', data)
}

/** 修改供应商退货单行 */
export function updateReturnVendorLine(data: WmReturnVendorLineUpdateReqVO) {
  return http.put<boolean>('/mes/wm/return-vendor-line/update', data)
}

/** 删除供应商退货单行 */
export function deleteReturnVendorLine(id: number) {
  return http.delete<boolean>(`/mes/wm/return-vendor-line/delete?id=${id}`)
}

export const WmReturnVendorLineApi = {
  getReturnVendorLinePage,
  getReturnVendorLineListByReturnId,
  getReturnVendorLine,
  createReturnVendorLine,
  updateReturnVendorLine,
  deleteReturnVendorLine,
}
