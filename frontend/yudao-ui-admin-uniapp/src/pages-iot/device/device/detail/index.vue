<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="设备详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="设备编号" :value="String(formData?.id || '-')" />
        <wd-cell title="DeviceName" :value="formData?.deviceName || '-'" />
        <wd-cell title="备注名称" :value="formData?.nickname || '-'" />
        <wd-cell title="所属产品" :value="formData?.productName || String(formData?.productId || '-')" />
        <wd-cell title="设备类型">
          <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="formData?.deviceType" />
        </wd-cell>
        <wd-cell title="设备状态">
          <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="formData?.state" />
        </wd-cell>
        <wd-cell title="设备 IP" :value="formData?.ip || '-'" />
        <wd-cell title="固件版本" :value="formData?.firmwareVersion || '-'" />
        <wd-cell title="设备序列号" :value="formData?.serialNumber || '-'" />
        <wd-cell title="设备地址" :value="formData?.address || '-'" />
        <wd-cell title="激活时间" :value="formatDateTime(formData?.activeTime) || '-'" />
        <wd-cell title="上线时间" :value="formatDateTime(formData?.onlineTime) || '-'" />
        <wd-cell title="离线时间" :value="formatDateTime(formData?.offlineTime) || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 设备子功能 -->
    <view class="mt-24rpx">
      <wd-cell-group border>
        <wd-cell title="物模型数据" label="查看设备属性运行状态" is-link @click="handleThingModel" />
        <wd-cell title="设备消息" label="查看上下行消息日志" is-link @click="handleMessage" />
        <wd-cell title="模拟设备" label="模拟设备上行和下行指令" is-link @click="handleSimulator" />
        <wd-cell title="设备配置" label="编辑配置并远程推送" is-link @click="handleConfig" />
        <wd-cell v-if="isGateway" title="子设备管理" label="查看和绑定网关子设备" is-link @click="handleSubDevice" />
        <wd-cell v-if="isModbusProduct" title="Modbus 配置" label="查看连接配置和点位配置" is-link @click="handleModbus" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="info" :loading="authLoading" @click="handleAuthInfo">
          认证
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['iot:device:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['iot:device:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>

    <!-- 认证信息弹窗 -->
    <wd-popup v-model="authVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          设备认证信息
        </view>
        <wd-cell-group border>
          <wd-cell title="ClientId" :value="authInfo?.clientId || '-'" />
          <wd-cell title="Username" :value="authInfo?.username || '-'" />
          <wd-cell title="Password" :value="authInfo?.password || '-'" />
        </wd-cell-group>
        <wd-button class="mt-24rpx" block @click="authVisible = false">
          关闭
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { Device, IotDeviceAuthInfo } from '@/api/iot/device/device'
import type { Product } from '@/api/iot/product/product'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteDevice, getDevice, getDeviceAuthInfo } from '@/api/iot/device/device'
import { DeviceTypeEnum, getProduct, ProtocolTypeEnum } from '@/api/iot/product/product'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<Device>() // 详情数据
const productData = ref<Product>() // 产品数据
const deleting = ref(false) // 删除状态
const authVisible = ref(false) // 认证信息弹窗
const authLoading = ref(false) // 认证信息加载状态
const authInfo = ref<IotDeviceAuthInfo>() // 认证信息
const isGateway = computed(() => formData.value?.deviceType === DeviceTypeEnum.GATEWAY) // 是否网关设备
const isModbusProduct = computed(() => { // 是否 Modbus 产品
  return [ProtocolTypeEnum.MODBUS_TCP_CLIENT, ProtocolTypeEnum.MODBUS_TCP_SERVER].includes(productData.value?.protocolType as ProtocolTypeEnum)
})

/** 返回上一页 */
function handleBack() { navigateBackPlus('/pages-iot/device/device/index') }

/** 加载设备详情 */
async function getDetail() {
  if (!props.id || deleting.value)
    return
  formData.value = await getDevice(Number(props.id))
  if (formData.value.productId) {
    productData.value = await getProduct(Number(formData.value.productId))
  }
}

/** 编辑设备 */
function handleEdit() { uni.navigateTo({ url: `/pages-iot/device/device/form/index?id=${props.id}` }) }

/** 查看认证信息 */
async function handleAuthInfo() {
  if (!props.id)
    return
  authLoading.value = true
  try {
    authInfo.value = await getDeviceAuthInfo(Number(props.id))
    authVisible.value = true
  } finally {
    authLoading.value = false
  }
}

/** 查看物模型数据 */
function handleThingModel() {
  uni.navigateTo({ url: `/pages-iot/device/device/property/index?deviceId=${props.id}` })
}

/** 查看设备消息 */
function handleMessage() {
  uni.navigateTo({ url: `/pages-iot/device/device/message/index?deviceId=${props.id}` })
}

/** 模拟设备 */
function handleSimulator() {
  uni.navigateTo({ url: `/pages-iot/device/device/simulator/index?deviceId=${props.id}` })
}

/** 查看设备配置 */
function handleConfig() {
  uni.navigateTo({ url: `/pages-iot/device/device/config/index?deviceId=${props.id}` })
}

/** 查看子设备 */
function handleSubDevice() {
  uni.navigateTo({ url: `/pages-iot/device/device/sub-device/index?gatewayId=${props.id}` })
}

/** 查看 Modbus 配置 */
function handleModbus() {
  uni.navigateTo({ url: `/pages-iot/device/device/modbus/index?deviceId=${props.id}` })
}

/** 删除设备 */
async function handleDelete() {
  if (!props.id)
    return
  try { await dialog.confirm({ title: '提示', msg: '确定要删除该设备吗？' }) } catch { return }
  deleting.value = true
  try {
    await deleteDevice(Number(props.id))
    toast.success('删除成功')
    uni.$emit('iot:device:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onShow(() => { getDetail() })
</script>
