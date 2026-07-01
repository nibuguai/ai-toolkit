import { http } from '@/http/http'

/** MES 计划班组关联 VO */
export interface CalPlanTeamVO {
  id?: number
  planId: number // 排班计划编号
  teamId: number // 班组编号
  teamCode?: string // 班组编码
  teamName?: string // 班组名称
  remark?: string // 备注
}

/** MES 计划班组关联创建参数 */
export interface CalPlanTeamCreateReqVO {
  planId: number
  teamId: number
  remark?: string
}

/** 查询指定排班计划的班组列表 */
export function getPlanTeamListByPlan(planId: number) {
  return http.get<CalPlanTeamVO[]>(`/mes/cal/plan-team/list-by-plan?planId=${planId}`)
}

/** 新增计划班组关联 */
export function createPlanTeam(data: CalPlanTeamCreateReqVO) {
  return http.post<number>(`/mes/cal/plan-team/create`, data)
}

/** 删除计划班组关联 */
export function deletePlanTeam(id: number) {
  return http.delete<boolean>(`/mes/cal/plan-team/delete?id=${id}`)
}

export const CalPlanTeamApi = {
  getPlanTeamListByPlan,
  createPlanTeam,
  deletePlanTeam,
}
