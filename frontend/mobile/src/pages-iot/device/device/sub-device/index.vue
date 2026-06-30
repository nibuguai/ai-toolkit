<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="子设备管理" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 操作栏 -->
    <view class="p-24rpx">
      <wd-button v-if="hasAccessByCodes(['iot:device:update'])" block type="primary" @click="openBindPopup">
        添加子设备
      </wd-button>
    </view>

    <!-- 子设备列表 -->
    <view class="min-h-0 flex-1 overflow-y-auto px-24rpx pb-24rpx">
      <wd-loading v-if="loading" />
      <view v-else-if="list.length === 0" class="py-80rpx text-center text-28rpx text-[#999]">
        暂无子设备
      </view>
      <view v-else>
        <view v-for="item in list" :key="item.id" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm" @click="handleDetail(item)">
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 text-32rpx text-[#333] font-semibold">
              {{ item.deviceName || '-' }}
            </view>
            <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="item.state" />
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">备注名称：</text>{{ item.nickname || '-' }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">所属产品：</text>{{ item.productName || item.productId || '-' }}
          </view>
          <view class="flex items-center justify-between">
            <text class="text-24rpx text-[#999]">{{ formatDateTime(item.onlineTime) || '-' }}</text>
            <wd-button v-if="hasAccessByCodes(['iot:device:update'])" size="small" type="danger" variant="plain" :loading="unbindingId === item.id" @click.stop="handleUnbind(item)">
              解绑
            </wd-button>
          </view>
        </view>
      </view>
    </view>

    <!-- 绑定子设备弹窗 -->
    <wd-popup v-model="bindVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="max-h-[80vh] p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          添加子设备
        </view>
        <view class="mb-24rpx flex gap-16rpx">
          <wd-input v-model="bindKeyword" class="flex-1" placeholder="请输入 DeviceName" clearable />
          <wd-button type="primary" @click="loadBindableList">搜索</wd-button>
        </view>
        <view v-if="bindLoading" class="py-60rpx text-center">
          <wd-loading />
        </view>
        <view v-else-if="bindList.length === 0" class="py-60rpx text-center text-28rpx text-[#999]">
          暂无可绑定子设备
        </view>
        <scroll-view v-else scroll-y class="max-h-[48vh]">
          <view v-for="item in bindList" :key="item.id" class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-16rpx">
            <view class="mb-8rpx text-28rpx text-[#333] font-medium">{{ item.deviceName || '-' }}</view>
            <view class="mb-12rpx text-24rpx text-[#666]">所属产品：{{ item.productName || item.productId || '-' }}</view>
            <wd-button size="small" type="primary" :loading="bindingId === item.id" @click="handleBind(item)">
              绑定
            </wd-button>
          </view>
        </scroll-view>
        <view v-if="bindTotal > bindList.length" class="mt-12rpx text-center text-24rpx text-[#999]">
          仅展示前 {{ bindList.length }} 条，请通过搜索缩小范围
        </view>
        <wd-button class="mt-24rpx" block @click="bindVisible = false">关闭</wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { Device } from '@/api/iot/device/device'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { bindDeviceGateway, getSubDeviceList, getUnboundSubDevicePage, unbindDeviceGateway } from '@/api/iot/device/device'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ gatewayId?: number | any }>()

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const loading = ref(false) // 列表加载状态
const list = ref<Device[]>([]) // 子设备列表
const unbindingId = ref<number>() // 解绑中的设备编号
const bindVisible = ref(false) // 绑定弹窗显示状态
const bindLoading = ref(false) // 绑定列表加载状态
const bindKeyword = ref('') // 绑定搜索关键字
const bindList = ref<Device[]>([]) // 可绑定子设备
const bindTotal = ref(0) // 可绑定总数
const bindingId = ref<number>() // 绑定中的设备编号

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-iot/device/device/detail/index?id=${props.gatewayId}`)
}

/** 查询子设备列表 */
async function getList() {
  if (!props.gatewayId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getSubDeviceList(Number(props.gatewayId))
  } finally {
    loading.value = false
  }
}

/** 查看子设备详情 */
function handleDetail(item: Device) {
  if (!item.id) {
    return
  }
  uni.navigateTo({ url: `/pages-iot/device/device/detail/index?id=${item.id}` })
}

/** 打开绑定弹窗 */
function openBindPopup() {
  bindVisible.value = true
  loadBindableList()
}

/** 查询可绑定子设备 */
async function loadBindableList() {
  bindLoading.value = true
  try {
    const data = await getUnboundSubDevicePage({
      pageNo: 1,
      pageSize: 20,
      deviceName: bindKeyword.value || undefined,
    })
    bindList.value = data.list
    bindTotal.value = data.total
  } finally {
    bindLoading.value = false
  }
}

/** 绑定子设备 */
async function handleBind(item: Device) {
  if (!props.gatewayId || !item.id) {
    return
  }
  bindingId.value = item.id
  try {
    await bindDeviceGateway({ gatewayId: Number(props.gatewayId), subIds: [item.id] })
    toast.success('绑定成功')
    await Promise.all([getList(), loadBindableList()])
  } finally {
    bindingId.value = undefined
  }
}

/** 解绑子设备 */
async function handleUnbind(item: Device) {
  if (!props.gatewayId || !item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要解绑该子设备吗？' })
  } catch {
    return
  }
  unbindingId.value = item.id
  try {
    await unbindDeviceGateway({ gatewayId: Number(props.gatewayId), subIds: [item.id] })
    toast.success('解绑成功')
    await getList()
  } finally {
    unbindingId.value = undefined
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
