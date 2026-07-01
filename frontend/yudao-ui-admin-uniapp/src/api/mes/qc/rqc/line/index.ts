import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 退料检验单行分页参数 */
export interface QcRqcLinePageParam extends PageParam {
  rqcId: number
}

/** MES 退料检验单行 VO */
export interface QcRqcLineVO {
  id: number // 编号
  rqcId: number // 退货检验单 ID
  indicatorId: number // 检测指标 ID
  indicatorCode?: string // 检测指标编码
  indicatorName?: string // 检测指标名称
  indicatorType?: number // 检测指标类型
  tool?: string // 检测工具
  checkMethod?: string // 检测方法
  standardValue?: number | string // 标准值
  unitMeasureId?: number // 计量单位 ID
  unitMeasureName?: string // 计量单位名称
  maxThreshold?: number | string // 误差上限
  minThreshold?: number | string // 误差下限
  criticalQuantity?: number // 致命缺陷数量
  majorQuantity?: number // 严重缺陷数量
  minorQuantity?: number // 轻微缺陷数量
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** 查询退货检验单行分页 */
export function getRqcLinePage(params: QcRqcLinePageParam) {
  return http.get<PageResult<QcRqcLineVO>>('/mes/qc/rqc/line/page', params)
}

/** 查询退货检验单行详情 */
export function getRqcLine(id: number) {
  return http.get<QcRqcLineVO>(`/mes/qc/rqc/line/get?id=${id}`)
}

export const QcRqcLineApi = {
  getRqcLinePage,
  getRqcLine,
}
