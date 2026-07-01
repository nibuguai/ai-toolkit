<template>
  <view class="mb-20rpx rounded-12rpx bg-white">
    <view class="flex items-center justify-between px-24rpx py-16rpx">
      <text class="text-28rpx text-[#333] font-semibold">触发器 {{ index + 1 }}</text>
      <text class="text-26rpx text-[#fa4350]" @click="emit('remove')">删除</text>
    </view>
    <wd-cell-group border>
      <EntityPicker v-model="trigger.type" label="触发方式" :columns="triggerTypeOptions" label-key="label" value-key="value" placeholder="请选择触发方式" label-width="200rpx" @update:model-value="onTypeChange" />
      <!-- 设备类触发 -->
      <template v-if="isDevice">
        <EntityPicker v-model="trigger.productId" label="产品" :columns="productOptions" placeholder="请选择产品" label-width="200rpx" @update:model-value="onProductChange" />
        <EntityPicker v-model="trigger.deviceId" label="设备" :columns="deviceOptions" label-key="deviceName" placeholder="请选择设备" label-width="200rpx" />
        <EntityPicker v-if="showIdentifier" v-model="trigger.identifier" label="监控项" :columns="identifierOptions" label-key="name" value-key="identifier" placeholder="请选择监控项" label-width="200rpx" />
        <template v-if="showOperatorValue">
          <EntityPicker v-model="trigger.operator" label="操作符" :columns="operatorOptions" label-key="label" value-key="value" placeholder="请选择操作符" label-width="200rpx" />
          <EntityPicker v-if="isStateUpdate" v-model="trigger.value" label="设备状态" :columns="deviceStatusOptions" label-key="label" value-key="value" placeholder="请选择设备状态" label-width="200rpx" />
          <wd-form-item v-else title="比较值" title-width="200rpx"><wd-input v-model="trigger.value" placeholder="请输入比较值" /></wd-form-item>
        </template>
      </template>
      <!-- 定时触发 -->
      <wd-form-item v-else title="CRON 表达式" title-width="200rpx"><wd-input v-model="trigger.cronExpression" placeholder="如 0 0 12 * * ?" /></wd-form-item>
    </wd-cell-group>
  </view>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/iot/product/product'
import type { Trigger } from '@/api/iot/rule/scene'
import { computed, ref, watch } from 'vue'
import { getDeviceListByProductId } from '@/api/iot/device/device'
import { getThingModelList } from '@/api/iot/thingmodel'
import EntityPicker from '@/pages-iot/components/entity-picker.vue'
import { deviceStatusOptions, IotRuleSceneTriggerTypeEnum, IoTThingModelTypeEnum, isDeviceTrigger, operatorOptions, triggerTypeOptions } from '@/pages-iot/utils/constants'

const props = defineProps<{ trigger: Trigger, productOptions: Product[], index: number }>()
const emit = defineEmits<{ (e: 'remove'): void }>()

const deviceOptions = ref<any[]>([]) // 设备选项
const thingModelList = ref<any[]>([]) // 产品物模型列表

const isDevice = computed(() => isDeviceTrigger(props.trigger.type))
const isStateUpdate = computed(() => props.trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE)
const showIdentifier = computed(() => [IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST, IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST, IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE].includes(props.trigger.type as any))
const showOperatorValue = computed(() => isStateUpdate.value || props.trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST)
const identifierOptions = computed(() => {
  // 按触发类型过滤物模型：属性 / 事件 / 服务
  const typeMap: Record<number, number> = {
    [IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST]: IoTThingModelTypeEnum.PROPERTY,
    [IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST]: IoTThingModelTypeEnum.EVENT,
    [IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE]: IoTThingModelTypeEnum.SERVICE,
  }
  return thingModelList.value.filter(item => item.type === typeMap[props.trigger.type])
})

// 产品变化时加载该产品的设备与物模型
watch(() => props.trigger.productId, async (productId) => {
  deviceOptions.value = productId ? await getDeviceListByProductId(productId) : []
  thingModelList.value = productId ? await getThingModelList({ productId }) : []
}, { immediate: true })

/** 切换触发方式重置相关字段 */
function onTypeChange() {
  props.trigger.productId = undefined
  props.trigger.deviceId = undefined
  props.trigger.identifier = undefined
  props.trigger.operator = undefined
  props.trigger.value = undefined
  props.trigger.cronExpression = undefined
}

/** 切换产品重置设备与监控项 */
function onProductChange() {
  props.trigger.deviceId = undefined
  props.trigger.identifier = undefined
}
</script>
