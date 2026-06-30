<template>
  <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
    <!-- 标题 -->
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <text class="text-30rpx text-[#333] font-semibold">{{ title }}</text>
      <text v-if="totalText" class="text-24rpx text-[#999]">合计 {{ totalText }}</text>
    </view>

    <!-- 柱状趋势图 -->
    <view v-if="points.length > 0" class="px-12rpx py-24rpx">
      <scroll-view scroll-x class="w-full whitespace-nowrap">
        <view class="inline-flex items-end gap-20rpx px-12rpx" :style="{ height: `${chartHeight}rpx` }">
          <view
            v-for="(point, index) in points"
            :key="index"
            class="flex shrink-0 flex-col items-center justify-end"
            :style="{ height: `${chartHeight}rpx` }"
          >
            <!-- 金额 -->
            <text class="mb-8rpx text-20rpx text-[#999]">{{ point.priceText }}</text>
            <!-- 柱体 -->
            <view
              class="w-40rpx rounded-t-8rpx"
              :style="{ height: `${point.barHeight}rpx`, background: color }"
            />
            <!-- 时间 -->
            <text class="mt-12rpx text-20rpx text-[#999]">{{ point.timeText }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 空状态 -->
    <view v-else class="px-24rpx py-64rpx text-center text-26rpx text-[#999]">
      暂无统计数据
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ErpPurchaseTimeSummaryResp } from '@/api/erp/statistics/purchase'
import type { ErpSaleTimeSummaryResp } from '@/api/erp/statistics/sale'
import { computed } from 'vue'
import { toNumber } from '@/pages-erp/utils/erp'

type TimeSummary = ErpSaleTimeSummaryResp | ErpPurchaseTimeSummaryResp

const props = withDefaults(defineProps<{
  title: string // 标题
  value?: TimeSummary[] // 时段统计数据
  color?: string // 柱体颜色
}>(), {
  value: () => [],
  color: '#1677ff',
})

const chartHeight = 280 // 图表高度（rpx）
const maxBarHeight = 200 // 柱体最大高度（rpx）

/** 格式化金额 */
function formatPrice(value: number) {
  return `￥${value.toFixed(2)}`
}

/** 格式化时间（去除年份，仅展示月日 / 月份） */
function formatTime(time: string) {
  if (!time) {
    return '-'
  }
  const matched = time.match(/(\d{1,2})-(\d{1,2})$/) // 匹配 月-日
  if (matched) {
    return `${matched[1]}-${matched[2]}`
  }
  return time.replace(/^\d{4}-?/, '') || time
}

/** 最大金额（用于柱体高度缩放） */
const maxPrice = computed(() => {
  return props.value.reduce((max, item) => Math.max(max, toNumber(item.price)), 0)
})

/** 合计金额文案 */
const totalText = computed(() => {
  if (props.value.length === 0) {
    return ''
  }
  const total = props.value.reduce((sum, item) => sum + toNumber(item.price), 0)
  return formatPrice(total)
})

/** 柱状图数据点 */
const points = computed(() => {
  const max = maxPrice.value
  return props.value.map((item) => {
    const price = toNumber(item.price)
    const barHeight = max > 0 ? Math.max(6, Math.round((price / max) * maxBarHeight)) : 6
    return {
      timeText: formatTime(item.time),
      priceText: price > 0 ? price.toFixed(0) : '0',
      barHeight,
    }
  })
})
</script>
