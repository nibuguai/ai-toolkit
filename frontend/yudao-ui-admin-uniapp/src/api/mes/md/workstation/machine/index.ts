import { http } from '@/http/http'

// MES 设备资源 VO
export interface MdWorkstationMachineVO {
  id: number
  workstationId: number // 工作站 ID
  machineryId: number // 设备 ID
  machineryName: string // 设备名称
  machineryCode: string // 设备编码
  quantity: number // 数量
  remark: string // 备注
}

export interface MdWorkstationMachineCreateReqVO {
  workstationId: number // 工作站 ID
  machineryId: number // 设备 ID
  quantity: number // 数量
  remark?: string // 备注
}

/** 查询设备资源列表 */
export function getWorkstationMachineList(workstationId: number) {
  return http.get<MdWorkstationMachineVO[]>(`/mes/md-workstation-machine/list-by-workstation?workstationId=${workstationId}`)
}

/** 新增设备资源 */
export function createWorkstationMachine(data: MdWorkstationMachineCreateReqVO) {
  return http.post<number>(`/mes/md-workstation-machine/create`, data)
}

/** 删除设备资源 */
export function deleteWorkstationMachine(id: number) {
  return http.delete<boolean>(`/mes/md-workstation-machine/delete?id=${id}`)
}

export const MdWorkstationMachineApi = {
  getWorkstationMachineList,
  createWorkstationMachine,
  deleteWorkstationMachine,
}
