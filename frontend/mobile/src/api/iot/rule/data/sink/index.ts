import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** IoT 数据流转目的配置 */
export interface DataSinkConfig {
  type?: string
  [key: string]: any
}

/** IoT 数据流转目的信息 */
export interface DataSink {
  id?: number
  name?: string
  description?: string
  status?: number
  direction?: number
  type?: number
  config?: DataSinkConfig
  createTime?: string
}

/** 数据流转目的类型 */
export const IotDataSinkTypeEnum = {
  HTTP: 1,
  TCP: 2,
  WEBSOCKET: 3,
  MQTT: 10,
  DATABASE: 20,
  REDIS_STREAM: 21,
  ROCKETMQ: 30,
  RABBITMQ: 31,
  KAFKA: 32,
} as const

/** 获取数据流转目的分页列表 */
export function getDataSinkPage(params: PageParam) {
  return http.get<PageResult<DataSink>>('/iot/data-sink/page', params)
}

/** 获取数据流转目的详情 */
export function getDataSink(id: number) {
  return http.get<DataSink>(`/iot/data-sink/get?id=${id}`)
}

/** 创建数据流转目的 */
export function createDataSink(data: DataSink) {
  return http.post<number>('/iot/data-sink/create', data)
}

/** 更新数据流转目的 */
export function updateDataSink(data: DataSink) {
  return http.put<boolean>('/iot/data-sink/update', data)
}

/** 删除数据流转目的 */
export function deleteDataSink(id: number) {
  return http.delete<boolean>(`/iot/data-sink/delete?id=${id}`)
}

/** 获取数据流转目的精简列表 */
export function getDataSinkSimpleList() {
  return http.get<DataSink[]>('/iot/data-sink/simple-list')
}
