import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

// MES 条码清单 VO
export interface WmBarcodeVO {
  id: number
  configId?: number
  format: number
  bizType: number
  content?: string
  bizId?: number
  bizCode?: string
  bizName?: string
  status: number
  remark?: string
  createTime?: string | Date
}

export interface WmBarcodeQueryParams extends PageParam {
  configId?: number
  format?: number
  bizType?: number
  content?: string
  bizId?: number
  bizCode?: string
  bizName?: string
  status?: number
  createTime?: string[]
}

export interface WmBarcodeCreateReqVO {
  configId?: number
  bizType: number
  content?: string
  bizId: number
  bizCode: string
  bizName?: string
  status?: number
  remark?: string
}

export interface WmBarcodeUpdateReqVO extends WmBarcodeCreateReqVO {
  id: number
}

/** 查询条码分页 */
export function getBarcodePage(params: WmBarcodeQueryParams) {
  return http.get<PageResult<WmBarcodeVO>>('/mes/wm/barcode/page', params)
}

/** 查询条码详情 */
export function getBarcode(id: number) {
  return http.get<WmBarcodeVO>(`/mes/wm/barcode/get?id=${id}`)
}

/** 根据业务对象获取条码 */
export function getBarcodeByBusiness(bizType: number, bizId: number) {
  return http.get<WmBarcodeVO>('/mes/wm/barcode/get-by-business', { bizType, bizId })
}

/** 新增条码 */
export function createBarcode(data: WmBarcodeCreateReqVO) {
  return http.post<number>('/mes/wm/barcode/create', data)
}

/** 修改条码 */
export function updateBarcode(data: WmBarcodeUpdateReqVO) {
  return http.put<boolean>('/mes/wm/barcode/update', data)
}

/** 删除条码 */
export function deleteBarcode(id: number) {
  return http.delete<boolean>(`/mes/wm/barcode/delete?id=${id}`)
}

/** 导出条码 Excel */
export function exportBarcode(params: WmBarcodeQueryParams) {
  return http.get<Blob>('/mes/wm/barcode/export-excel', params)
}

/** 生成条码内容 */
export function generateBarcodeContent(bizType: number, bizCode: string) {
  return http.get<string>('/mes/wm/barcode/generate-content', { bizType, bizCode })
}

export const WmBarcodeApi = {
  getBarcodePage,
  getBarcode,
  getBarcodeByBusiness,
  createBarcode,
  updateBarcode,
  deleteBarcode,
  exportBarcode,
  generateBarcodeContent,
}
