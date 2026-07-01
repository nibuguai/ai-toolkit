<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true"><wd-search :placeholder="placeholder" hide-cancel disabled /></view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <EntityPicker v-model="formData.configId" label="告警配置" :columns="configOptions" placeholder="请选择告警配置" label-width="160rpx" />
      <view class="yd-search-form-item"><view class="yd-search-form-label">告警级别</view><wd-radio-group v-model="formData.configLevel" type="button"><wd-radio :value="-1">全部</wd-radio><wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.IOT_ALERT_LEVEL)" :key="dict.value" :value="dict.value">{{ dict.label }}</wd-radio></wd-radio-group></view>
      <EntityPicker v-model="formData.productId" label="产品" :columns="productOptions" placeholder="请选择产品" label-width="160rpx" />
      <EntityPicker v-model="formData.deviceId" label="设备" :columns="deviceOptions" label-key="deviceName" placeholder="请选择设备" label-width="160rpx" />
      <view class="yd-search-form-item"><view class="yd-search-form-label">是否处理</view><wd-radio-group v-model="formData.processStatus" type="button"><wd-radio :value="'all'">全部</wd-radio><wd-radio :value="true">已处理</wd-radio><wd-radio :value="false">未处理</wd-radio></wd-radio-group></view>
      <view class="yd-search-form-actions"><wd-button class="flex-1" variant="plain" @click="handleReset">重置</wd-button><wd-button class="flex-1" type="primary" @click="handleSearch">搜索</wd-button></view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { AlertConfig } from '@/api/iot/alert/config'
import type { Device } from '@/api/iot/device/device'
import type { Product } from '@/api/iot/product/product'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getSimpleAlertConfigList } from '@/api/iot/alert/config'
import { getSimpleDeviceList } from '@/api/iot/device/device'
import { getSimpleProductList } from '@/api/iot/product/product'
import { getIntDictOptions } from '@/hooks/useDict'
import EntityPicker from '@/pages-iot/components/entity-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()
const visible = ref(false) // 搜索弹窗显示状态
const configOptions = ref<AlertConfig[]>([]) // 告警配置选项
const productOptions = ref<Product[]>([]) // 产品选项
const deviceOptions = ref<Device[]>([]) // 设备选项
const formData = reactive({ configId: undefined as number | undefined, configLevel: -1, productId: undefined as number | undefined, deviceId: undefined as number | undefined, processStatus: 'all' as boolean | 'all' }) // 搜索表单数据
const placeholder = computed(() => formData.configId || formData.productId || formData.deviceId || formData.configLevel !== -1 || formData.processStatus !== 'all' ? '搜索条件已设置' : '搜索告警记录')

// 切换产品时按产品过滤设备并清空已选设备
watch(() => formData.productId, async (productId) => {
  formData.deviceId = undefined
  deviceOptions.value = productId ? await getSimpleDeviceList(undefined, productId) : []
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    configId: formData.configId,
    configLevel: formData.configLevel === -1 ? undefined : formData.configLevel,
    productId: formData.productId,
    deviceId: formData.deviceId,
    processStatus: formData.processStatus === 'all' ? undefined : formData.processStatus,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.configId = undefined
  formData.configLevel = -1
  formData.productId = undefined
  formData.deviceId = undefined
  formData.processStatus = 'all'
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(async () => {
  configOptions.value = await getSimpleAlertConfigList()
  productOptions.value = await getSimpleProductList()
})
</script>
