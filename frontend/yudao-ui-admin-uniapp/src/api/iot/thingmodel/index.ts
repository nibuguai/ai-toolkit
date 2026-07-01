import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IoT 产品物模型 */
export interface ThingModelData {
  id?: number
  identifier?: string
  name?: string
  description?: string
  productId?: number
  productKey?: string
  dataType?: string
  type?: number
  property?: ThingModelProperty
  event?: ThingModelEvent
  service?: ThingModelService
  createTime?: string
}

/** 物模型属性 */
export interface ThingModelProperty {
  identifier?: string
  name?: string
  accessMode?: string
  required?: boolean
  dataType?: string
  description?: string
  dataSpecs?: any
  dataSpecsList?: any[]
  [key: string]: any
}

/** 物模型事件 */
export interface ThingModelEvent {
  identifier?: string
  name?: string
  required?: boolean
  type?: string
  description?: string
  outputParams?: ThingModelParam[]
  method?: string
  [key: string]: any
}

/** 物模型服务 */
export interface ThingModelService {
  identifier?: string
  name?: string
  required?: boolean
  callType?: string
  description?: string
  inputParams?: ThingModelParam[]
  outputParams?: ThingModelParam[]
  method?: string
  [key: string]: any
}

/** 物模型参数 */
export interface ThingModelParam {
  identifier: string
  name: string
  direction: string
  paraOrder?: number
  dataType: string
  dataSpecs?: any
  dataSpecsList?: any[]
}

/** 物模型 TSL 响应 */
export interface IotThingModelTSLResp {
  productId: number
  productKey: string
  properties: ThingModelProperty[]
  events: ThingModelEvent[]
  services: ThingModelService[]
}

/** 获取产品物模型分页列表 */
export function getThingModelPage(params: PageParam) {
  return http.get<PageResult<ThingModelData>>('/iot/thing-model/page', params)
}

/** 获取产品物模型列表 */
export function getThingModelList(params: Record<string, any>) {
  return http.get<ThingModelData[]>('/iot/thing-model/list', params)
}

/** 获取产品物模型 TSL */
export function getThingModelTSLByProductId(productId: number) {
  return http.get<IotThingModelTSLResp>(`/iot/thing-model/get-tsl?productId=${productId}`)
}

/** 获取产品物模型详情 */
export function getThingModel(id: number) {
  return http.get<ThingModelData>(`/iot/thing-model/get?id=${id}`)
}

/** 创建产品物模型 */
export function createThingModel(data: ThingModelData) {
  return http.post<number>('/iot/thing-model/create', data)
}

/** 更新产品物模型 */
export function updateThingModel(data: ThingModelData) {
  return http.put<boolean>('/iot/thing-model/update', data)
}

/** 删除产品物模型 */
export function deleteThingModel(id: number) {
  return http.delete<boolean>(`/iot/thing-model/delete?id=${id}`)
}
