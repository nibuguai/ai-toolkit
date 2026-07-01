import { http } from '@/http/http'

/** MES 产品 BOM VO（查询返回） */
export interface MdProductBomVO {
  id: number // BOM 编号
  itemId: number // 物料产品 ID
  bomItemId: number // BOM 物料 ID
  quantity: number // 物料使用比例
  status?: number // 是否启用
  remark?: string // 备注
  createTime?: string // 创建时间
  // 关联展示字段
  bomItemCode?: string // BOM 物料编码
  bomItemName?: string // BOM 物料名称
  bomItemSpecification?: string // BOM 物料规格
  unitMeasureName?: string // 计量单位名称
  itemOrProduct?: string // 产品物料标识
}

/** MES 产品 BOM 创建参数 */
export interface MdProductBomCreateReqVO {
  itemId: number // 物料产品 ID
  bomItemId: number // BOM 物料 ID
  quantity: number // 物料使用比例
  status?: number // 是否启用
  remark?: string // 备注
}

/** MES 产品 BOM 更新参数 */
export interface MdProductBomUpdateReqVO extends MdProductBomCreateReqVO {
  id: number // BOM 编号
}

/** 创建产品 BOM */
export function createProductBom(data: MdProductBomCreateReqVO) {
  return http.post<number>(`/mes/md/product-bom/create`, data)
}

/** 更新产品 BOM */
export function updateProductBom(data: MdProductBomUpdateReqVO) {
  return http.put<boolean>(`/mes/md/product-bom/update`, data)
}

/** 删除产品 BOM */
export function deleteProductBom(id: number) {
  return http.delete<boolean>(`/mes/md/product-bom/delete?id=${id}`)
}

/** 获得产品 BOM */
export function getProductBom(id: number) {
  return http.get<MdProductBomVO>(`/mes/md/product-bom/get?id=${id}`)
}

/** 根据物料产品编号获得产品 BOM 列表 */
export function getProductBomListByItemId(itemId: number) {
  return http.get<MdProductBomVO[]>(`/mes/md/product-bom/list-by-item-id?itemId=${itemId}`)
}

export const MdProductBomApi = {
  createProductBom,
  updateProductBom,
  deleteProductBom,
  getProductBom,
  getProductBomListByItemId,
}
