<template>
  <view class="mb-20rpx rounded-12rpx bg-white">
    <view class="flex items-center justify-between px-24rpx py-16rpx">
      <text class="text-28rpx text-[#333] font-semibold">执行器 {{ index + 1 }}</text>
      <text class="text-26rpx text-[#fa4350]" @click="emit('remove')">删除</text>
    </view>
    <wd-cell-group border>
      <EntityPicker v-model="action.type" label="执行动作" :columns="actionTypeOptions" label-key="label" value-key="value" placeholder="请选择执行动作" label-width="200rpx" @update:model-value="onTypeChange" />
      <!-- 设备控制 -->
      <template v-if="isDeviceControl">
        <EntityPicker v-model="action.productId" label="产品" :columns="productOptions" placeholder="请选择产品" label-width="200rpx" @update:model-value="onProductChange" />
        <EntityPicker v-model="action.deviceId" label="设备" :columns="deviceOptions" label-key="deviceName" placeholder="请选择设备" label-width="200rpx" />
        <EntityPicker v-model="action.identifier" :label="isServiceInvoke ? '服务' : '属性'" :columns="identifierOptions" label-key="name" value-key="identifier" :placeholder="isServiceInvoke ? '请选择服务' : '请选择属性'" label-width="200rpx" />
        <wd-form-item title="参数(JSON)" title-width="200rpx"><wd-textarea v-model="action.params" placeholder='如 {"switch": 1}' /></wd-form-item>
      </template>
      <!-- 告警触发 / 恢复 -->
      <EntityPicker v-else v-model="action.alertConfigId" label="告警配置" :columns="alertConfigOptions" placeholder="请选择告警配置" label-width="200rpx" />
    </wd-cell-group>
  </view>
</template>

<script lang="ts" setup>
import type { AlertConfig } from '@/api/iot/alert/config'
import type { Product } from '@/api/iot/product/product'
import type { Action } from '@/api/iot/rule/scene'
import { computed, ref, watch } from 'vue'
import { getDeviceListByProductId } from '@/api/iot/device/device'
import { getThingModelList } from '@/api/iot/thingmodel'
import EntityPicker from '@/pages-iot/components/entity-picker.vue'
import { actionTypeOptions, IotRuleSceneActionTypeEnum, IoTThingModelTypeEnum } from '@/pages-iot/utils/constants'

const props = defineProps<{ action: Action, productOptions: Product[], alertConfigOptions: AlertConfig[], index: number }>()
const emit = defineEmits<{ (e: 'remove'): void }>()

const deviceOptions = ref<any[]>([]) // 设备选项
const thingModelList = ref<any[]>([]) // 产品物模型列表

const isServiceInvoke = computed(() => props.action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE)
const isDeviceControl = computed(() => props.action.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET || isServiceInvoke.value)
const identifierOptions = computed(() => {
  // 属性设置取属性，服务调用取服务
  const tmType = isServiceInvoke.value ? IoTThingModelTypeEnum.SERVICE : IoTThingModelTypeEnum.PROPERTY
  return thingModelList.value.filter(item => item.type === tmType)
})

// 产品变化时加载该产品的设备与物模型
watch(() => props.action.productId, async (productId) => {
  deviceOptions.value = productId ? await getDeviceListByProductId(productId) : []
  thingModelList.value = productId ? await getThingModelList({ productId }) : []
}, { immediate: true })

/** 切换执行动作重置相关字段 */
function onTypeChange() {
  props.action.productId = undefined
  props.action.deviceId = undefined
  props.action.identifier = undefined
  props.action.params = ''
  props.action.alertConfigId = undefined
}

/** 切换产品重置设备与监控项 */
function onProductChange() {
  props.action.deviceId = undefined
  props.action.identifier = undefined
}
</script>
