import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 物资消耗行 VO */
export interface WmItemConsumeLineVO {
  id: number
  feedbackId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  quantity?: number
  unitName?: string
  batchCode?: string
}

export interface WmItemConsumeLineQueryParams extends PageParam {
  feedbackId?: number
}

/** 根据报工编号分页获取消耗行列表 */
export function getItemConsumeLinePage(params: WmItemConsumeLineQueryParams) {
  return http.get<PageResult<WmItemConsumeLineVO>>('/mes/wm/item-consume-line/page', params)
}
