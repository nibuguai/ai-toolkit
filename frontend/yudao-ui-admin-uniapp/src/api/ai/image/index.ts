import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 绘图 */
export interface ImageVO {
  id?: number
  userId?: number
  platform?: string
  model?: string
  prompt?: string
  width?: number | string
  height?: number | string
  status?: number
  publicStatus?: boolean
  picUrl?: string
  errorMessage?: string
  options?: Record<string, any>
  taskId?: number | string
  buttons?: ImageMidjourneyButtonsVO[]
  createTime?: string
  finishTime?: string
}

/** AI 图片生成请求 */
export interface ImageDrawReqVO {
  prompt: string
  modelId?: number
  style?: string
  width?: string
  height?: string
  options?: Record<string, any>
}

/** Midjourney 生成请求 */
export interface ImageMidjourneyImagineReqVO {
  prompt: string
  modelId: number
  base64Array: string[]
  width: string
  height: string
  version: string
}

/** Midjourney 操作请求 */
export interface ImageMidjourneyActionVO {
  id: number
  customId: string
}

/** Midjourney 操作按钮 */
export interface ImageMidjourneyButtonsVO {
  customId: string
  emoji: string
  label: string
  style: number
}

/** 获取我的绘图分页 */
export function getImagePageMy(params: PageParam) {
  return http.get<PageResult<ImageVO>>('/ai/image/my-page', params)
}

/** 获取我的绘图记录 */
export function getImageMy(id: number) {
  return http.get<ImageVO>(`/ai/image/get-my?id=${id}`)
}

/** 获取我的绘图记录列表 */
export function getImageListMyByIds(ids: number[]) {
  return http.get<ImageVO[]>('/ai/image/my-list-by-ids', { ids: ids.join(',') })
}

/** 生成图片 */
export function drawImage(data: ImageDrawReqVO) {
  return http.post<number>('/ai/image/draw', data)
}

/** 删除我的绘画记录 */
export function deleteImageMy(id: number) {
  return http.delete<boolean>(`/ai/image/delete-my?id=${id}`)
}

/** Midjourney 生成图片 */
export function midjourneyImagine(data: ImageMidjourneyImagineReqVO) {
  return http.post<number>('/ai/image/midjourney/imagine', data)
}

/** Midjourney 二次生成 */
export function midjourneyAction(data: ImageMidjourneyActionVO) {
  return http.post<number>('/ai/image/midjourney/action', data)
}

/** 查询绘画分页 */
export function getImagePage(params: PageParam) {
  return http.get<PageResult<ImageVO>>('/ai/image/page', params)
}

/** 更新绘画发布状态 */
export function updateImage(data: ImageVO) {
  return http.put<boolean>('/ai/image/update', data)
}

/** 删除绘画 */
export function deleteImage(id: number) {
  return http.delete<boolean>(`/ai/image/delete?id=${id}`)
}

/** AI 图片 API */
export const ImageApi = {
  getImagePageMy,
  getImageMy,
  getImageListMyByIds,
  drawImage,
  deleteImageMy,
  midjourneyImagine,
  midjourneyAction,
  getImagePage,
  updateImage,
  deleteImage,
}
