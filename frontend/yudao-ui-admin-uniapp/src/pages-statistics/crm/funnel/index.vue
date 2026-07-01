<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="销售漏斗"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 统计分类（固定 tab，避免一页过长） -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" @change="handleTabChange">
        <wd-tab v-for="section in sections" :key="section.title" :title="section.title" />
      </wd-tabs>
    </view>

    <!-- 统计概览 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 筛选条件 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-8rpx shadow-sm">
          <wd-form-item title="开始日期" title-width="160rpx" is-link :value="formatDate(filters.startTime)" placeholder="请选择开始日期" @click="startVisible = true" />
          <wd-datetime-picker v-model="filters.startTime" v-model:visible="startVisible" title="请选择开始日期" type="date" @confirm="loadData" />
          <wd-form-item title="结束日期" title-width="160rpx" is-link :value="formatDate(filters.endTime)" placeholder="请选择结束日期" @click="endVisible = true" />
          <wd-datetime-picker v-model="filters.endTime" v-model:visible="endVisible" title="请选择结束日期" type="date" @confirm="loadData" />
          <wd-form-item title="时间间隔" title-width="160rpx" is-link :value="intervalLabel" placeholder="请选择时间间隔" @click="intervalVisible = true" />
          <wd-picker v-model:visible="intervalVisible" :model-value="filters.interval" title="请选择时间间隔" :columns="intervalColumns" @confirm="handleIntervalConfirm" />
          <yd-tree-select
            v-model="filters.deptId"
            label="归属部门"
            label-width="160rpx"
            filterable
            :data="deptTree"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择归属部门"
            @change="handleDeptChange"
          />
          <UserPicker
            ref="userPickerRef"
            v-model="filters.userId"
            type="radio"
            label="员工"
            label-width="160rpx"
            placeholder="请选择员工"
            @confirm="loadData"
          />
        </view>

        <!-- 统计周期与刷新 -->
        <view class="mb-24rpx flex items-center justify-between">
          <view class="text-26rpx text-[#999]">
            {{ periodText }}
          </view>
          <wd-button size="small" type="primary" variant="plain" :loading="!!loadingMap[activeSection.title]" @click="loadData">
            刷新
          </wd-button>
        </view>

        <!-- 统计列表（当前分类） -->
        <StatisticsCard :section="activeSection" :rows="sectionData[activeSection.title] || []" />
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { Dept } from '@/api/system/dept'
import type { StatisticsSection } from '@/pages-statistics/utils/statistics'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  getBusinessInversionRateSummaryByDate,
  getBusinessPageByDate,
  getBusinessSummaryByDate,
  getBusinessSummaryByEndStatus,
  getFunnelSummary,
} from '@/api/crm/statistics/funnel'
import { getSimpleDeptList } from '@/api/system/dept'
import UserPicker from '@/components/system-select/user-picker.vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import { handleTree } from '@/utils/tree'
import {
  getDefaultDeptId,
  getFirstDeptId,
  normalizeRows,
} from '@/pages-statistics/utils/statistics'
import StatisticsCard from '@/pages-statistics/components/card/statistics-card.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const userStore = useUserStore()
const now = new Date()
const filters = reactive({
  startTime: now.getTime() - 3600 * 1000 * 24 * 30,
  endTime: now.getTime(),
  interval: 2,
  deptId: getDefaultDeptId(userStore.userInfo),
  userId: undefined as number | undefined,
}) // 筛选条件
const loadingMap = ref<Record<string, boolean>>({}) // 各分类加载状态（每个 tab 自己的 loading）
const deptTree = ref<Dept[]>([]) // 部门树形结构
const sectionData = ref<Record<string, any[]>>({}) // 各分类数据缓存（每个 tab 自己的 rows）
const tabIndex = ref(0) // 当前分类下标
const startVisible = ref(false) // 开始日期选择器显隐
const endVisible = ref(false) // 结束日期选择器显隐
const intervalVisible = ref(false) // 时间间隔选择器显隐
const userPickerRef = ref<InstanceType<typeof UserPicker>>() // 员工选择器引用

const intervalColumns = computed(() => // 时间间隔选项
  getIntDictOptions(DICT_TYPE.DATE_INTERVAL).map(dict => ({ value: dict.value, label: dict.label })),
)
const intervalLabel = computed(() => getDictLabel(DICT_TYPE.DATE_INTERVAL, filters.interval)) // 时间间隔展示文案
const queryParams = computed(() => ({
  deptId: filters.deptId,
  interval: filters.interval,
  userId: filters.userId,
  times: formatDateRange([filters.startTime, filters.endTime]),
})) // 查询参数
const periodText = computed(() => {
  const times = queryParams.value.times || []
  return times.length === 2 ? `${formatDate(times[0])} 至 ${formatDate(times[1])}` : '默认统计周期'
})

const sections = [
  {
    title: '销售漏斗',
    columns: [
      { prop: 'customerCount', label: '客户数' },
      { prop: 'businessCount', label: '商机数' },
      { prop: 'businessWinCount', label: '赢单数' },
    ],
    load: getFunnelSummary,
    chart: { type: 'funnel' },
  },
  {
    title: '商机结束状态',
    columns: [
      { prop: 'endStatus', label: '阶段', dictType: DICT_TYPE.CRM_BUSINESS_END_STATUS_TYPE },
      { prop: 'businessCount', label: '商机数' },
      { prop: 'totalPrice', label: '商机金额', type: 'money' },
    ],
    load: getBusinessSummaryByEndStatus,
    chart: { type: 'pie', categoryProp: 'endStatus', valueProp: 'businessCount' },
  },
  {
    title: '新增商机',
    columns: [
      { prop: 'time', label: '时间' },
      { prop: 'businessCreateCount', label: '新增商机' },
      { prop: 'totalPrice', label: '商机金额', type: 'money' },
    ],
    load: getBusinessSummaryByDate,
    chart: {
      type: 'bar',
      categoryProp: 'time',
      series: [
        { name: '新增商机', prop: 'businessCreateCount', type: 'bar' },
        { name: '商机金额', prop: 'totalPrice', type: 'line' },
      ],
      money: true,
    },
  },
  {
    title: '商机转化率',
    columns: [
      { prop: 'time', label: '时间' },
      { prop: 'businessCount', label: '商机数' },
      { prop: 'businessWinCount', label: '赢单数' },
    ],
    load: getBusinessInversionRateSummaryByDate,
    chart: {
      type: 'line',
      categoryProp: 'time',
      series: [
        { name: '商机数', prop: 'businessCount' },
        { name: '赢单数', prop: 'businessWinCount' },
      ],
    },
  },
  {
    title: '商机列表',
    columns: [
      { prop: 'name', label: '商机名称' },
      { prop: 'customerName', label: '客户' },
      { prop: 'totalPrice', label: '商机金额', type: 'money' },
      { prop: 'statusName', label: '阶段' },
    ],
    load: loadBusinessPage,
  },
] as StatisticsSection[] // 统计分组配置
const activeSection = computed(() => sections[tabIndex.value] || sections[0]) // 当前分类

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载商机列表（分页接口，仅取列表数据展示） */
async function loadBusinessPage(params: Record<string, any>) {
  const data = await getBusinessPageByDate({ pageNo: 1, pageSize: 20, ...params })
  return data?.list || []
}

/** 加载当前分类数据：写入各自缓存槽，捕获 section 防止快速切 tab 时旧响应覆盖 */
async function loadActive() {
  const section = activeSection.value
  loadingMap.value[section.title] = true
  try {
    sectionData.value[section.title] = normalizeRows(await section.load?.(queryParams.value))
  } catch {
    sectionData.value[section.title] = []
  } finally {
    loadingMap.value[section.title] = false
  }
}

/** 筛选 / 刷新：清空各分类缓存并重新加载当前分类 */
function loadData() {
  sectionData.value = {}
  loadActive()
}

/** 切换分类：已加载过则直接用缓存，未加载才请求 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  if (sectionData.value[activeSection.value.title] === undefined) {
    loadActive()
  }
}

/** 时间间隔确认 */
function handleIntervalConfirm({ value }: { value: (number | string)[] }) {
  filters.interval = Number(value[0])
  loadData()
}

/** 部门变更 */
function handleDeptChange() {
  filters.userId = undefined
  loadData()
}

/** 初始化 */
onMounted(async () => {
  deptTree.value = handleTree(await getSimpleDeptList())
  if (!filters.deptId) {
    filters.deptId = getFirstDeptId(deptTree.value)
  }
  await loadData()
})
</script>
