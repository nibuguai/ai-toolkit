import type { Action, Trigger } from '@/api/iot/rule/scene'
import { IotRuleSceneActionTypeEnum, IotRuleSceneTriggerTypeEnum, isDeviceTrigger } from './constants'

/** 判断值是否为空（兼容数值 0 / 布尔 false） */
function isEmptyVal(value: unknown) {
  return value === undefined || value === null || value === ''
}

/** 执行器参数是否为空（空字符串 / 空对象视为空） */
export function isActionParamsEmpty(params?: string) {
  if (!params || !String(params).trim()) return true
  try {
    const parsed = JSON.parse(String(params))
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return Object.keys(parsed).length === 0
    }
  } catch {
    return false
  }
  return false
}

/** 校验单个触发器（与触发器 UI 必填项保持一致） */
export function validateTriggerItem(trigger: Trigger, index: number): string | null {
  if (!trigger.type) return `触发器 ${index + 1}：触发方式不能为空`
  // 设备类触发器都需要产品、设备
  if (isDeviceTrigger(trigger.type)) {
    if (!trigger.productId) return `触发器 ${index + 1}：产品不能为空`
    if (!trigger.deviceId) return `触发器 ${index + 1}：设备不能为空`
    // 设备状态变更：只校验操作符 + 状态值
    if (trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE) {
      if (!trigger.operator) return `触发器 ${index + 1}：操作符不能为空`
      if (isEmptyVal(trigger.value)) return `触发器 ${index + 1}：设备状态不能为空`
      return null
    }
    if (!trigger.identifier) return `触发器 ${index + 1}：监控项不能为空`
    // 事件上报、服务调用只监听是否发生；属性上报需要比较条件
    const isEventOrService = trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST || trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
    if (!isEventOrService) {
      if (!trigger.operator) return `触发器 ${index + 1}：操作符不能为空`
      if (isEmptyVal(trigger.value)) return `触发器 ${index + 1}：比较值不能为空`
    }
    return null
  }
  // 定时触发器需要 CRON 表达式
  if (trigger.type === IotRuleSceneTriggerTypeEnum.TIMER && !trigger.cronExpression) {
    return `触发器 ${index + 1}：CRON 表达式不能为空`
  }
  return null
}

/** 校验单个执行器（与执行器 UI 必填项保持一致） */
export function validateActionItem(action: Action, index: number): string | null {
  const prefix = `执行器 ${index + 1}`
  if (!action.type) return `${prefix}：执行动作不能为空`
  // 设备属性设置 / 服务调用：需要产品、设备和参数
  if (action.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET || action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE) {
    if (!action.productId) return `${prefix}：产品不能为空`
    if (!action.deviceId) return `${prefix}：设备不能为空`
    if (action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE && !action.identifier) return `${prefix}：服务不能为空`
    if (isActionParamsEmpty(action.params)) return `${prefix}：参数配置不能为空`
    try { JSON.parse(String(action.params)) } catch { return `${prefix}：参数格式须为合法 JSON` }
    return null
  }
  // 告警恢复：需要绑定告警配置
  if (action.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER && !action.alertConfigId) {
    return `${prefix}：告警配置不能为空`
  }
  return null
}
