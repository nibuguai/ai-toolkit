import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** MES 生产任务分页参数 */
export interface ProTaskQueryParams extends PageParam {
  code?: string
  name?: string
  workOrderId?: number
  routeId?: number
  processId?: number
  workstationId?: number
  status?: number
  statuses?: number[]
  checkFlag?: boolean
  createTime?: [string, string]
}

/** MES 甘特任务查询参数 */
export interface ProTaskGanttQueryParams {
  code?: string
  name?: string
  orderSourceCode?: string
  productId?: number
  clientId?: number
  status?: number
  type?: number
  requestDate?: [string, string]
}

/** MES 生产任务 VO */
export interface ProTaskVO {
  id: number // 编号
  code?: string // 任务编码
  name?: string // 任务名称
  workOrderId: number // 生产工单编号
  workOrderCode?: string // 工单编码
  workOrderName?: string // 工单名称
  workstationId: number // 工作站编号
  workstationCode?: string // 工作站编码
  workstationName?: string // 工作站名称
  routeId: number // 工艺路线编号
  processId: number // 工序编号
  processName?: string // 工序名称
  itemId: number // 产品物料编号
  itemName?: string // 产品名称
  itemCode?: string // 产品编码
  itemSpecification?: string // 规格型号
  unitMeasureName?: string // 计量单位
  quantity: number // 排产数量
  producedQuantity?: number // 已生产数量
  qualifyQuantity?: number // 合格品数量
  unqualifyQuantity?: number // 不良品数量
  changedQuantity?: number // 调整数量
  clientId?: number // 客户编号
  clientName?: string // 客户名称
  startTime?: number | string // 开始生产时间
  duration?: number // 生产时长（工作日）
  endTime?: number | string // 结束生产时间
  colorCode?: string // 甘特图显示颜色
  requestDate?: number | string // 需求日期
  finishDate?: number | string // 完成日期
  cancelDate?: number | string // 取消日期
  status?: number // 任务状态
  checkFlag?: boolean // 是否质检
  remark?: string // 备注
  createTime?: number | string // 创建时间
}

/** MES 生产任务创建参数 */
export interface ProTaskCreateReqVO {
  workOrderId: number
  workstationId: number
  routeId: number
  processId: number
  itemId: number
  quantity: number
  startTime?: number | string
  duration?: number
  endTime?: number | string
  colorCode?: string
  remark?: string
}

/** MES 生产任务更新参数 */
export interface ProTaskUpdateReqVO extends Partial<ProTaskCreateReqVO> {
  id: number
}

/** MES 甘特图任务 VO */
export interface ProTaskGanttVO {
  id: string | number
  originalId?: number
  text?: string
  type?: number | string
  parent?: string | number
  process?: string
  workstation?: string
  startDate?: number | string
  endDate?: number | string
  duration?: number
  progress?: number
  color?: string
  colorCode?: string
}

/** 查询生产任务分页 */
export function getTaskPage(params: ProTaskQueryParams) {
  return http.get<PageResult<ProTaskVO>>('/mes/pro/task/page', params)
}

/** 查询生产任务详情 */
export function getTask(id: number) {
  return http.get<ProTaskVO>(`/mes/pro/task/get?id=${id}`)
}

/** 新增生产任务 */
export function createTask(data: ProTaskCreateReqVO) {
  return http.post<number>('/mes/pro/task/create', data)
}

/** 修改生产任务 */
export function updateTask(data: ProTaskUpdateReqVO) {
  return http.put<boolean>('/mes/pro/task/update', data)
}

/** 删除生产任务 */
export function deleteTask(id: number) {
  return http.delete<boolean>(`/mes/pro/task/delete?id=${id}`)
}

/** 导出生产任务 Excel */
export function exportTask(params: Partial<ProTaskQueryParams>) {
  return http.get<Blob>('/mes/pro/task/export-excel', params)
}

/** 获得甘特图任务列表 */
export function getGanttTaskList(params: ProTaskGanttQueryParams) {
  return http.get<ProTaskGanttVO[]>('/mes/pro/task/gantt-list', params)
}

export const ProTaskApi = {
  getTaskPage,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  exportTask,
  getGanttTaskList,
}
