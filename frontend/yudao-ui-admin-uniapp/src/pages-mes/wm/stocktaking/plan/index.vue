<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="盘点方案"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />
    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无盘点方案"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="p-24rpx" @click="handleDetail(item)">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.code || '-' }}
                </view>
                <view class="mt-6rpx truncate text-26rpx text-[#666]">
                  {{ item.name || '-' }}
                </view>
              </view>
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">盘点类型：</text>
              <dict-tag :type="DICT_TYPE.MES_WM_STOCK_TAKING_TYPE" :value="item.type" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">计划时间：</text>
              <text class="min-w-0 flex-1 truncate">{{ getPlanTimeText(item) }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">盲盘：</text>
              <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(item.blindFlag))" />
              <text class="mx-16rpx text-[#ddd]">|</text>
              <text class="mr-8rpx shrink-0 text-[#999]">冻结库存：</text>
              <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(item.frozen))" />
            </view>
            <view class="text-26rpx text-[#999]">
              创建时间：{{ formatDateTime(item.createTime) || '-' }}
            </view>
          </view>
          <view class="flex border-t border-t-[#f0f0f0] text-28rpx">
            <view
              v-if="canUpdate(item)"
              class="flex-1 py-18rpx text-center text-[#1677ff]"
              @click="handleEdit(item)"
            >
              编辑
            </view>
            <view
              v-if="canUpdateStatus"
              class="flex-1 py-18rpx text-center text-[#52c41a]"
              @click="handleStatusChange(item)"
            >
              {{ item.status === CommonStatusEnum.ENABLE ? '停用' : '启用' }}
            </view>
            <view
              v-if="canDelete(item)"
              class="flex-1 py-18rpx text-center text-[#f56c6c]"
              @click="handleDelete(item)"
            >
              删除
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:wm-stock-taking-plan:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { StockTakingPlanQueryParams, StockTakingPlanVO } from '@/api/mes/wm/stocktaking/plan'
import type { ZPagingInstance } from 'z-paging'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  deleteStockTakingPlan,
  getStockTakingPlanPage,
  updateStockTakingPlanStatus,
} from '@/api/mes/wm/stocktaking/plan'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<StockTakingPlanVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingInstance<StockTakingPlanVO>>() // 分页组件引用
const queryParams = ref<Partial<StockTakingPlanQueryParams>>({}) // 查询参数
const canUpdateStatus = computed(() => hasAccessByCodes(['mes:wm-stock-taking-plan:update']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 计划时间展示 */
function getPlanTimeText(item: StockTakingPlanVO) {
  const start = formatDateTime(item.startTime)
  const end = formatDateTime(item.endTime)
  if (!start && !end) {
    return '-'
  }
  return `${start || '-'} ~ ${end || '-'}`
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getStockTakingPlanPage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Partial<StockTakingPlanQueryParams>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/wm/stocktaking/plan/form/index' })
}

/** 查看详情 */
function handleDetail(item: StockTakingPlanVO) {
  uni.navigateTo({ url: `/pages-mes/wm/stocktaking/plan/detail/index?id=${item.id}` })
}

/** 编辑 */
function handleEdit(item: StockTakingPlanVO) {
  uni.navigateTo({ url: `/pages-mes/wm/stocktaking/plan/form/index?id=${item.id}` })
}

/** 是否可编辑 */
function canUpdate(item: StockTakingPlanVO) {
  return hasAccessByCodes(['mes:wm-stock-taking-plan:update']) && item.status === CommonStatusEnum.DISABLE
}

/** 是否可删除 */
function canDelete(item: StockTakingPlanVO) {
  return hasAccessByCodes(['mes:wm-stock-taking-plan:delete']) && item.status === CommonStatusEnum.DISABLE
}

/** 修改状态 */
async function handleStatusChange(item: StockTakingPlanVO) {
  const newStatus = item.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  const text = newStatus === CommonStatusEnum.ENABLE ? '启用' : '停用'
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认要${text}盘点方案「${item.name}」吗？`,
    })
  } catch {
    return
  }
  await updateStockTakingPlanStatus(item.id, newStatus)
  toast.success(`${text}成功`)
  reload()
}

/** 删除 */
async function handleDelete(item: StockTakingPlanVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除盘点方案「${item.name}」吗？`,
    })
  } catch {
    return
  }
  await deleteStockTakingPlan(item.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:stocktaking:plan:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:stocktaking:plan:reload', reload)
})
</script>
