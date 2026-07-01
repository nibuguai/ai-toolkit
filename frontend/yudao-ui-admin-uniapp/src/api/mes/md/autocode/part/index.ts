import { http } from '@/http/http'

// MES 编码规则分段 VO
export interface AutoCodePartVO {
  id?: number // 分段编号
  ruleId?: number // 规则编号
  sort?: number // 排序
  type?: number // 分段类型
  length?: number // 长度
  dateFormat?: string // 日期格式
  fixCharacter?: string // 固定字符
  serialStartNo?: number // 流水号起始值
  serialStep?: number // 流水号步长
  cycleFlag?: boolean // 是否循环
  cycleMethod?: number // 循环方式
  remark?: string // 备注
  createTime?: string // 创建时间
}

export interface AutoCodePartCreateReqVO {
  ruleId?: number
  sort?: number
  type?: number
  length?: number
  dateFormat?: string
  fixCharacter?: string
  serialStartNo?: number
  serialStep?: number
  cycleFlag?: boolean
  cycleMethod?: number
  remark?: string
}

export interface AutoCodePartUpdateReqVO extends AutoCodePartCreateReqVO {
  id: number
}

/** 查询编码规则分段详情 */
export function getAutoCodePart(id: number) {
  return http.get<AutoCodePartVO>(`/mes/md/auto-code-part/get?id=${id}`)
}

/** 查询编码规则分段列表 */
export function getAutoCodePartListByRuleId(ruleId: number) {
  return http.get<AutoCodePartVO[]>(`/mes/md/auto-code-part/list-by-rule-id?ruleId=${ruleId}`)
}

/** 新增编码规则分段 */
export function createAutoCodePart(data: AutoCodePartCreateReqVO) {
  return http.post<number>(`/mes/md/auto-code-part/create`, data)
}

/** 修改编码规则分段 */
export function updateAutoCodePart(data: AutoCodePartUpdateReqVO) {
  return http.put<boolean>(`/mes/md/auto-code-part/update`, data)
}

/** 删除编码规则分段 */
export function deleteAutoCodePart(id: number) {
  return http.delete<boolean>(`/mes/md/auto-code-part/delete?id=${id}`)
}

export const AutoCodePartApi = {
  getAutoCodePart,
  getAutoCodePartListByRuleId,
  createAutoCodePart,
  updateAutoCodePart,
  deleteAutoCodePart,
}
