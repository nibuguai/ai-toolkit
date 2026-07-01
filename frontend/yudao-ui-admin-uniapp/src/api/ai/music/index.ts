import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** AI 音乐 */
export interface MusicVO {
  id?: number
  userId?: number
  title?: string
  lyric?: string
  imageUrl?: string
  audioUrl?: string
  videoUrl?: string
  status?: number
  gptDescriptionPrompt?: string
  prompt?: string
  platform?: string
  model?: string
  generateMode?: number
  tags?: string | string[]
  duration?: number
  publicStatus?: boolean
  taskId?: string
  errorMessage?: string
  createTime?: string
}

/** AI 音乐生成请求 */
export interface MusicGenerateReqVO {
  platform: string
  generateMode: number
  prompt?: string
  makeInstrumental?: boolean
  model: string
  tags?: string[]
  title?: string
}

/** 查询我的音乐分页 */
export function getMusicMyPage(params: PageParam) {
  return http.get<PageResult<MusicVO>>('/ai/music/my-page', params)
}

/** 生成音乐 */
export function generateMusic(data: MusicGenerateReqVO) {
  return http.post<number[]>('/ai/music/generate', data)
}

/** 删除我的音乐 */
export function deleteMusicMy(id: number) {
  return http.delete<boolean>(`/ai/music/delete-my?id=${id}`)
}

/** 查询我的音乐详情 */
export function getMusicMy(id: number) {
  return http.get<MusicVO>(`/ai/music/get-my?id=${id}`)
}

/** 修改我的音乐标题 */
export function updateMusicMy(data: Pick<MusicVO, 'id' | 'title'>) {
  return http.post<boolean>('/ai/music/update-my', data)
}

/** 查询音乐分页 */
export function getMusicPage(params: PageParam) {
  return http.get<PageResult<MusicVO>>('/ai/music/page', params)
}

/** 更新音乐 */
export function updateMusic(data: MusicVO) {
  return http.put<boolean>('/ai/music/update', data)
}

/** 删除音乐 */
export function deleteMusic(id: number) {
  return http.delete<boolean>(`/ai/music/delete?id=${id}`)
}

/** AI 音乐 API */
export const MusicApi = {
  getMusicMyPage,
  generateMusic,
  deleteMusicMy,
  getMusicMy,
  updateMusicMy,
  getMusicPage,
  updateMusic,
  deleteMusic,
}
