import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 销售退货单行查询参数 */
export interface WmReturnSalesLineQueryParams extends PageParam {
  returnId: number // 退货单编号
}

/** MES 销售退货单行 */
export interface WmReturnSalesLineVO {
  id: number // 行编号
  returnId: number // 退货单编号
  itemId: number // 物料编号
  itemCode?: string // 物料编码
  itemName?: string // 物料名称
  itemSpecification?: string // 规格型号
  itemUnit?: string // 单位名称
  quantity: number // 退货数量
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  rqcId?: number // 退货检验单编号
  rqcCheckFlag?: boolean // 是否需要质检
  qualityStatus?: number // 质量状态
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** MES 销售退货单行创建参数 */
export interface WmReturnSalesLineCreateReqVO {
  returnId?: number // 退货单编号
  itemId?: number // 物料编号
  quantity?: number // 退货数量
  batchId?: number // 批次编号
  batchCode?: string // 批次号
  rqcCheckFlag?: boolean // 是否需要质检
  remark?: string // 备注
}

/** MES 销售退货单行更新参数 */
export interface WmReturnSalesLineUpdateReqVO extends WmReturnSalesLineCreateReqVO {
  id: number // 行编号
}

/** 查询销售退货单行分页 */
export function getReturnSalesLinePage(params: WmReturnSalesLineQueryParams) {
  return http.get<PageResult<WmReturnSalesLineVO>>('/mes/wm/return-sales-line/page', params)
}

/** 查询销售退货单行列表 */
export function getReturnSalesLineListByReturnId(returnId: number) {
  return http.get<WmReturnSalesLineVO[]>(`/mes/wm/return-sales-line/list-by-return-sales?returnId=${returnId}`)
}

/** 查询销售退货单行详情 */
export function getReturnSalesLine(id: number) {
  return http.get<WmReturnSalesLineVO>(`/mes/wm/return-sales-line/get?id=${id}`)
}

/** 新增销售退货单行 */
export function createReturnSalesLine(data: WmReturnSalesLineCreateReqVO) {
  return http.post<number>('/mes/wm/return-sales-line/create', data)
}

/** 修改销售退货单行 */
export function updateReturnSalesLine(data: WmReturnSalesLineUpdateReqVO) {
  return http.put<boolean>('/mes/wm/return-sales-line/update', data)
}

/** 删除销售退货单行 */
export function deleteReturnSalesLine(id: number) {
  return http.delete<boolean>(`/mes/wm/return-sales-line/delete?id=${id}`)
}

export const WmReturnSalesLineApi = {
  getReturnSalesLinePage,
  getReturnSalesLineListByReturnId,
  getReturnSalesLine,
  createReturnSalesLine,
  updateReturnSalesLine,
  deleteReturnSalesLine,
}
