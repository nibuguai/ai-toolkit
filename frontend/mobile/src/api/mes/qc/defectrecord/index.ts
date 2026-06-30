import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 质检缺陷记录分页参数 */
export interface QcDefectRecordPageParam extends PageParam {
  qcType: number
  qcId: number
  lineId?: number
}

/** 质检缺陷记录保存参数 */
export interface QcDefectRecordSaveReqVO {
  id?: number
  qcType: number
  qcId: number
  lineId: number
  name: string
  level: number
  quantity?: number
  remark?: string
}

/** MES 质检缺陷记录 VO */
export interface QcDefectRecordVO {
  id: number // 编号
  qcType: number // 检验类型
  qcId: number // 检验单 ID
  lineId: number // 检验行 ID
  name: string // 缺陷描述
  level: number // 缺陷等级
  quantity?: number // 缺陷数量
  remark?: string // 备注
  createTime?: string // 创建时间
}

/** 查询质检缺陷记录分页 */
export function getDefectRecordPage(params: QcDefectRecordPageParam) {
  return http.get<PageResult<QcDefectRecordVO>>('/mes/qc/defect-record/page', params)
}

/** 新增质检缺陷记录 */
export function createDefectRecord(data: QcDefectRecordSaveReqVO) {
  return http.post<number>('/mes/qc/defect-record/create', data)
}

/** 修改质检缺陷记录 */
export function updateDefectRecord(data: QcDefectRecordSaveReqVO) {
  return http.put<boolean>('/mes/qc/defect-record/update', data)
}

/** 删除质检缺陷记录 */
export function deleteDefectRecord(id: number) {
  return http.delete<boolean>(`/mes/qc/defect-record/delete?id=${id}`)
}

export const QcDefectRecordApi = {
  getDefectRecordPage,
  createDefectRecord,
  updateDefectRecord,
  deleteDefectRecord,
}
