import { http } from '@/http/http'

/** 排班日历查询参数 */
export interface CalCalendarQueryParams {
  queryType: 'TYPE' | 'TEAM' | 'USER'
  startDay: string
  endDay: string
  calendarType?: number
  teamId?: number
  userId?: number
}

/** 排班日历 - 班组排班项 */
export interface CalCalendarTeamShiftItem {
  teamId: number // 班组编号
  teamName: string // 班组名称
  shiftId: number // 班次编号
  shiftName: string // 班次名称
  sort: number // 班次顺序
}

/** 排班日历 - 日历天 VO */
export interface CalCalendarDayVO {
  day: string // yyyy-MM-dd
  shiftType: number // 轮班方式
  teamShifts: CalCalendarTeamShiftItem[] // 当天班组排班
}

/** 查询排班日历列表 */
export function getCalendarList(params: CalCalendarQueryParams) {
  return http.get<CalCalendarDayVO[]>(`/mes/cal/calendar/list`, params)
}

export const CalCalendarApi = {
  getCalendarList,
}
