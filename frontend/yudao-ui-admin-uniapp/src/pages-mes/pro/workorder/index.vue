<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="生产工单" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm ref="searchFormRef" @search="handleQuery" @reset="handleReset" />

    <!-- 分页列表 -->
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无生产工单数据" @query="queryList">
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
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_TYPE" :value="item.type" />
              <dict-tag v-if="item.orderSourceType != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE" :value="item.orderSourceType" />
              <wd-tag v-if="item.parentCode" type="default" plain>
                父工单 {{ item.parentCode }}
              </wd-tag>
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>产品：{{ item.productCode || '-' }} / {{ item.productName || '-' }}</view>
              <view>规格：{{ item.productSpecification || '-' }} / 单位：{{ item.unitMeasureName || '-' }}</view>
              <view>数量：{{ item.quantity ?? '-' }}，已生产：{{ item.quantityProduced ?? 0 }}，已排产：{{ item.quantityScheduled ?? 0 }}</view>
              <view v-if="item.clientName">
                客户：{{ item.clientCode || '-' }} / {{ item.clientName }}
              </view>
              <view v-if="item.vendorName">
                供应商：{{ item.vendorCode || '-' }} / {{ item.vendorName }}
              </view>
              <view>需求日期：{{ formatDate(item.requestDate) || '-' }}</view>
            </view>
          </view>
          <view class="flex border-t border-[#f3f4f6] text-26rpx">
            <view v-if="canUpdate && item.status === MesProWorkOrderStatusEnum.PREPARE" class="flex-1 py-18rpx text-center text-[#1677ff]" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="canDelete && item.status === MesProWorkOrderStatusEnum.PREPARE" class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </view>
            <view v-if="canCreate && item.status === MesProWorkOrderStatusEnum.CONFIRMED && item.type === MesProWorkOrderTypeEnum.SELF" class="flex-1 py-18rpx text-center text-[#1677ff]" @click="handleAddChild(item)">
              子工单
            </view>
            <view v-if="canUpdate && item.status === MesProWorkOrderStatusEnum.CONFIRMED" class="flex-1 py-18rpx text-center text-[#52c41a]" @click="handleFinish(item)">
              完成
            </view>
            <view v-if="canUpdate && item.status === MesProWorkOrderStatusEnum.CONFIRMED" class="flex-1 py-18rpx text-center text-[#e6a23c]" @click="handleCancel(item)">
              取消
            </view>
            <view class="flex-1 py-18rpx text-center text-[#666]" @click="handleBarcode(item)">
              条码
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab v-if="canCreate" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { ProWorkOrderQueryParams, ProWorkOrderVO } from '@/api/mes/pro/workorder'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { cancelWorkOrder, deleteWorkOrder, finishWorkOrder, getWorkOrderPage } from '@/api/mes/pro/workorder'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import SearchForm from './components/search-form.vue'

interface FlatWorkOrder extends ProWorkOrderVO {
  level: number
}

const MesProWorkOrderStatusEnum = {
  PREPARE: 0,
  CONFIRMED: 1,
  FINISHED: 2,
  CANCELED: 3,
} as const
const MesProWorkOrderTypeEnum = {
  SELF: 1,
} as const
const BarcodeBizTypeEnum = {
  WORKORDER: 301,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<ProWorkOrderVO[]>([])
const pagingRef = ref<ZPagingRef<ProWorkOrderVO>>()
const queryParams = ref<Partial<ProWorkOrderQueryParams>>({})
const searchFormRef = ref<InstanceType<typeof SearchForm>>()
const canCreate = computed(() => hasAccessByCodes(['mes:pro-work-order:create']))
const canUpdate = computed(() => hasAccessByCodes(['mes:pro-work-order:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:pro-work-order:delete']))
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

/** 查询生产工单列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getWorkOrderPage({ ...queryParams.value, pageNo, pageSize })
    list.value = buildWorkOrderTree(data.list)
    pagingRef.value?.completeByTotal(list.value, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Partial<ProWorkOrderQueryParams>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {}
  searchFormRef.value?.resetFields()
  reload()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增生产工单 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/pro/workorder/form/index' })
}

/** 新增子工单 */
function handleAddChild(item: ProWorkOrderVO) {
  uni.navigateTo({ url: `/pages-mes/pro/workorder/form/index?parentId=${item.id}` })
}

/** 查看详情 */
function handleDetail(item: ProWorkOrderVO) {
  uni.navigateTo({ url: `/pages-mes/pro/workorder/detail/index?id=${item.id}` })
}

/** 编辑生产工单 */
function handleEdit(item: ProWorkOrderVO) {
  uni.navigateTo({ url: `/pages-mes/pro/workorder/form/index?id=${item.id}` })
}

/** 完成生产工单 */
async function handleFinish(item: ProWorkOrderVO) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认要完成「${item.code}」生产工单吗？` })
  } catch {
    return
  }
  await finishWorkOrder(item.id)
  toast.success('工单已完成')
  reload()
}

/** 取消生产工单 */
async function handleCancel(item: ProWorkOrderVO) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认要取消「${item.code}」生产工单吗？取消后不可恢复。` })
  } catch {
    return
  }
  await cancelWorkOrder(item.id)
  toast.success('工单已取消')
  reload()
}

/** 删除生产工单 */
async function handleDelete(item: ProWorkOrderVO) {
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${item.code}」生产工单吗？` })
  } catch {
    return
  }
  await deleteWorkOrder(item.id)
  toast.success('删除成功')
  reload()
}

/** 查看工单条码 */
function handleBarcode(item: ProWorkOrderVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/barcode/index?bizType=${BarcodeBizTypeEnum.WORKORDER}&bizId=${item.id}&bizCode=${encodeURIComponent(item.code)}`,
  })
}

onMounted(() => {
  uni.$on('mes:pro:workorder:reload', reload)
})

onUnload(() => {
  uni.$off('mes:pro:workorder:reload', reload)
})
</script>
