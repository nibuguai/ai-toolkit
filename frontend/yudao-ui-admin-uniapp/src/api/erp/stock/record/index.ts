import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** ERP 库存明细 */
export interface StockRecord {
  id?: number // 编号
  productId?: number // 产品编号
  warehouseId?: number // 仓库编号
  count?: number // 出入库数量
  totalCount?: number // 总库存量
  bizType?: number // 业务类型
  bizId?: number // 业务编号
  bizItemId?: number // 业务项编号
  bizNo?: string // 业务单号
}

/** 获取库存明细分页列表 */
export function getStockRecordPage(params: PageParam) {
  return http.get<PageResult<StockRecord>>('/erp/stock-record/page', params)
}

/** 获取库存明细详情 */
export function getStockRecord(id: number) {
  return http.get<StockRecord>(`/erp/stock-record/get?id=${id}`)
}
