import { http } from '@/http/http'

/** MES 假期设置查询参数 */
export interface CalHolidayListParams {
  startDay?: string
  endDay?: string
}

/** MES 假期设置 VO */
export interface CalHolidayVO {
  id?: number // 编号
  day: number | string // 日期
  type: number // 日期类型
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** MES 假期设置保存参数 */
export interface CalHolidaySaveReqVO {
  id?: number
  day: number | string
  type: number
  remark?: string
}

/** 查询假期设置列表（支持可选日期范围过滤） */
export function getHolidayList(params?: CalHolidayListParams) {
  return http.get<CalHolidayVO[]>(`/mes/cal/holiday/list`, params)
}

/** 根据日期查询假期设置 */
export function getHolidayByDay(day: string) {
  return http.get<CalHolidayVO>(`/mes/cal/holiday/get-by-day`, { day })
}

/** 保存假期设置（含 upsert 逻辑） */
export function saveHoliday(data: CalHolidaySaveReqVO) {
  return http.post<number>(`/mes/cal/holiday/save`, data)
}

export const CalHolidayApi = {
  getHolidayList,
  getHolidayByDay,
  saveHoliday,
}
