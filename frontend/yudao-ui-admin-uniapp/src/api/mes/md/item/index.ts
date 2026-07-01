import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 物料产品查询参数 */
export interface MdItemQueryParams extends PageParam {
  code?: string // 物料编码
  name?: string // 物料名称
  itemTypeId?: number // 物料分类编号
  itemOrProduct?: string // 物料/产品标识
  status?: number // 状态
}

/** MES 物料产品 VO（查询/详情返回） */
export interface MdItemVO {
  id: number // 物料编号
  code: string // 物料编码
  name: string // 物料名称
  specification: string // 规格型号
  unitMeasureId: number // 计量单位编号
  unitMeasureName?: string // 计量单位名称
  itemTypeId: number // 物料分类编号
  itemTypeName?: string // 物料分类名称
  itemOrProduct?: string // 物料/产品标识
  status: number // 状态
  safeStockFlag: boolean // 是否启用安全库存
  minStock: number // 最低库存量
  maxStock: number // 最高库存量
  highValue: boolean // 是否高值物料
  batchFlag: boolean // 是否启用批次管理
  remark: string // 备注
  createTime?: string // 创建时间
}

/** MES 物料产品创建参数（后端不接收 id、status、itemOrProduct） */
export interface MdItemCreateReqVO {
  code: string // 物料编码
  name: string // 物料名称
  specification?: string // 规格型号
  unitMeasureId: number // 计量单位编号
  itemTypeId: number // 物料分类编号
  safeStockFlag?: boolean // 是否启用安全库存
  minStock?: number // 最低库存量
  maxStock?: number // 最高库存量
  highValue?: boolean // 是否高值物料
  batchFlag?: boolean // 是否启用批次管理
  remark?: string // 备注
}

/** MES 物料产品更新参数（后端不接收 status、itemOrProduct） */
export interface MdItemUpdateReqVO extends MdItemCreateReqVO {
  id: number // 物料编号
}

/** 查询物料产品分页 */
export function getItemPage(params: MdItemQueryParams) {
  return http.get<PageResult<MdItemVO>>(`/mes/md/item/page`, params)
}

/** 查询物料产品详情 */
export function getItem(id: number) {
  return http.get<MdItemVO>(`/mes/md/item/get?id=${id}`)
}

/** 新增物料产品（返回新物料 ID） */
export function createItem(data: MdItemCreateReqVO) {
  return http.post<number>(`/mes/md/item/create`, data)
}

/** 修改物料产品 */
export function updateItem(data: MdItemUpdateReqVO) {
  return http.put<boolean>(`/mes/md/item/update`, data)
}

/** 修改物料产品状态 */
export function updateItemStatus(id: number, status: number) {
  return http.put<boolean>(`/mes/md/item/update-status`, undefined, { id, status })
}

/** 删除物料产品 */
export function deleteItem(id: number) {
  return http.delete<boolean>(`/mes/md/item/delete?id=${id}`)
}

/** 导出物料产品 Excel */
export function exportItem(params: MdItemQueryParams) {
  return http.get<Blob>(`/mes/md/item/export-excel`, params)
}

/** 下载物料导入模板 */
export function importTemplate() {
  return http.get<Blob>(`/mes/md/item/get-import-template`)
}

export const MdItemApi = {
  getItemPage,
  getItem,
  createItem,
  updateItem,
  updateItemStatus,
  deleteItem,
  exportItem,
  importTemplate,
}
