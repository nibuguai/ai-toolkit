<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="生产排产" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm ref="searchFormRef" @search="handleQuery" @reset="handleReset" />

    <!-- 甘特摘要 -->
    <view class="bg-white px-24rpx py-18rpx">
      <view class="mb-12rpx flex items-center justify-between">
        <view class="text-28rpx text-[#333] font-semibold">
          排产甘特摘要
        </view>
        <view class="text-24rpx text-[#1677ff]" @click="handleGanttEdit">
          列表式编辑
        </view>
      </view>
      <scroll-view scroll-x class="whitespace-nowrap">
        <view v-if="ganttTasks.length === 0" class="rounded-8rpx bg-[#f7f8fa] px-20rpx py-18rpx text-24rpx text-[#999]">
          暂无甘特任务
        </view>
        <view
          v-for="item in ganttTasks"
          :key="item.id"
          class="mr-16rpx inline-block min-w-320rpx rounded-10rpx bg-[#f7faff] p-18rpx align-top"
        >
          <view class="mb-8rpx flex items-center gap-8rpx">
            <view class="h-20rpx w-20rpx rounded-full" :style="{ backgroundColor: item.colorCode || item.color || '#1677ff' }" />
            <view class="max-w-260rpx truncate text-26rpx text-[#333] font-semibold">
              {{ item.text || '-' }}
            </view>
          </view>
          <view class="text-22rpx text-[#666]">
            {{ formatDate(item.startDate) || '-' }} 至 {{ formatDate(item.endDate) || '-' }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 待排产工单列表 -->
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无待排产工单" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in flatList" :key="item.id" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="p-24rpx" @click="handleDetail(item)">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  <text v-if="item.level > 0" class="mr-8rpx text-24rpx text-[#999]">子工单</text>{{ item.name || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.code || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="item.status" />
            </view>
            <view class="mb-14rpx flex flex-wrap gap-10rpx">
              <dict-tag v-if="item.orderSourceType != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE" :value="item.orderSourceType" />
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_TYPE" :value="item.type" />
              <wd-tag v-if="item.parentCode" type="default" plain>
                父工单 {{ item.parentCode }}
              </wd-tag>
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>产品：{{ item.productCode || '-' }} / {{ item.productName || '-' }}</view>
              <view>规格：{{ item.productSpecification || '-' }} / 单位：{{ item.unitMeasureName || '-' }}</view>
              <view>数量：{{ item.quantity ?? '-' }}，已排产：{{ item.quantityScheduled ?? 0 }}，已生产：{{ item.quantityProduced ?? 0 }}</view>
              <view v-if="item.clientName">
                客户：{{ item.clientCode || '-' }} / {{ item.clientName }}
              </view>
              <view>需求日期：{{ formatDate(item.requestDate) || '-' }}</view>
            </view>
          </view>
          <view class="flex border-t border-[#f3f4f6] text-26rpx">
            <view v-if="hasAccessByCodes(['mes:pro-task:create']) && item.status === MesProWorkOrderStatusEnum.CONFIRMED" class="flex-1 py-18rpx text-center text-[#1677ff]" @click="handleSchedule(item)">
              排产
            </view>
            <view class="flex-1 py-18rpx text-center text-[#666]" @click="handleDetail(item)">
              详情
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { ProTaskGanttVO } from '@/api/mes/pro/task'
import type { ProWorkOrderQueryParams, ProWorkOrderVO } from '@/api/mes/pro/workorder'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getGanttTaskList } from '@/api/mes/pro/task'
import { getWorkOrderPage } from '@/api/mes/pro/workorder'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import SearchForm from './components/search-form.vue'

interface FlatWorkOrder extends ProWorkOrderVO {
  level: number
}

const MesProWorkOrderStatusEnum = {
  CONFIRMED: 1,
} as const
const MesProWorkOrderTypeEnum = {
  SELF: 1,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<ProWorkOrderVO[]>([]) // 待排产工单树
const pagingRef = ref<ZPagingRef<ProWorkOrderVO>>()
const queryParams = ref<Partial<ProWorkOrderQueryParams>>({})
const searchFormRef = ref<InstanceType<typeof SearchForm>>()
const ganttTasks = ref<ProTaskGanttVO[]>([]) // 甘特摘要数据
const flatList = computed<FlatWorkOrder[]>(() => flattenWorkOrders(list.value))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 展平父子工单 */
function flattenWorkOrders(rows: ProWorkOrderVO[], level = 0): FlatWorkOrder[] {
  return rows.flatMap((item) => {
    const current = { ...item, level }
    const children = item.children?.length ? flattenWorkOrders(item.children, level + 1) : []
    return [current, ...children]
  })
}

/** 构造父子树 */
function buildWorkOrderTree(rows: ProWorkOrderVO[]) {
  const map = new Map<number, ProWorkOrderVO>()
  const roots: ProWorkOrderVO[] = []
  rows.forEach((row) => {
    map.set(row.id, { ...row, children: [] })
  })
  map.forEach((row) => {
    if (row.parentId && map.has(row.parentId)) {
      map.get(row.parentId)?.children?.push(row)
    } else {
      roots.push(row)
    }
  })
  return roots
}

/** 合并 PC 固定排产筛选 */
function buildQuery(pageNo?: number, pageSize?: number): ProWorkOrderQueryParams {
  return {
    ...queryParams.value,
    pageNo: pageNo || 1,
    pageSize: pageSize || 10,
    status: MesProWorkOrderStatusEnum.CONFIRMED,
    type: MesProWorkOrderTypeEnum.SELF,
  }
}

/** 查询待排产工单 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWorkOrderPage(buildQuery(pageNo, pageSize))
    list.value = buildWorkOrderTree(data.list)
    pagingRef.value?.completeByTotal(list.value, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 加载甘特摘要 */
async function loadGanttPreview() {
  ganttTasks.value = await getGanttTaskList(buildQuery())
}

/** 搜索按钮操作 */
function handleQuery(data: Partial<ProWorkOrderQueryParams>) {
  queryParams.value = { ...data }
  reload()
  loadGanttPreview()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {}
  reload()
  loadGanttPreview()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 打开排产页 */
function handleSchedule(item: ProWorkOrderVO) {
  uni.navigateTo({ url: `/pages-mes/pro/task/detail/index?id=${item.id}&mode=schedule` })
}

/** 打开排产详情 */
function handleDetail(item: ProWorkOrderVO) {
  uni.navigateTo({ url: `/pages-mes/pro/task/detail/index?id=${item.id}&mode=detail` })
}

/** 打开列表式甘特编辑 */
function handleGanttEdit() {
  uni.navigateTo({ url: '/pages-mes/pro/task/edit/index' })
}

onMounted(() => {
  uni.$on('mes:pro:task:reload', reload)
  loadGanttPreview()
})

onUnload(() => {
  uni.$off('mes:pro:task:reload', reload)
})
</script>
