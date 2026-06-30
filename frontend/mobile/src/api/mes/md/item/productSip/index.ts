import { http } from '@/http/http'

/** MES 产品 SIP VO（查询返回） */
export interface MdProductSipVO {
  id: number // SIP 编号
  itemId: number // 物料产品 ID
  sort: number // 排列顺序
  processId: number | null // 工序 ID
  title: string // 标题
  description: string | null // 详细描述
  url: string | null // 图片地址
  remark: string | null // 备注
  createTime: string | number // 创建时间（当前服务可能序列化为时间戳）
  processCode: string | null // 工序编号
  processName: string | null // 工序名称
}

/** MES 产品 SIP 创建参数 */
export interface MdProductSipCreateReqVO {
  itemId: number
  sort: number
  title: string
  processId?: number
  description?: string
  url?: string
  remark?: string
}

/** MES 产品 SIP 更新参数 */
export interface MdProductSipUpdateReqVO extends MdProductSipCreateReqVO {
  id: number
}

/** 创建产品 SIP（返回 ID） */
export function createProductSip(data: MdProductSipCreateReqVO) {
  return http.post<number>(`/mes/md/product-sip/create`, data)
}

/** 更新产品 SIP */
export function updateProductSip(data: MdProductSipUpdateReqVO) {
  return http.put<boolean>(`/mes/md/product-sip/update`, data)
}

/** 删除产品 SIP */
export function deleteProductSip(id: number) {
  return http.delete<boolean>(`/mes/md/product-sip/delete?id=${id}`)
}

/** 根据物料产品编号获得产品 SIP 列表 */
export function getProductSipListByItemId(itemId: number) {
  return http.get<MdProductSipVO[]>(`/mes/md/product-sip/list-by-item-id?itemId=${itemId}`)
}

export const MdProductSipApi = {
  createProductSip,
  updateProductSip,
  deleteProductSip,
  getProductSipListByItemId,
}
