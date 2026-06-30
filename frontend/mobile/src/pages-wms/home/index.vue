<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="WMS 工作台"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 筛选区域 -->
    <view class="mx-24rpx mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
      <wd-cell-group border>
        <WarehousePicker
          v-model="queryParams.warehouseId"
          label="仓库筛选"
          placeholder="全部仓库"
          @change="loadStatistics"
        />
      </wd-cell-group>
    </view>

    <!-- 库存汇总 -->
    <view class="mx-24rpx mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-30rpx text-[#333] font-semibold">库存汇总</text>
        <wd-loading v-if="loading" size="32rpx" />
      </view>
      <view class="text-56rpx text-[#1890ff] font-semibold">
        {{ formatQuantity(inventorySummary?.totalQuantity) || '0.00' }}
      </view>
      <view class="mt-8rpx text-24rpx text-[#999]">
        当前库存总量
      </view>
    </view>

    <!-- 单据汇总 -->
    <view class="mx-24rpx mb-24rpx">
      <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
        单据汇总
      </view>
      <view class="grid grid-cols-2 gap-16rpx">
        <view
          v-for="item in orderSummary"
          :key="item.type"
          class="rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleOrderSummaryClick(item.type)"
        >
          <view class="mb-12rpx text-26rpx text-[#666]">
            {{ getOrderTypeName(item.type) }}
          </view>
          <view class="mb-16rpx text-42rpx text-[#333] font-semibold">
            {{ item.total || 0 }}
          </view>
          <view
            v-for="status in item.statuses"
            :key="status.status"
            class="mb-8rpx flex items-center justify-between text-24rpx text-[#999]"
          >
            <text>{{ getOrderStatusName(status.status) }}</text>
            <text>{{ status.count }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 单据趋势 -->
    <view class="mx-24rpx mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
        近 7 天趋势
      </view>
      <view v-for="item in orderTrend" :key="item.time" class="mb-18rpx">
        <view class="mb-8rpx flex items-center justify-between text-24rpx text-[#666]">
          <text>{{ item.time }}</text>
          <text>{{ getTrendTotal(item) }}</text>
        </view>
        <view class="h-16rpx overflow-hidden rounded-8rpx bg-[#f2f3f5]">
          <view
            class="h-full rounded-8rpx bg-[#1890ff]"
            :style="{ width: `${getTrendPercent(item)}%` }"
          />
        </view>
      </view>
      <view v-if="orderTrend.length === 0" class="py-32rpx text-center text-26rpx text-[#999]">
        暂无趋势数据
      </view>
    </view>

    <!-- 库存排行 -->
    <view class="mx-24rpx mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
        商品库存排行
      </view>
      <view v-for="item in goodsRank" :key="item.id" class="mb-18rpx">
        <view class="mb-8rpx flex items-center justify-between text-24rpx text-[#666]">
          <text class="line-clamp-1">{{ item.name }}</text>
          <text>{{ formatQuantity(item.quantity) || '0.00' }}</text>
        </view>
        <view class="h-16rpx overflow-hidden rounded-8rpx bg-[#f2f3f5]">
          <view
            class="h-full rounded-8rpx bg-[#52c41a]"
            :style="{ width: `${getRankPercent(item.quantity, goodsRankMax)}%` }"
          />
        </view>
      </view>
      <view v-if="goodsRank.length === 0" class="py-32rpx text-center text-26rpx text-[#999]">
        暂无商品库存数据
      </view>
    </view>

    <!-- 仓库排行 -->
    <view class="mx-24rpx mb-32rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
        仓库库存排行
      </view>
      <view v-for="item in warehouseRank" :key="item.id" class="mb-18rpx">
        <view class="mb-8rpx flex items-center justify-between text-24rpx text-[#666]">
          <text class="line-clamp-1">{{ item.name }}</text>
          <text>{{ formatQuantity(item.quantity) || '0.00' }}</text>
        </view>
        <view class="h-16rpx overflow-hidden rounded-8rpx bg-[#f2f3f5]">
          <view
            class="h-full rounded-8rpx bg-[#faad14]"
            :style="{ width: `${getRankPercent(item.quantity, warehouseRankMax)}%` }"
          />
        </view>
      </view>
      <view v-if="warehouseRank.length === 0" class="py-32rpx text-center text-26rpx text-[#999]">
        暂无仓库库存数据
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmsHomeInventorySummary, WmsHomeOrderSummary, WmsHomeOrderTrend } from '@/api/wms/home'
import { computed, onMounted, reactive, ref } from 'vue'
import { getWmsHomeInventorySummary, getWmsHomeOrderSummary, getWmsHomeOrderTrend } from '@/api/wms/home'
import WarehousePicker from '@/pages-wms/components/warehouse-picker.vue'
import { WmsOrderTypeEnum } from '@/pages-wms/utils/constants'
import { formatQuantity } from '@/pages-wms/utils/format'
import { getDictLabel } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const loading = ref(false) // 统计加载状态
const queryParams = reactive({
  warehouseId: undefined as number | undefined,
  goodsLimit: 5,
  warehouseLimit: 5,
}) // 查询参数
const orderSummary = ref<WmsHomeOrderSummary[]>([]) // 单据汇总
const orderTrend = ref<WmsHomeOrderTrend[]>([]) // 单据趋势
const inventorySummary = ref<WmsHomeInventorySummary>() // 库存汇总

const goodsRank = computed(() => inventorySummary.value?.goodsShareList || [])
const warehouseRank = computed(() => inventorySummary.value?.warehouseDistributionList || [])
const goodsRankMax = computed(() => Math.max(...goodsRank.value.map(item => Number(item.quantity || 0)), 0))
const warehouseRankMax = computed(() => Math.max(...warehouseRank.value.map(item => Number(item.quantity || 0)), 0))
const trendMax = computed(() => Math.max(...orderTrend.value.map(item => getTrendTotal(item)), 0))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载统计数据 */
async function loadStatistics() {
  loading.value = true
  try {
    const params = {
      warehouseId: queryParams.warehouseId,
      goodsLimit: queryParams.goodsLimit,
      warehouseLimit: queryParams.warehouseLimit,
    }
    const [summary, trend, inventory] = await Promise.all([
      getWmsHomeOrderSummary(params),
      getWmsHomeOrderTrend(7, params),
      getWmsHomeInventorySummary(params),
    ])
    orderSummary.value = summary
    orderTrend.value = trend
    inventorySummary.value = inventory
  } finally {
    loading.value = false
  }
}

/** 获取单据类型名称 */
function getOrderTypeName(type: number) {
  const label = getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, type)
  if (label) {
    return label.replace(/单$/, '')
  }
  const fallbackMap: Record<number, string> = {
    [WmsOrderTypeEnum.RECEIPT]: '入库',
    [WmsOrderTypeEnum.SHIPMENT]: '出库',
    [WmsOrderTypeEnum.MOVEMENT]: '移库',
    [WmsOrderTypeEnum.CHECK]: '盘库',
  }
  return fallbackMap[type] || '单据'
}

/** 获取单据状态名称 */
function getOrderStatusName(status: number) {
  return getDictLabel(DICT_TYPE.WMS_ORDER_STATUS, status) || `状态 ${status}`
}

/** 获取趋势总数 */
function getTrendTotal(item: WmsHomeOrderTrend) {
  return Number(item.receiptCount || 0)
    + Number(item.shipmentCount || 0)
    + Number(item.movementCount || 0)
    + Number(item.checkCount || 0)
}

/** 获取趋势占比 */
function getTrendPercent(item: WmsHomeOrderTrend) {
  if (!trendMax.value) {
    return 0
  }
  return Math.max(4, Math.round((getTrendTotal(item) / trendMax.value) * 100))
}

/** 获取排行占比 */
function getRankPercent(quantity: number, max: number) {
  if (!max) {
    return 0
  }
  return Math.max(4, Math.round((Number(quantity || 0) / max) * 100))
}

/** 跳转单据列表 */
function handleOrderSummaryClick(type: number) {
  const routeMap: Record<number, string> = {
    [WmsOrderTypeEnum.RECEIPT]: '/pages-wms/order/receipt/index',
    [WmsOrderTypeEnum.SHIPMENT]: '/pages-wms/order/shipment/index',
    [WmsOrderTypeEnum.MOVEMENT]: '/pages-wms/order/movement/index',
    [WmsOrderTypeEnum.CHECK]: '/pages-wms/order/check/index',
  }
  const url = routeMap[type]
  if (!url) {
    return
  }
  uni.navigateTo({ url })
}

/** 初始化 */
onMounted(() => {
  loadStatistics()
})
</script>
