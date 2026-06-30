import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES SN 码分组查询参数 */
export interface WmSnQueryParams extends PageParam {
  uuid?: string // 批次 UUID
  code?: string // SN 码
  itemId?: number // 物料编号
  batchCode?: string // 批次号
  createTime?: string[] // 创建时间范围
}

/** MES SN 码分组 VO */
export interface WmSnGroupVO {
  uuid?: string
  count?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitName?: string
  batchCode?: string
  workOrderId?: number
  createTime?: string
}

/** MES SN 码明细 VO */
export interface WmSnVO {
  id: number
  uuid?: string
  code?: string
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitName?: string
  batchCode?: string
  workOrderId?: number
  createTime?: string
}

/** MES SN 码生成参数 */
export interface WmSnGenerateVO {
  itemId: number
  batchCode?: string
  workOrderId?: number
  count: number
}

/** 生成 SN 码 */
export function generateSnCodes(data: WmSnGenerateVO) {
  return http.post<boolean>('/mes/wm/sn/generate', data)
}

/** 获得 SN 码分组分页 */
export function getSnGroupPage(params: WmSnQueryParams) {
  return http.get<PageResult<WmSnGroupVO>>('/mes/wm/sn/group-page', params)
}

/** 获得批次 SN 码明细列表 */
export function getSnListByUuid(uuid: string) {
  return http.get<WmSnVO[]>('/mes/wm/sn/list-by-uuid', { uuid })
}

/** 批量删除 SN 码（按批次 UUID） */
export function deleteSnBatch(uuid: string) {
  return http.delete<boolean>('/mes/wm/sn/delete-batch', undefined, { uuid })
}
