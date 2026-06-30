import { http } from '@/http/http'

/** IoT 统计数据 */
export interface IotStatisticsSummaryRespVO {
  productCategoryCount: number
  productCount: number
  deviceCount: number
  deviceMessageCount: number
  productCategoryTodayCount: number
  productTodayCount: number
  deviceTodayCount: number
  deviceMessageTodayCount: number
  deviceOnlineCount: number
  deviceOfflineCount: number
  deviceInactiveCount: number
  productCategoryDeviceCounts: Record<string, number>
}

/** IoT 设备消息按时间统计 */
export interface IotStatisticsDeviceMessageSummaryByDateRespVO {
  time: string
  upstreamCount: number
  downstreamCount: number
}

/** IoT 设备消息统计参数 */
export interface IotStatisticsDeviceMessageReqVO {
  interval: number
  times?: string[]
}

/** 设备位置数据 */
export interface DeviceLocationRespVO {
  id: number
  deviceName: string
  nickname?: string
  productName?: string
  state: number
  longitude: number
  latitude: number
}

/** 查询全局统计 */
export function getStatisticsSummary() {
  return http.get<IotStatisticsSummaryRespVO>('/iot/statistics/get-summary')
}

/** 获取设备消息统计 */
export function getDeviceMessageSummaryByDate(params: IotStatisticsDeviceMessageReqVO) {
  return http.get<IotStatisticsDeviceMessageSummaryByDateRespVO[]>('/iot/statistics/get-device-message-summary-by-date', params)
}
