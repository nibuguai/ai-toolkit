import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// MES 条码配置 VO
export interface WmBarcodeConfigVO {
  id: number
  format: number
  bizType: number
  contentFormat: string
  contentExample?: string
  autoGenerateFlag: boolean
  defaultTemplate?: string
  status: number
  remark?: string
  createTime?: string | Date
}

export interface WmBarcodeConfigQueryParams extends PageParam {
  format?: number
  bizType?: number
  autoGenerateFlag?: boolean
  status?: number
  createTime?: string[]
}

export interface WmBarcodeConfigCreateReqVO {
  format: number
  bizType: number
  contentFormat: string
  contentExample?: string
  autoGenerateFlag: boolean
  defaultTemplate?: string
  status?: number
  remark?: string
}

export interface WmBarcodeConfigUpdateReqVO extends WmBarcodeConfigCreateReqVO {
  id: number
}

/** 查询条码配置分页 */
export function getBarcodeConfigPage(params: WmBarcodeConfigQueryParams) {
  return http.get<PageResult<WmBarcodeConfigVO>>('/mes/wm/barcode-config/page', params)
}

/** 查询条码配置详情 */
export function getBarcodeConfig(id: number) {
  return http.get<WmBarcodeConfigVO>(`/mes/wm/barcode-config/get?id=${id}`)
}

/** 新增条码配置 */
export function createBarcodeConfig(data: WmBarcodeConfigCreateReqVO) {
  return http.post<number>('/mes/wm/barcode-config/create', data)
}

/** 修改条码配置 */
export function updateBarcodeConfig(data: WmBarcodeConfigUpdateReqVO) {
  return http.put<boolean>('/mes/wm/barcode-config/update', data)
}

/** 删除条码配置 */
export function deleteBarcodeConfig(id: number) {
  return http.delete<boolean>(`/mes/wm/barcode-config/delete?id=${id}`)
}

export const WmBarcodeConfigApi = {
  getBarcodeConfigPage,
  getBarcodeConfig,
  createBarcodeConfig,
  updateBarcodeConfig,
  deleteBarcodeConfig,
}
