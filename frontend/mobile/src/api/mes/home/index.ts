import { http } from '@/http/http'

// MES 首页汇总统计 VO
export interface MesHomeSummaryVO {
  workOrderActiveCount: number
  workOrderPrepareCount: number
  workOrderFinishedCount: number
  todayOutput: number
  yesterdayOutput: number
  todayQualifiedQuantity: number
  todayUnqualifiedQuantity: number
  machineryTotal: number
  machineryProducing: number
  machineryStop: number
  machineryMaintenance: number
  andonActiveCount: number
  repairActiveCount: number
}

// MES 工单状态分布 VO
export interface MesHomeWorkOrderStatusVO {
  status: number
  statusName: string
  count: number
}

// MES 生产趋势 VO
export interface MesHomeProductionTrendVO {
  date: string
  quantity: number
  qualifiedQuantity: number
  unqualifiedQuantity: number
}

/** 获得首页汇总统计 */
export function getHomeSummary() {
  return http.get<MesHomeSummaryVO>(`/mes/home-statistics/summary`)
}

/** 获得工单状态分布 */
export function getWorkOrderStatusDistribution() {
  return http.get<MesHomeWorkOrderStatusVO[]>(`/mes/home-statistics/work-order-status`)
}

/** 获得生产趋势 */
export function getProductionTrend(days?: number) {
  return http.get<MesHomeProductionTrendVO[]>(`/mes/home-statistics/production-trend`, { days })
}

export const MesHomeStatisticsApi = {
  getHomeSummary,
  getWorkOrderStatusDistribution,
  getProductionTrend,
}
