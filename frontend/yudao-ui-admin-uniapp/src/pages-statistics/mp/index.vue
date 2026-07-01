<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="公众号统计"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 查询条件 -->
    <view class="bg-white">
      <AccountPicker v-model="accountId" @change="handleAccountChange" />
      <wd-cell
        title="开始日期"
        is-link
        :value="formatDate(dateRange[0])"
        @click="pickerVisible.start = true"
      />
      <wd-datetime-picker
        v-model="dateRange[0]"
        v-model:visible="pickerVisible.start"
        title="请选择开始日期"
        type="date"
        @confirm="getSummary"
      />
      <wd-cell
        title="结束日期"
        is-link
        :value="formatDate(dateRange[1])"
        @click="pickerVisible.end = true"
      />
      <wd-datetime-picker
        v-model="dateRange[1]"
        v-model:visible="pickerVisible.end"
        title="请选择结束日期"
        type="date"
        @confirm="getSummary"
      />
    </view>

    <!-- 统计数据 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <view v-if="loading" class="py-60rpx text-center">
          <wd-loading />
        </view>
        <template v-else>
          <view
            v-for="section in sections"
            :key="section.title"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-20rpx text-32rpx text-[#333] font-semibold">
              {{ section.title }}
            </view>
            <YdChart
              :option="section.chartOption"
              :empty="section.rows.length === 0"
              :height="section.chartHeight"
              class="mb-8rpx"
            />
            <view v-if="section.rows.length === 0" class="py-24rpx text-center text-24rpx text-[#999]">
              暂无数据
            </view>
            <view
              v-for="row in section.rows"
              :key="row.date"
              class="mb-16rpx border-b border-[#f2f2f2] pb-16rpx last:mb-0 last:border-b-0 last:pb-0"
            >
              <view class="mb-8rpx text-26rpx text-[#999]">
                {{ row.date }}
              </view>
              <view class="grid grid-cols-2 gap-12rpx">
                <view
                  v-for="metric in row.metrics"
                  :key="metric.label"
                  class="rounded-8rpx bg-[#f8f8f8] p-16rpx"
                >
                  <view class="text-22rpx text-[#999]">
                    {{ metric.label }}
                  </view>
                  <view class="mt-8rpx text-30rpx text-[#333] font-semibold">
                    {{ metric.value ?? 0 }}
                  </view>
                </view>
              </view>
            </view>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { computed, reactive, ref } from 'vue'
import {
  getInterfaceSummary,
  getUpstreamMessage,
  getUserCumulate,
  getUserSummary,
} from '@/api/mp/statistics'
import { navigateBackPlus } from '@/utils'
import { formatDate, formatDateTime } from '@/utils/date'
import AccountPicker from '@/pages-mp/account/components/account-picker.vue'
import YdChart from '../components/yd-chart/yd-chart.vue'

const CHART_COLORS = ['#67C23A', '#E5323E', '#E6A23C', '#409EFF'] // 图表配色

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const accountId = ref<number>() // 当前公众号编号
const loading = ref(false) // 加载状态
const pickerVisible = reactive({
  start: false,
  end: false,
}) // 日期选择器状态
const dateRange = ref<[number, number]>([
  dayjs().subtract(7, 'day').startOf('day').valueOf(),
  dayjs().subtract(1, 'day').endOf('day').valueOf(),
]) // 查询日期范围
const userSummaryList = ref<any[]>([]) // 用户增减数据
const userCumulateList = ref<any[]>([]) // 累计用户数据
const upstreamMessageList = ref<any[]>([]) // 消息概况数据
const interfaceSummaryList = ref<any[]>([]) // 接口分析数据

/** 统一坐标轴样式（窄屏小字号 + 隐藏轴刻度） */
function axisLabelStyle() {
  return { color: '#999', fontSize: 10 }
}

const userSummaryOption = computed(() => { // 用户增减：新增用户 / 取消关注 双柱
  const list = userSummaryList.value
  return {
    color: [CHART_COLORS[0], CHART_COLORS[1]],
    tooltip: { trigger: 'axis', confine: true },
    legend: { top: 0, data: ['新增用户', '取消关注'], textStyle: { color: '#666', fontSize: 11 } },
    grid: { left: 8, right: 12, top: 48, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: list.map(item => formatDate(item.refDate)),
      axisLabel: { ...axisLabelStyle(), rotate: 30 },
      axisTick: { show: false },
    },
    yAxis: { type: 'value', minInterval: 1, axisLabel: axisLabelStyle(), splitLine: { lineStyle: { color: '#f0f0f0' } } },
    series: [
      { name: '新增用户', type: 'bar', barGap: 0, barMaxWidth: 24, data: list.map(item => Number(item.newUser || 0)) },
      { name: '取消关注', type: 'bar', barMaxWidth: 24, data: list.map(item => Number(item.cancelUser || 0)) },
    ],
  }
})

const userCumulateOption = computed(() => { // 累计用户：累计用户量 折线
  const list = userCumulateList.value
  return {
    color: [CHART_COLORS[3]],
    tooltip: { trigger: 'axis', confine: true },
    legend: { top: 0, data: ['累计用户量'], textStyle: { color: '#666', fontSize: 11 } },
    grid: { left: 8, right: 12, top: 48, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: list.map(item => formatDate(item.refDate)),
      axisLabel: { ...axisLabelStyle(), rotate: 30 },
      axisTick: { show: false },
    },
    yAxis: { type: 'value', minInterval: 1, axisLabel: axisLabelStyle(), splitLine: { lineStyle: { color: '#f0f0f0' } } },
    series: [
      { name: '累计用户量', type: 'line', smooth: true, showSymbol: false, areaStyle: { opacity: 0.12 }, data: list.map(item => Number(item.cumulateUser || 0)) },
    ],
  }
})

const upstreamMessageOption = computed(() => { // 消息概况：发送人数 / 发送条数 双折线
  const list = upstreamMessageList.value
  return {
    color: [CHART_COLORS[0], CHART_COLORS[1]],
    tooltip: { trigger: 'axis', confine: true },
    legend: { top: 0, data: ['发送人数', '发送条数'], textStyle: { color: '#666', fontSize: 11 } },
    grid: { left: 8, right: 12, top: 48, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: list.map(item => formatDate(item.refDate)),
      axisLabel: { ...axisLabelStyle(), rotate: 30 },
      axisTick: { show: false },
    },
    yAxis: { type: 'value', minInterval: 1, axisLabel: axisLabelStyle(), splitLine: { lineStyle: { color: '#f0f0f0' } } },
    series: [
      { name: '发送人数', type: 'line', smooth: true, showSymbol: false, data: list.map(item => Number(item.messageUser || 0)) },
      { name: '发送条数', type: 'line', smooth: true, showSymbol: false, data: list.map(item => Number(item.messageCount || 0)) },
    ],
  }
})

const interfaceSummaryOption = computed(() => { // 接口分析：回复 / 失败 / 最大耗时 / 总耗时 四柱
  const list = interfaceSummaryList.value
  return {
    color: CHART_COLORS,
    tooltip: { trigger: 'axis', confine: true },
    legend: {
      top: 0,
      type: 'scroll',
      data: ['回复次数', '失败次数', '最大耗时', '总耗时'],
      textStyle: { color: '#666', fontSize: 10 },
      itemWidth: 14,
      itemGap: 8,
    },
    grid: { left: 8, right: 12, top: 52, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: list.map(item => formatDate(item.refDate)),
      axisLabel: { ...axisLabelStyle(), rotate: 40, interval: 0 },
      axisTick: { show: false },
    },
    yAxis: { type: 'value', axisLabel: axisLabelStyle(), splitLine: { lineStyle: { color: '#f0f0f0' } } },
    series: [
      { name: '回复次数', type: 'bar', barGap: 0, barMaxWidth: 14, data: list.map(item => Number(item.callbackCount || 0)) },
      { name: '失败次数', type: 'bar', barMaxWidth: 14, data: list.map(item => Number(item.failCount || 0)) },
      { name: '最大耗时', type: 'bar', barMaxWidth: 14, data: list.map(item => Number(item.maxTimeCost || 0)) },
      { name: '总耗时', type: 'bar', barMaxWidth: 14, data: list.map(item => Number(item.totalTimeCost || 0)) },
    ],
  }
})

const sections = computed(() => [
  {
    title: '用户增减数据',
    chartOption: userSummaryOption.value,
    chartHeight: '460rpx',
    rows: userSummaryList.value.map(item => ({
      date: formatDate(item.refDate),
      metrics: [
        { label: '新增用户', value: item.newUser },
        { label: '取消关注', value: item.cancelUser },
      ],
    })),
  },
  {
    title: '累计用户数据',
    chartOption: userCumulateOption.value,
    chartHeight: '460rpx',
    rows: userCumulateList.value.map(item => ({
      date: formatDate(item.refDate),
      metrics: [
        { label: '累计用户量', value: item.cumulateUser },
      ],
    })),
  },
  {
    title: '消息概况数据',
    chartOption: upstreamMessageOption.value,
    chartHeight: '460rpx',
    rows: upstreamMessageList.value.map(item => ({
      date: formatDate(item.refDate),
      metrics: [
        { label: '发送人数', value: item.messageUser },
        { label: '发送条数', value: item.messageCount },
      ],
    })),
  },
  {
    title: '接口分析数据',
    chartOption: interfaceSummaryOption.value,
    chartHeight: '520rpx',
    rows: interfaceSummaryList.value.map(item => ({
      date: formatDate(item.refDate),
      metrics: [
        { label: '回复次数', value: item.callbackCount },
        { label: '失败次数', value: item.failCount },
        { label: '最大耗时', value: item.maxTimeCost },
        { label: '总耗时', value: item.totalTimeCost },
      ],
    })),
  },
])

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 公众号切换 */
function handleAccountChange(id: number) {
  accountId.value = id
  getSummary()
}

/** 查询统计数据 */
async function getSummary() {
  if (!accountId.value) {
    return
  }
  const start = dayjs(dateRange.value[0])
  const end = dayjs(dateRange.value[1])
  if (end.diff(start, 'day') >= 7) {
    uni.showToast({ icon: 'none', title: '时间间隔需在 7 天以内' })
    return
  }
  loading.value = true
  try {
    const params = {
      accountId: accountId.value,
      date: [formatDateTime(dateRange.value[0]), formatDateTime(dateRange.value[1])],
    }
    const [userSummary, userCumulate, upstreamMessage, interfaceSummary] = await Promise.all([
      getUserSummary(params),
      getUserCumulate(params),
      getUpstreamMessage(params),
      getInterfaceSummary(params),
    ])
    userSummaryList.value = userSummary
    userCumulateList.value = userCumulate
    upstreamMessageList.value = upstreamMessage
    interfaceSummaryList.value = interfaceSummary
  } finally {
    loading.value = false
  }
}
</script>
