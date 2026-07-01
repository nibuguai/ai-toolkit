import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 班组成员 VO */
export interface CalTeamMemberVO {
  id?: number
  teamId: number // 班组编号
  userId: number // 用户编号
  nickname?: string // 用户昵称（关联查询）
  telephone?: string // 用户手机号（关联查询）
  remark?: string // 备注
}

/** MES 班组成员创建参数 */
export interface CalTeamMemberCreateReqVO {
  teamId: number
  userId: number
  remark?: string
}

/** 创建班组成员 */
export function createTeamMember(data: CalTeamMemberCreateReqVO) {
  return http.post<number>(`/mes/cal/team-member/create`, data)
}

/** 删除班组成员 */
export function deleteTeamMember(id: number) {
  return http.delete<boolean>(`/mes/cal/team-member/delete?id=${id}`)
}

/** 查询班组成员分页 */
export function getTeamMemberPage(params: PageParam) {
  return http.get<PageResult<CalTeamMemberVO>>(`/mes/cal/team-member/page`, params)
}

/** 查询指定班组的成员列表 */
export function getTeamMemberListByTeam(teamId: number) {
  return http.get<CalTeamMemberVO[]>(`/mes/cal/team-member/list-by-team`, { teamId })
}

/** 查询多个班组的成员列表 */
export function getTeamMemberListByTeamIds(teamIds: number[]) {
  return http.get<CalTeamMemberVO[]>(`/mes/cal/team-member/list-by-team`, {
    teamIds: teamIds.join(','),
  })
}

export const CalTeamMemberApi = {
  createTeamMember,
  deleteTeamMember,
  getTeamMemberPage,
  getTeamMemberListByTeam,
  getTeamMemberListByTeamIds,
}
