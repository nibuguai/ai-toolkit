import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 流转卡工序记录分页参数 */
export interface ProCardProcessQueryParams extends PageParam {
  cardId: number
  processId?: number
  workstationId?: number
  userId?: number
}

/** MES 流转卡工序记录 VO */
export interface ProCardProcessVO {
  id: number // 编号
  cardId: number // 流转卡编号
  sort?: number // 序号
  processId?: number // 工序编号
  processCode?: string // 工序编码
  processName?: string // 工序名称
  inputTime?: number | string // 进入工序时间
  outputTime?: number | string // 出工序时间
  inputQuantity?: number // 投入数量
  outputQuantity?: number // 产出数量
  unqualifiedQuantity?: number // 不合格品数量
  workstationId?: number // 工位编号
  workstationCode?: string // 工位编码
  workstationName?: string // 工位名称
  userId?: number // 操作人编号
  nickname?: string // 操作人名称
  ipqcId?: number // 过程检验单编号
  remark?: string // 备注
  createTime?: number | string // 创建时间
}

/** MES 流转卡工序记录创建参数 */
export interface ProCardProcessCreateReqVO {
  cardId: number
  sort?: number
  processId?: number
  inputTime?: number | string
  outputTime?: number | string
  inputQuantity?: number
  outputQuantity?: number
  unqualifiedQuantity?: number
  workstationId?: number
  userId?: number
  ipqcId?: number
  remark?: string
}

/** MES 流转卡工序记录更新参数 */
export interface ProCardProcessUpdateReqVO extends ProCardProcessCreateReqVO {
  id: number
}

/** 查询流转卡工序记录分页 */
export function getCardProcessPage(params: ProCardProcessQueryParams) {
  return http.get<PageResult<ProCardProcessVO>>('/mes/pro/card-process/page', params)
}

/** 查询流转卡工序记录详情 */
export function getCardProcess(id: number) {
  return http.get<ProCardProcessVO>(`/mes/pro/card-process/get?id=${id}`)
}

/** 新增流转卡工序记录 */
export function createCardProcess(data: ProCardProcessCreateReqVO) {
  return http.post<number>('/mes/pro/card-process/create', data)
}

/** 修改流转卡工序记录 */
export function updateCardProcess(data: ProCardProcessUpdateReqVO) {
  return http.put<boolean>('/mes/pro/card-process/update', data)
}

/** 删除流转卡工序记录 */
export function deleteCardProcess(id: number) {
  return http.delete<boolean>(`/mes/pro/card-process/delete?id=${id}`)
}

export const ProCardProcessApi = {
  getCardProcessPage,
  getCardProcess,
  createCardProcess,
  updateCardProcess,
  deleteCardProcess,
}
