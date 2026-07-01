import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 产品产出行 VO */
export interface WmProductProduceLineVO {
  id: number
  feedbackId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  quantity?: number
  unitMeasureName?: string
  batchCode?: string
  qualityStatus?: number
}

export interface WmProductProduceLineQueryParams extends PageParam {
  feedbackId?: number
}

/** 获取产品产出行分页 */
export function getProductProduceLinePage(params: WmProductProduceLineQueryParams) {
  return http.get<PageResult<WmProductProduceLineVO>>('/mes/wm/product-produce-line/page', params)
}
