<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="设备配置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 配置内容 -->
    <view class="min-h-0 flex-1 overflow-y-auto p-24rpx">
      <wd-loading v-if="loading" />
      <view v-else>
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
            {{ deviceData?.deviceName || '-' }}
          </view>
          <view class="text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">设备编号：</text>{{ deviceData?.id || '-' }}
          </view>
        </view>

        <wd-cell-group border>
          <wd-form-item title="配置 JSON" title-width="200rpx">
            <wd-textarea
              v-model="configText"
              placeholder="请输入设备配置 JSON"
              :maxlength="8000"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" :loading="saving" @click="handleSave">保存</wd-button>
        <wd-button class="flex-1" type="success" :loading="pushing" @click="handlePush">配置推送</wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Device } from '@/api/iot/device/device'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getDevice, sendDeviceMessage, updateDevice } from '@/api/iot/device/device'
import { IotDeviceMessageMethodEnum } from '@/pages-iot/utils/constants'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{ deviceId?: number | any }>()

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const toast = useToast()
const dialog = useDialog()
const loading = ref(false) // 页面加载状态
const saving = ref(false) // 保存状态
const pushing = ref(false) // 推送状态
const deviceData = ref<Device>() // 设备详情
const configText = ref('{}') // 配置 JSON 文本

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-iot/device/device/detail/index?id=${props.deviceId}`)
}

/** 解析配置 JSON */
function parseConfigText() {
  try {
    return configText.value ? JSON.parse(configText.value) : {}
  } catch {
    toast.warning('配置 JSON 格式不正确')
    return undefined
  }
}

/** 格式化设备配置 */
function formatDeviceConfig(config?: string) {
  if (!config) {
    return '{}'
  }
  try {
    return JSON.stringify(JSON.parse(config), null, 2)
  } catch {
    return config
  }
}

/** 加载设备详情 */
async function getDetail() {
  if (!props.deviceId) {
    return
  }
  loading.value = true
  try {
    deviceData.value = await getDevice(Number(props.deviceId))
    configText.value = formatDeviceConfig(deviceData.value.config)
  } finally {
    loading.value = false
  }
}

/** 保存配置 */
async function handleSave() {
  if (!props.deviceId) {
    return
  }
  const config = parseConfigText()
  if (config === undefined) {
    return
  }
  saving.value = true
  try {
    await updateDevice({ id: Number(props.deviceId), config: JSON.stringify(config) } as Device)
    toast.success('保存成功')
    await getDetail()
  } finally {
    saving.value = false
  }
}

/** 推送配置 */
async function handlePush() {
  if (!props.deviceId) {
    return
  }
  const config = parseConfigText()
  if (config === undefined) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要推送配置到设备吗？' })
  } catch {
    return
  }
  pushing.value = true
  try {
    await sendDeviceMessage({
      deviceId: Number(props.deviceId),
      method: IotDeviceMessageMethodEnum.CONFIG_PUSH.method,
      params: config,
    })
    toast.success('推送成功')
  } finally {
    pushing.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
