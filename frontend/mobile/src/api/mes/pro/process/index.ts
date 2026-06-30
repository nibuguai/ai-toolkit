import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// MES 生产工序 VO
export interface ProProcessVO {
  id?: number // 编号
  code: string // 工序编码
  name: string // 工序名称
  attention?: string // 工序说明
  status: number // 状态
  remark?: string // 备注
  createTime?: number | string // 创建时间
}

export interface ProProcessQueryParams extends PageParam {
  code?: string // 工序编码
  name?: string // 工序名称
  status?: number // 状态
}

export interface ProProcessCreateReqVO {
  code: string // 工序编码
  name: string // 工序名称
  attention?: string // 工序说明
  status: number // 状态
  remark?: string // 备注
}

export interface ProProcessUpdateReqVO extends ProProcessCreateReqVO {
  id: number // 编号
}

/** 查询生产工序列表分页 */
export function getProcessPage(params: ProProcessQueryParams) {
  return http.get<PageResult<ProProcessVO>>('/mes/pro/process/page', params)
}

/** 查询生产工序精简列表 */
export function getProcessSimpleList() {
  return http.get<ProProcessVO[]>('/mes/pro/process/simple-list')
}

/** 查询生产工序详情 */
export function getProcess(id: number) {
  return http.get<ProProcessVO>(`/mes/pro/process/get?id=${id}`)
}

/** 新增生产工序 */
export function createProcess(data: ProProcessCreateReqVO) {
  return http.post<number>('/mes/pro/process/create', data)
}

/** 修改生产工序 */
export function updateProcess(data: ProProcessUpdateReqVO) {
  return http.put<boolean>('/mes/pro/process/update', data)
}

/** 删除生产工序 */
export function deleteProcess(id: number) {
  return http.delete<boolean>(`/mes/pro/process/delete?id=${id}`)
}

/** 导出生产工序 Excel */
export function exportProcess(params: ProProcessQueryParams) {
  return http.get<Blob>('/mes/pro/process/export-excel', params)
}

export const ProProcessApi = {
  getProcessPage,
  getProcessSimpleList,
  getProcess,
  createProcess,
  updateProcess,
  deleteProcess,
  exportProcess,
}
