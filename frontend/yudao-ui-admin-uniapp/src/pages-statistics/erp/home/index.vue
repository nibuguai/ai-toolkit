<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="ERP 管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx space-y-24rpx">
        <!-- 经营总览 -->
        <view v-if="quickActions.length > 0" class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
            <view>
              <view class="text-30rpx text-[#333] font-semibold">
                经营总览
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                销售额 - 采购额，用于快速观察经营净额
              </view>
            </view>
            <wd-button size="small" type="primary" :loading="loading" @click="reloadStatistics">
              刷新
            </wd-button>
          </view>
          <view v-if="loading && !loaded" class="py-48rpx text-center text-26rpx text-[#999]">
            <wd-loading size="32rpx" />
            <view class="mt-12rpx">
              正在加载经营数据
            </view>
          </view>
          <view v-else class="grid grid-cols-2 gap-16rpx p-24rpx">
            <view v-for="card in overviewCards" :key="card.label" class="rounded-12rpx p-20rpx" :class="card.highlight ? 'bg-[#ecf5ff]' : 'bg-[#f8fafc]'">
              <view class="text-24rpx text-[#999]">
                {{ card.label }}
              </view>
              <view class="mt-8rpx text-34rpx font-semibold" :class="card.value >= 0 ? 'text-[#1677ff]' : 'text-[#f5222d]'">
                ￥{{ formatPrice(card.value) }}
              </view>
            </view>
          </view>
          <view v-if="loadError" class="border-t border-t-[#f5f5f5] px-24rpx py-16rpx text-24rpx text-[#fa8c16]">
            部分统计数据加载失败，模块入口仍可继续使用
          </view>
        </view>

        <!-- 常用业务入口 -->
        <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
            常用业务
          </view>
          <view class="grid grid-cols-2 gap-16rpx p-24rpx">
            <view
              v-for="action in quickActions"
              :key="action.moduleKey"
              class="rounded-12rpx bg-[#f8fafc] p-20rpx"
              @click="handleModule(action.moduleKey)"
            >
              <view class="mb-16rpx flex items-center gap-12rpx">
                <view class="h-60rpx w-60rpx flex items-center justify-center rounded-full bg-white">
                  <wd-icon :name="action.icon" size="34rpx" :color="action.color" />
                </view>
                <view class="min-w-0 flex-1">
                  <view class="truncate text-28rpx text-[#333] font-semibold">
                    {{ action.title }}
                  </view>
                  <view class="mt-4rpx truncate text-22rpx text-[#999]">
                    {{ action.desc }}
                  </view>
                </view>
              </view>
              <view class="text-22rpx text-[#999]">
                {{ action.tip }}
              </view>
            </view>
          </view>
        </view>

        <!-- 销售概况 -->
        <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
            销售概况
          </view>
          <view class="grid grid-cols-2 gap-16rpx p-24rpx">
            <view v-for="card in saleCards" :key="card.label" class="rounded-12rpx bg-[#f8fafc] p-20rpx">
              <view class="text-24rpx text-[#999]">
                {{ card.label }}
              </view>
              <view class="mt-8rpx text-32rpx text-[#333] font-semibold">
                ￥{{ formatPrice(card.value) }}
              </view>
            </view>
          </view>
        </view>

        <!-- 销售趋势 -->
        <TimeSummaryChart title="销售趋势" :value="saleTimeSummaryList" color="#1677ff" />

        <!-- 采购概况 -->
        <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
            采购概况
          </view>
          <view class="grid grid-cols-2 gap-16rpx p-24rpx">
            <view v-for="card in purchaseCards" :key="card.label" class="rounded-12rpx bg-[#f8fafc] p-20rpx">
              <view class="text-24rpx text-[#999]">
                {{ card.label }}
              </view>
              <view class="mt-8rpx text-32rpx text-[#333] font-semibold">
                ￥{{ formatPrice(card.value) }}
              </view>
            </view>
          </view>
        </view>

        <!-- 采购趋势 -->
        <TimeSummaryChart title="采购趋势" :value="purchaseTimeSummaryList" color="#fa8c16" />

        <!-- 菜单分组 -->
        <view v-for="group in accessibleGroups" :key="group.key" class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
            {{ group.name }}
          </view>
          <view class="grid grid-cols-3">
            <view
              v-for="module in group.modules"
              :key="module.key"
              class="min-h-168rpx flex flex-col items-center justify-center border-b border-r border-[#f5f5f5] px-12rpx py-24rpx"
              @click="handleModule(module.key)"
            >
              <view class="h-72rpx w-72rpx flex items-center justify-center rounded-full bg-[#f5f7fa]">
                <wd-icon :name="module.icon" size="40rpx" :color="module.iconColor" />
              </view>
              <view class="mt-14rpx text-center text-26rpx text-[#333] leading-34rpx">
                {{ module.title }}
              </view>
            </view>
          </view>
        </view>

        <view v-if="accessibleGroups.length === 0" class="rounded-12rpx bg-white px-24rpx py-64rpx text-center text-26rpx text-[#999] shadow-sm">
          暂无可访问的 ERP 模块
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="h-40rpx" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { ErpPurchaseSummaryResp, ErpPurchaseTimeSummaryResp } from '@/api/erp/statistics/purchase'
import type { ErpSaleSummaryResp, ErpSaleTimeSummaryResp } from '@/api/erp/statistics/sale'
import { computed, onMounted, ref } from 'vue'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { erpGroups, erpStatistics, getErpGroupModules, getErpModule } from './modules'
import TimeSummaryChart from '@/pages-statistics/components/time-summary-chart.vue'
import { toNumber } from '@/pages-erp/utils/erp'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const loading = ref(false) // 统计加载状态
const loaded = ref(false) // 是否已完成首次加载
const loadError = ref(false) // 是否存在统计加载失败
const saleSummary = ref<Partial<ErpSaleSummaryResp>>({}) // 销售概况统计
const purchaseSummary = ref<Partial<ErpPurchaseSummaryResp>>({}) // 采购概况统计
const saleTimeSummaryList = ref<ErpSaleTimeSummaryResp[]>([]) // 销售时段统计
const purchaseTimeSummaryList = ref<ErpPurchaseTimeSummaryResp[]>([]) // 采购时段统计

const quickActionOptions = [
  { moduleKey: 'sale-order', title: '销售开单', desc: '销售订单', tip: '客户下单、价格与明细', icon: 'cart', color: '#52c41a' },
  { moduleKey: 'sale-out', title: '销售出库', desc: '销售出库单', tip: '从订单生成出库与应收', icon: 'upload', color: '#73d13d' },
  { moduleKey: 'purchase-order', title: '采购下单', desc: '采购订单', tip: '供应商采购与明细', icon: 'order', color: '#fa8c16' },
  { moduleKey: 'purchase-in', title: '采购入库', desc: '采购入库单', tip: '从订单生成入库与应付', icon: 'download', color: '#faad14' },
  { moduleKey: 'stock', title: '产品库存', desc: '库存查询', tip: '按产品、仓库查看余量', icon: 'chart-pie', color: '#722ed1' },
  { moduleKey: 'finance-receipt', title: '收款登记', desc: '收款单', tip: '销售收款与退款联动', icon: 'money-circle', color: '#ff85c0' },
] as const

const quickActions = computed(() => quickActionOptions.filter((action) => {
  const moduleConfig = getErpModule(action.moduleKey)
  return moduleConfig ? hasAccessByCodes([`${moduleConfig.permission}:query`]) : false
}))

const accessibleGroups = computed(() => erpGroups.map((group) => {
  return {
    ...group,
    modules: getErpGroupModules(group.key).filter(module => hasAccessByCodes([`${module.permission}:query`])),
  }
}).filter(group => group.modules.length > 0))

/** 销售概况卡片 */
const saleCards = computed(() => [
  { label: '今日销售', value: saleSummary.value.todayPrice },
  { label: '昨日销售', value: saleSummary.value.yesterdayPrice },
  { label: '本月销售', value: saleSummary.value.monthPrice },
  { label: '今年销售', value: saleSummary.value.yearPrice },
])

/** 采购概况卡片 */
const purchaseCards = computed(() => [
  { label: '今日采购', value: purchaseSummary.value.todayPrice },
  { label: '昨日采购', value: purchaseSummary.value.yesterdayPrice },
  { label: '本月采购', value: purchaseSummary.value.monthPrice },
  { label: '今年采购', value: purchaseSummary.value.yearPrice },
])

/** 经营总览卡片 */
const overviewCards = computed(() => [
  { label: '今日净额', value: toNumber(saleSummary.value.todayPrice) - toNumber(purchaseSummary.value.todayPrice), highlight: true },
  { label: '昨日净额', value: toNumber(saleSummary.value.yesterdayPrice) - toNumber(purchaseSummary.value.yesterdayPrice), highlight: false },
  { label: '本月净额', value: toNumber(saleSummary.value.monthPrice) - toNumber(purchaseSummary.value.monthPrice), highlight: true },
  { label: '今年净额', value: toNumber(saleSummary.value.yearPrice) - toNumber(purchaseSummary.value.yearPrice), highlight: false },
])

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 格式化金额 */
function formatPrice(value?: number) {
  return toNumber(value).toFixed(2)
}

/** 打开模块 */
function handleModule(moduleKey: string) {
  const moduleConfig = getErpModule(moduleKey)
  if (moduleConfig?.route) {
    uni.navigateTo({ url: moduleConfig.route })
  }
}

/** 加载销售统计 */
async function loadSaleSummary() {
  const [summary, timeSummary] = await Promise.all([
    erpStatistics.getSaleSummary(),
    erpStatistics.getSaleTimeSummary(),
  ])
  saleSummary.value = summary || {}
  saleTimeSummaryList.value = timeSummary || []
}

/** 加载采购统计 */
async function loadPurchaseSummary() {
  const [summary, timeSummary] = await Promise.all([
    erpStatistics.getPurchaseSummary(),
    erpStatistics.getPurchaseTimeSummary(),
  ])
  purchaseSummary.value = summary || {}
  purchaseTimeSummaryList.value = timeSummary || []
}

/** 刷新统计 */
async function reloadStatistics() {
  if (loading.value) {
    return
  }
  loading.value = true
  loadError.value = false
  try {
    await Promise.all([
      loadSaleSummary(),
      loadPurchaseSummary(),
    ])
  } catch {
    loadError.value = true
  } finally {
    loaded.value = true
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  reloadStatistics()
})
</script>
