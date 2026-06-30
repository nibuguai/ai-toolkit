import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

export interface DvRepairQueryParams extends PageParam {
  code?: string
  name?: string
  machineryId?: number
  result?: number
  status?: number
}

// MES 维修工单 VO
export interface DvRepairVO {
  id: number // 编号
  code: string // 维修工单编码
  name: string // 维修工单名称
  machineryId: number // 设备编号
  machineryCode?: string // 设备编码
  machineryName?: string // 设备名称
  machineryBrand?: string // 品牌
  machinerySpecification?: string // 规格型号
  requireDate?: string | number // 报修日期
  finishDate?: string | number // 维修完成日期
  confirmDate?: string | number // 验收日期
  result?: number // 维修结果
  acceptedUserId?: number // 维修人用户编号
  acceptedUserNickname?: string // 维修人名称
  confirmUserId?: number // 验收人用户编号
  confirmUserNickname?: string // 验收人名称
  sourceDocType?: number // 来源单据类型
  sourceDocId?: number // 来源单据编号
  sourceDocCode?: string // 来源单据编码
  status?: number // 状态
  remark?: string // 备注
  createTime?: string | number
}

export interface DvRepairCreateReqVO {
  code?: string
  name?: string
  machineryId?: number
  requireDate?: string | number
  remark?: string
}

export interface DvRepairUpdateReqVO extends DvRepairCreateReqVO {
  id: number
}

export interface DvRepairConfirmReqVO {
  id: number
  finishDate?: string | number
}

/** 查询维修工单分页 */
export function getRepairPage(params: DvRepairQueryParams) {
  return http.get<PageResult<DvRepairVO>>('/mes/dv/repair/page', params)
}

/** 查询维修工单详情 */
export function getRepair(id: number) {
  return http.get<DvRepairVO>(`/mes/dv/repair/get?id=${id}`)
}

/** 新增维修工单 */
export function createRepair(data: DvRepairCreateReqVO) {
  return http.post<number>('/mes/dv/repair/create', data)
}

/** 修改维修工单 */
export function updateRepair(data: DvRepairUpdateReqVO) {
  return http.put<boolean>('/mes/dv/repair/update', data)
}

/** 删除维修工单 */
export function deleteRepair(id: number) {
  return http.delete<boolean>(`/mes/dv/repair/delete?id=${id}`)
}

/** 导出维修工单 Excel */
export function exportRepair(params: DvRepairQueryParams) {
  return http.get<Blob>('/mes/dv/repair/export-excel', params)
}

/** 提交维修工单（草稿→维修中） */
export function submitRepair(id: number) {
  return http.put<boolean>(`/mes/dv/repair/submit?id=${id}`)
}

/** 确认维修完成（维修中→待验收） */
export function confirmRepair(data: DvRepairConfirmReqVO) {
  return http.put<boolean>('/mes/dv/repair/confirm', data)
}

/** 完成验收（待验收→已确认） */
export function finishRepair(id: number, result: number) {
  return http.put<boolean>(`/mes/dv/repair/finish?id=${id}&result=${result}`)
}

export const DvRepairApi = {
  getRepairPage,
  getRepair,
  createRepair,
  updateRepair,
  deleteRepair,
  exportRepair,
  submitRepair,
  confirmRepair,
  finishRepair,
}
