<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="IoT 工作台" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 统计卡片 -->
    <view class="grid grid-cols-2 gap-20rpx p-24rpx">
      <view v-for="item in summaryCards" :key="item.label" class="rounded-12rpx bg-white p-24rpx shadow-sm">
        <view class="text-24rpx text-[#999]">{{ item.label }}</view>
        <view class="mt-12rpx text-40rpx text-[#333] font-semibold">{{ item.value }}</view>
        <view class="mt-8rpx text-22rpx text-[#999]">今日新增 {{ item.today }}</view>
      </view>
    </view>

    <!-- 设备状态 -->
    <view class="mx-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-20rpx text-30rpx text-[#333] font-semibold">设备状态</view>
      <view class="grid grid-cols-3 gap-16rpx">
        <view class="rounded-12rpx bg-[#f7f8fa] p-20rpx text-center">
          <view class="text-34rpx text-[#07c160] font-semibold">{{ summary?.deviceOnlineCount || 0 }}</view>
          <view class="mt-8rpx text-22rpx text-[#999]">在线</view>
        </view>
        <view class="rounded-12rpx bg-[#f7f8fa] p-20rpx text-center">
          <view class="text-34rpx text-[#fa5151] font-semibold">{{ summary?.deviceOfflineCount || 0 }}</view>
          <view class="mt-8rpx text-22rpx text-[#999]">离线</view>
        </view>
        <view class="rounded-12rpx bg-[#f7f8fa] p-20rpx text-center">
          <view class="text-34rpx text-[#8c8c8c] font-semibold">{{ summary?.deviceInactiveCount || 0 }}</view>
          <view class="mt-8rpx text-22rpx text-[#999]">未激活</view>
        </view>
      </view>
    </view>

    <!-- 产品分类设备数 -->
    <view class="m-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-20rpx text-30rpx text-[#333] font-semibold">产品分类设备数</view>
      <view v-if="categoryDeviceCounts.length === 0" class="py-40rpx text-center text-26rpx text-[#999]">暂无分类数据</view>
      <view v-for="item in categoryDeviceCounts" :key="item.name" class="mb-16rpx flex items-center justify-between text-28rpx">
        <text class="min-w-0 flex-1 truncate text-[#666]">{{ item.name }}</text>
        <text class="ml-20rpx text-[#333] font-semibold">{{ item.count }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { IotStatisticsSummaryRespVO } from '@/api/iot/statistics'
import { computed, onMounted, ref } from 'vue'
import { getStatisticsSummary } from '@/api/iot/statistics'
import { navigateBackPlus } from '@/utils'

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const summary = ref<IotStatisticsSummaryRespVO>() // 统计数据

const summaryCards = computed(() => [
  { label: '产品分类', value: summary.value?.productCategoryCount || 0, today: summary.value?.productCategoryTodayCount || 0 },
  { label: '产品数量', value: summary.value?.productCount || 0, today: summary.value?.productTodayCount || 0 },
  { label: '设备数量', value: summary.value?.deviceCount || 0, today: summary.value?.deviceTodayCount || 0 },
  { label: '消息数量', value: summary.value?.deviceMessageCount || 0, today: summary.value?.deviceMessageTodayCount || 0 },
])
const categoryDeviceCounts = computed(() => Object.entries(summary.value?.productCategoryDeviceCounts || {}).map(([name, count]) => ({ name, count })))

/** 返回上一页 */
function handleBack() { navigateBackPlus() }

/** 初始化 */
onMounted(async () => {
  summary.value = await getStatisticsSummary()
})
</script>
