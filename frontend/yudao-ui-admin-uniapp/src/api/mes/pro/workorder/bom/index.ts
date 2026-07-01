import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 生产工单 BOM 分页参数 */
export interface ProWorkOrderBomQueryParams extends PageParam {
  workOrderId?: number
}

/** MES 生产工单 BOM VO */
export interface ProWorkOrderBomVO {
  id: number // 编号
  workOrderId: number // 生产工单编号
  itemId: number // BOM 物料编号
  itemName?: string // 物料名称
  itemCode?: string // 物料编码
  itemSpecification?: string // 规格型号
  unitMeasureId?: number // 单位编号
  unitMeasureName?: string // 单位名称
  quantity: number // 预计使用量 / 需求数量
  remark?: string // 备注
  itemOrProduct?: string // 物料产品标识
}

/** MES 生产工单 BOM 创建参数 */
export interface ProWorkOrderBomCreateReqVO {
  workOrderId: number
  itemId: number
  quantity: number
  remark?: string
}

/** MES 生产工单 BOM 更新参数 */
export interface ProWorkOrderBomUpdateReqVO extends ProWorkOrderBomCreateReqVO {
  id: number
}

/** 查询工单 BOM 分页 */
export function getWorkOrderBomPage(params: ProWorkOrderBomQueryParams) {
  return http.get<PageResult<ProWorkOrderBomVO>>(`/mes/pro/work-order-bom/page`, params)
}

/** 查询工单 BOM 详情 */
export function getWorkOrderBom(id: number) {
  return http.get<ProWorkOrderBomVO>(`/mes/pro/work-order-bom/get?id=${id}`)
}

/** 新增工单 BOM */
export function createWorkOrderBom(data: ProWorkOrderBomCreateReqVO) {
  return http.post<number>(`/mes/pro/work-order-bom/create`, data)
}

/** 修改工单 BOM */
export function updateWorkOrderBom(data: ProWorkOrderBomUpdateReqVO) {
  return http.put<boolean>(`/mes/pro/work-order-bom/update`, data)
}

/** 删除工单 BOM */
export function deleteWorkOrderBom(id: number) {
  return http.delete<boolean>(`/mes/pro/work-order-bom/delete?id=${id}`)
}

/** 获取工单物料需求列表 */
export function getWorkOrderBomItemListByWorkOrderId(workOrderId: number) {
  return http.get<ProWorkOrderBomVO[]>(`/mes/pro/work-order-bom/item-list-by-work-order-id?workOrderId=${workOrderId}`)
}

export const ProWorkOrderBomApi = {
  getWorkOrderBomPage,
  getWorkOrderBom,
  createWorkOrderBom,
  updateWorkOrderBom,
  deleteWorkOrderBom,
  getWorkOrderBomItemListByWorkOrderId,
}
