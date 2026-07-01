<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 工作台"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <!-- 汇总指标 -->
      <view class="p-24rpx">
        <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
            <view>
              <view class="text-30rpx text-[#333] font-semibold">
                生产总览
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                工单、产量、设备和安灯待办汇总
              </view>
            </view>
            <wd-button size="small" type="primary" :loading="loading" @click="reloadSummary">
              刷新
            </wd-button>
          </view>
          <view v-if="loading && !loaded" class="py-48rpx text-center text-26rpx text-[#999]">
            <wd-loading size="32rpx" />
            <view class="mt-12rpx">
              正在加载生产统计
            </view>
          </view>
          <view v-else class="grid grid-cols-2 gap-20rpx p-24rpx">
            <view v-for="item in kpiItems" :key="item.key" class="rounded-12rpx bg-[#f8fafc] p-24rpx">
              <view class="text-24rpx text-[#8c8c8c]">
                {{ item.label }}
              </view>
              <view class="mt-12rpx text-40rpx text-[#262626] font-semibold">
                {{ item.value }}
              </view>
            </view>
          </view>
          <view v-if="loadError" class="border-t border-t-[#f5f5f5] px-24rpx py-16rpx text-24rpx text-[#fa8c16]">
            统计数据加载失败，已保留默认值，模块入口仍可继续使用
          </view>
        </view>

        <!-- 生产趋势 -->
        <view class="mt-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
            <view>
              <view class="text-30rpx text-[#333] font-semibold">
                生产趋势
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                近 7 天产量、合格品和不良品
              </view>
            </view>
          </view>
          <view v-if="trendPoints.length > 0" class="px-12rpx py-24rpx">
            <scroll-view scroll-x class="w-full whitespace-nowrap">
              <view class="inline-flex items-end gap-20rpx px-12rpx" :style="{ height: `${trendChartHeight}rpx` }">
                <view
                  v-for="point in trendPoints"
                  :key="point.date"
                  class="flex shrink-0 flex-col items-center justify-end"
                  :style="{ height: `${trendChartHeight}rpx` }"
                >
                  <text class="mb-8rpx text-20rpx text-[#999]">{{ point.quantity }}</text>
                  <view class="h-180rpx flex items-end gap-4rpx">
                    <view class="w-18rpx rounded-t-6rpx bg-[#1677ff]" :style="{ height: `${point.quantityHeight}rpx` }" />
                    <view class="w-18rpx rounded-t-6rpx bg-[#52c41a]" :style="{ height: `${point.qualifiedHeight}rpx` }" />
                    <view class="w-18rpx rounded-t-6rpx bg-[#f56c6c]" :style="{ height: `${point.unqualifiedHeight}rpx` }" />
                  </view>
                  <text class="mt-12rpx text-20rpx text-[#999]">{{ point.dateText }}</text>
                </view>
              </view>
            </scroll-view>
            <view class="mt-16rpx flex justify-center gap-24rpx text-22rpx text-[#999]">
              <text>产量</text>
              <text class="text-[#52c41a]">合格品</text>
              <text class="text-[#f56c6c]">不良品</text>
            </view>
          </view>
          <view v-else class="px-24rpx py-48rpx text-center text-26rpx text-[#999]">
            暂无生产趋势数据
          </view>
        </view>

        <!-- 工单状态分布 -->
        <view class="mt-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="border-b border-b-[#f0f0f0] px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
            工单状态分布
          </view>
          <view v-if="workOrderStatusItems.length > 0" class="p-24rpx space-y-20rpx">
            <view v-for="item in workOrderStatusItems" :key="item.status">
              <view class="mb-8rpx flex items-center justify-between text-26rpx">
                <view class="flex items-center gap-10rpx text-[#333]">
                  <view class="h-16rpx w-16rpx rounded-full" :style="{ background: item.color }" />
                  <text>{{ item.statusName }}</text>
                </view>
                <text class="text-[#999]">{{ item.count }} 单 · {{ item.percentText }}</text>
              </view>
              <view class="h-12rpx overflow-hidden rounded-full bg-[#f0f2f5]">
                <view class="h-full rounded-full" :style="{ width: item.percentText, background: item.color }" />
              </view>
            </view>
          </view>
          <view v-else class="px-24rpx py-48rpx text-center text-26rpx text-[#999]">
            暂无工单状态数据
          </view>
        </view>

        <!-- 快捷入口 -->
        <view class="pb-32rpx pt-24rpx">
          <view v-for="group in accessibleMenuGroups" :key="group.key" class="mb-24rpx">
            <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
              {{ group.name }}
            </view>
            <view class="grid grid-cols-3 gap-16rpx">
              <view
                v-for="item in group.items"
                :key="item.rel"
                class="min-h-132rpx flex flex-col items-center justify-center rounded-12rpx bg-white p-16rpx shadow-sm"
                @click="handleNavigate(item.url)"
              >
                <wd-icon :name="item.icon" size="42rpx" :color="item.color" />
                <text class="line-clamp-2 mt-12rpx text-center text-24rpx text-[#333]">
                  {{ item.title }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { MesHomeProductionTrendVO, MesHomeSummaryVO, MesHomeWorkOrderStatusVO } from '@/api/mes/home'
import { computed, onMounted, ref } from 'vue'
import { MesHomeStatisticsApi } from '@/api/mes/home'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const summary = ref<MesHomeSummaryVO>({
  workOrderActiveCount: 0,
  workOrderPrepareCount: 0,
  workOrderFinishedCount: 0,
  todayOutput: 0,
  yesterdayOutput: 0,
  todayQualifiedQuantity: 0,
  todayUnqualifiedQuantity: 0,
  machineryTotal: 0,
  machineryProducing: 0,
  machineryStop: 0,
  machineryMaintenance: 0,
  andonActiveCount: 0,
  repairActiveCount: 0,
}) // 汇总数据
const loading = ref(false) // 汇总加载状态
const loaded = ref(false) // 是否已完成首次加载
const loadError = ref(false) // 汇总加载失败状态
const productionTrend = ref<MesHomeProductionTrendVO[]>([]) // 生产趋势
const workOrderStatus = ref<MesHomeWorkOrderStatusVO[]>([]) // 工单状态分布
const trendChartHeight = 280 // 趋势图高度
const { hasAccessByCodes } = useAccess()

interface MesHomeMenuItem {
  rel: string
  title: string
  url: string
  icon: string
  color: string
  permission?: string
}

interface MesHomeMenuGroup {
  key: string
  name: string
  items: MesHomeMenuItem[]
}

const kpiItems = computed(() => [
  { key: 'active', label: '进行中工单', value: summary.value.workOrderActiveCount },
  { key: 'today', label: '今日产量', value: summary.value.todayOutput },
  { key: 'qualified', label: '今日合格数', value: summary.value.todayQualifiedQuantity },
  { key: 'machinery', label: '设备总数', value: summary.value.machineryTotal },
  { key: 'andon', label: '待处理安灯', value: summary.value.andonActiveCount },
  { key: 'repair', label: '待维修', value: summary.value.repairActiveCount },
])
const trendPoints = computed(() => {
  const maxQuantity = productionTrend.value.reduce((max, item) => {
    return Math.max(max, item.quantity, item.qualifiedQuantity, item.unqualifiedQuantity)
  }, 0)
  return productionTrend.value.map(item => ({
    date: item.date,
    dateText: formatTrendDate(item.date),
    quantity: item.quantity,
    quantityHeight: getTrendBarHeight(item.quantity, maxQuantity),
    qualifiedHeight: getTrendBarHeight(item.qualifiedQuantity, maxQuantity),
    unqualifiedHeight: getTrendBarHeight(item.unqualifiedQuantity, maxQuantity),
  }))
})
const workOrderStatusItems = computed(() => {
  const total = workOrderStatus.value.reduce((sum, item) => sum + item.count, 0)
  return workOrderStatus.value.map(item => ({
    ...item,
    color: getWorkOrderStatusColor(item.status),
    percentText: total > 0 ? `${Math.round((item.count / total) * 100)}%` : '0%',
  }))
})
const menuGroups: MesHomeMenuGroup[] = [
  {
    key: 'md',
    name: '基础数据',
    items: [
      {
        rel: 'md/autocode',
        title: '编码规则',
        url: '/pages-mes/md/autocode/index',
        icon: 'app',
        color: '#1677ff',
        permission: 'mes:auto-code-rule:query',
      },
      {
        rel: 'md/client',
        title: '客户管理',
        url: '/pages-mes/md/client/index',
        icon: 'app',
        color: '#1677ff',
        permission: 'mes:md-client:query',
      },
      {
        rel: 'md/item',
        title: '物料产品',
        url: '/pages-mes/md/item/index',
        icon: 'app',
        color: '#1677ff',
        permission: 'mes:md-item:query',
      },
      {
        rel: 'md/item/type',
        title: '物料分类',
        url: '/pages-mes/md/item/type/index',
        icon: 'app',
        color: '#1677ff',
        permission: 'mes:md-item-type:query',
      },
      {
        rel: 'md/unitmeasure',
        title: '计量单位',
        url: '/pages-mes/md/unitmeasure/index',
        icon: 'app',
        color: '#1677ff',
        permission: 'mes:md-unit-measure:query',
      },
      {
        rel: 'md/vendor',
        title: '供应商管理',
        url: '/pages-mes/md/vendor/index',
        icon: 'app',
        color: '#1677ff',
        permission: 'mes:md-vendor:query',
      },
      {
        rel: 'md/workstation',
        title: '工作站',
        url: '/pages-mes/md/workstation/index',
        icon: 'app',
        color: '#1677ff',
        permission: 'mes:md-workstation:query',
      },
      {
        rel: 'md/workstation/workshop',
        title: '车间管理',
        url: '/pages-mes/md/workstation/workshop/index',
        icon: 'app',
        color: '#1677ff',
        permission: 'mes:md-workshop:query',
      },
    ],
  },
  {
    key: 'pro',
    name: '生产管理',
    items: [
      {
        rel: 'pro/andon/record',
        title: '安灯记录',
        url: '/pages-mes/pro/andon/record/index',
        icon: 'setting',
        color: '#52c41a',
        permission: 'mes:pro-andon-record:query',
      },
      {
        rel: 'pro/andon/config',
        title: '安灯配置',
        url: '/pages-mes/pro/andon/config/index',
        icon: 'setting',
        color: '#52c41a',
        permission: 'mes:pro-andon-config:query',
      },
      {
        rel: 'pro/card',
        title: '流转卡',
        url: '/pages-mes/pro/card/index',
        icon: 'setting',
        color: '#52c41a',
        permission: 'mes:pro-card:query',
      },
      {
        rel: 'pro/feedback',
        title: '生产报工',
        url: '/pages-mes/pro/feedback/index',
        icon: 'setting',
        color: '#52c41a',
        permission: 'mes:pro-feedback:query',
      },
      {
        rel: 'pro/process',
        title: '生产工序',
        url: '/pages-mes/pro/process/index',
        icon: 'setting',
        color: '#52c41a',
        permission: 'mes:pro-process:query',
      },
      {
        rel: 'pro/route',
        title: '工艺路线',
        url: '/pages-mes/pro/route/index',
        icon: 'setting',
        color: '#52c41a',
        permission: 'mes:pro-route:query',
      },
      {
        rel: 'pro/task',
        title: '生产排产',
        url: '/pages-mes/pro/task/index',
        icon: 'setting',
        color: '#52c41a',
        permission: 'mes:pro-task:query',
      },
      {
        rel: 'pro/workorder',
        title: '生产工单',
        url: '/pages-mes/pro/workorder/index',
        icon: 'setting',
        color: '#52c41a',
        permission: 'mes:pro-work-order:query',
      },
      {
        rel: 'pro/workrecord',
        title: '工作记录',
        url: '/pages-mes/pro/workrecord/index',
        icon: 'setting',
        color: '#52c41a',
        permission: 'mes:pro-workrecord:query',
      },
    ],
  },
  {
    key: 'wm',
    name: '仓储管理',
    items: [
      {
        rel: 'wm/arrivalnotice',
        title: '到货通知',
        url: '/pages-mes/wm/arrivalnotice/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-arrival-notice:query',
      },
      {
        rel: 'wm/barcode/config',
        title: '条码配置',
        url: '/pages-mes/wm/barcode/config/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-barcode-config:query',
      },
      {
        rel: 'wm/barcode',
        title: '条码管理',
        url: '/pages-mes/wm/barcode/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-barcode:query',
      },
      {
        rel: 'wm/batch',
        title: '批次管理',
        url: '/pages-mes/wm/batch/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-batch:query',
      },
      {
        rel: 'wm/itemreceipt',
        title: '采购入库',
        url: '/pages-mes/wm/itemreceipt/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-item-receipt:query',
      },
      {
        rel: 'wm/materialstock',
        title: '库存台账',
        url: '/pages-mes/wm/materialstock/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-material-stock:query',
      },
      {
        rel: 'wm/miscissue',
        title: '其他出库',
        url: '/pages-mes/wm/miscissue/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-misc-issue:query',
      },
      {
        rel: 'wm/miscreceipt',
        title: '其他入库',
        url: '/pages-mes/wm/miscreceipt/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm:misc-receipt:query',
      },
      {
        rel: 'wm/outsourceissue',
        title: '外协发料',
        url: '/pages-mes/wm/outsourceissue/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-outsource-issue:query',
      },
      {
        rel: 'wm/outsourcereceipt',
        title: '外协入库',
        url: '/pages-mes/wm/outsourcereceipt/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-outsource-receipt:query',
      },
      {
        rel: 'wm/packages',
        title: '装箱单',
        url: '/pages-mes/wm/packages/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-package:query',
      },
      {
        rel: 'wm/productissue',
        title: '生产领料',
        url: '/pages-mes/wm/productissue/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-product-issue:query',
      },
      {
        rel: 'wm/productreceipt',
        title: '产品入库',
        url: '/pages-mes/wm/productreceipt/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-product-receipt:query',
      },
      {
        rel: 'wm/productsales',
        title: '销售出库',
        url: '/pages-mes/wm/productsales/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-product-sales:query',
      },
      {
        rel: 'wm/returnissue',
        title: '生产退料',
        url: '/pages-mes/wm/returnissue/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-return-issue:query',
      },
      {
        rel: 'wm/returnsales',
        title: '销售退货',
        url: '/pages-mes/wm/returnsales/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-return-sales:query',
      },
      {
        rel: 'wm/returnvendor',
        title: '采购退货',
        url: '/pages-mes/wm/returnvendor/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-return-vendor:query',
      },
      {
        rel: 'wm/salesnotice',
        title: '发货通知',
        url: '/pages-mes/wm/salesnotice/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-sales-notice:query',
      },
      {
        rel: 'wm/sn',
        title: 'SN 码',
        url: '/pages-mes/wm/sn/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-sn:query',
      },
      {
        rel: 'wm/stocktaking/plan',
        title: '盘点方案',
        url: '/pages-mes/wm/stocktaking/plan/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-stock-taking-plan:query',
      },
      {
        rel: 'wm/stocktaking/task',
        title: '盘点任务',
        url: '/pages-mes/wm/stocktaking/task/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-stock-taking-task:query',
      },
      {
        rel: 'wm/transfer',
        title: '库存调拨',
        url: '/pages-mes/wm/transfer/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-transfer:query',
      },
      {
        rel: 'wm/warehouse/area',
        title: '库区管理',
        url: '/pages-mes/wm/warehouse/area/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-warehouse:query',
      },
      {
        rel: 'wm/warehouse',
        title: '仓库管理',
        url: '/pages-mes/wm/warehouse/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-warehouse:query',
      },
      {
        rel: 'wm/warehouse/location',
        title: '库位管理',
        url: '/pages-mes/wm/warehouse/location/index',
        icon: 'goods',
        color: '#fa8c16',
        permission: 'mes:wm-warehouse:query',
      },
    ],
  },
  {
    key: 'qc',
    name: '质量管理',
    items: [
      {
        rel: 'qc/batchtrace',
        title: '批次追溯',
        url: '/pages-mes/qc/batchtrace/index',
        icon: 'check-circle',
        color: '#722ed1',
        permission: 'mes:wm-batch:query',
      },
      {
        rel: 'qc/defect',
        title: '缺陷类型',
        url: '/pages-mes/qc/defect/index',
        icon: 'check-circle',
        color: '#722ed1',
        permission: 'mes:qc-defect:query',
      },
      {
        rel: 'qc/indicator',
        title: '质检指标',
        url: '/pages-mes/qc/indicator/index',
        icon: 'check-circle',
        color: '#722ed1',
        permission: 'mes:qc-indicator:query',
      },
      {
        rel: 'qc/ipqc',
        title: '过程检验',
        url: '/pages-mes/qc/ipqc/index',
        icon: 'check-circle',
        color: '#722ed1',
        permission: 'mes:qc-ipqc:query',
      },
      {
        rel: 'qc/iqc',
        title: '来料检验',
        url: '/pages-mes/qc/iqc/index',
        icon: 'check-circle',
        color: '#722ed1',
        permission: 'mes:qc-iqc:query',
      },
      {
        rel: 'qc/oqc',
        title: '出货检验',
        url: '/pages-mes/qc/oqc/index',
        icon: 'check-circle',
        color: '#722ed1',
        permission: 'mes:qc-oqc:query',
      },
      {
        rel: 'qc/pendinginspect',
        title: '待检任务',
        url: '/pages-mes/qc/pendinginspect/index',
        icon: 'check-circle',
        color: '#722ed1',
        permission: 'mes:qc-pending-inspect:query',
      },
      {
        rel: 'qc/rqc',
        title: '退货检验',
        url: '/pages-mes/qc/rqc/index',
        icon: 'check-circle',
        color: '#722ed1',
        permission: 'mes:qc-rqc:query',
      },
      {
        rel: 'qc/template',
        title: '质检方案',
        url: '/pages-mes/qc/template/index',
        icon: 'check-circle',
        color: '#722ed1',
        permission: 'mes:qc-template:query',
      },
    ],
  },
  {
    key: 'dv',
    name: '设备管理',
    items: [
      {
        rel: 'dv/checkplan',
        title: '点检方案',
        url: '/pages-mes/dv/checkplan/index',
        icon: 'tools',
        color: '#13c2c2',
        permission: 'mes:dv-check-plan:query',
      },
      {
        rel: 'dv/checkrecord',
        title: '点检记录',
        url: '/pages-mes/dv/checkrecord/index',
        icon: 'tools',
        color: '#13c2c2',
        permission: 'mes:dv-check-record:query',
      },
      {
        rel: 'dv/machinery',
        title: '设备台账',
        url: '/pages-mes/dv/machinery/index',
        icon: 'tools',
        color: '#13c2c2',
        permission: 'mes:dv-machinery:query',
      },
      {
        rel: 'dv/machinery/type',
        title: '设备类型',
        url: '/pages-mes/dv/machinery/type/index',
        icon: 'tools',
        color: '#13c2c2',
        permission: 'mes:dv-machinery-type:query',
      },
      {
        rel: 'dv/maintenrecord',
        title: '保养记录',
        url: '/pages-mes/dv/maintenrecord/index',
        icon: 'tools',
        color: '#13c2c2',
        permission: 'mes:dv-mainten-record:query',
      },
      {
        rel: 'dv/repair',
        title: '维修工单',
        url: '/pages-mes/dv/repair/index',
        icon: 'tools',
        color: '#13c2c2',
        permission: 'mes:dv-repair:query',
      },
      {
        rel: 'dv/subject',
        title: '点检项目',
        url: '/pages-mes/dv/subject/index',
        icon: 'tools',
        color: '#13c2c2',
        permission: 'mes:dv-subject:query',
      },
    ],
  },
  {
    key: 'cal',
    name: '排班管理',
    items: [
      {
        rel: 'cal/calendar',
        title: '排班日历',
        url: '/pages-mes/cal/calendar/index',
        icon: 'calendar',
        color: '#eb2f96',
        permission: 'mes:cal-team-shift:query',
      },
      {
        rel: 'cal/holiday',
        title: '假期设置',
        url: '/pages-mes/cal/holiday/index',
        icon: 'calendar',
        color: '#eb2f96',
        permission: 'mes:cal-holiday:query',
      },
      {
        rel: 'cal/plan',
        title: '排班计划',
        url: '/pages-mes/cal/plan/index',
        icon: 'calendar',
        color: '#eb2f96',
        permission: 'mes:cal-plan:query',
      },
      {
        rel: 'cal/team',
        title: '班组设置',
        url: '/pages-mes/cal/team/index',
        icon: 'calendar',
        color: '#eb2f96',
        permission: 'mes:cal-team:query',
      },
    ],
  },
  {
    key: 'tm',
    name: '工具管理',
    items: [
      {
        rel: 'tm/tool',
        title: '工具台账',
        url: '/pages-mes/tm/tool/index',
        icon: 'tools',
        color: '#faad14',
        permission: 'mes:tm-tool:query',
      },
      {
        rel: 'tm/tool/type',
        title: '工具类型',
        url: '/pages-mes/tm/tool/type/index',
        icon: 'tools',
        color: '#faad14',
        permission: 'mes:tm-tool-type:query',
      },
    ],
  },
]

const accessibleMenuGroups = computed(() => {
  return menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.permission) {
          return true
        }
        return hasAccessByCodes([item.permission])
      }),
    }))
    .filter(group => group.items.length > 0)
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 页面跳转 */
function handleNavigate(url: string) {
  uni.navigateTo({ url })
}

/** 格式化趋势日期 */
function formatTrendDate(date: string) {
  if (!date) {
    return '-'
  }
  const matched = date.match(/(\d{1,2})-(\d{1,2})$/)
  if (matched) {
    return `${matched[1]}-${matched[2]}`
  }
  return date.replace(/^\d{4}-?/, '') || date
}

/** 计算趋势柱高 */
function getTrendBarHeight(value: number, maxValue: number) {
  if (maxValue <= 0) {
    return 6
  }
  return Math.max(6, Math.round((value / maxValue) * 180))
}

/** 获取工单状态颜色 */
function getWorkOrderStatusColor(status: number) {
  if (status === 0) {
    return '#909399'
  }
  if (status === 1) {
    return '#1677ff'
  }
  if (status === 2) {
    return '#52c41a'
  }
  if (status === 3) {
    return '#f56c6c'
  }
  return '#1677ff'
}

/** 刷新汇总统计 */
async function reloadSummary() {
  if (loading.value) {
    return
  }
  loading.value = true
  loadError.value = false
  try {
    const [summaryData, trendData, statusData] = await Promise.all([
      MesHomeStatisticsApi.getHomeSummary(),
      MesHomeStatisticsApi.getProductionTrend(7),
      MesHomeStatisticsApi.getWorkOrderStatusDistribution(),
    ])
    summary.value = summaryData
    productionTrend.value = trendData || []
    workOrderStatus.value = statusData || []
  } catch {
    loadError.value = true
  } finally {
    loaded.value = true
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  reloadSummary()
})
</script>
