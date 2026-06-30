import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// MES 计量单位 VO
export interface MdUnitMeasureVO {
  id?: number // 单位编号
  code: string // 单位编码
  name: string // 单位名称
  primaryFlag: boolean // 是否主单位
  primaryId?: number // 主单位编号
  changeRate?: number // 与主单位换算比例
  status: number // 状态
  remark?: string // 备注
  createTime?: string // 创建时间
}

export interface MdUnitMeasurePageParam {
  pageNo?: number // 页码
  pageSize?: number // 每页数量
  code?: string // 单位编码
  name?: string // 单位名称
  status?: number // 状态
}

/** 查询计量单位分页 */
export function getUnitMeasurePage(params: MdUnitMeasurePageParam & PageParam) {
  return http.get<PageResult<MdUnitMeasureVO>>(`/mes/md/unit-measure/page`, params)
}

/** 查询计量单位精简列表 */
export function getUnitMeasureSimpleList() {
  return http.get<MdUnitMeasureVO[]>(`/mes/md/unit-measure/simple-list`)
}

/** 查询计量单位详情 */
export function getUnitMeasure(id: number) {
  return http.get<MdUnitMeasureVO>(`/mes/md/unit-measure/get?id=${id}`)
}

/** 新增计量单位 */
export function createUnitMeasure(data: MdUnitMeasureVO) {
  return http.post<number>(`/mes/md/unit-measure/create`, data)
}

/** 修改计量单位 */
export function updateUnitMeasure(data: MdUnitMeasureVO) {
  return http.put<boolean>(`/mes/md/unit-measure/update`, data)
}

/** 删除计量单位 */
export function deleteUnitMeasure(id: number) {
  return http.delete<boolean>(`/mes/md/unit-measure/delete?id=${id}`)
}

/** 导出计量单位 Excel */
export function exportUnitMeasure(params: MdUnitMeasurePageParam) {
  return http.get<Blob>(`/mes/md/unit-measure/export-excel`, params)
}

export const MdUnitMeasureApi = {
  getUnitMeasurePage,
  getUnitMeasureSimpleList,
  getUnitMeasure,
  createUnitMeasure,
  updateUnitMeasure,
  deleteUnitMeasure,
  exportUnitMeasure,
}
