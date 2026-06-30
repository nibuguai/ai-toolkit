<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="盘点任务"
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
      empty-view-text="暂无盘点任务"
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
              <dict-tag :type="DICT_TYPE.MES_WM_STOCK_TAKING_TASK_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">盘点类型：</text>
              <dict-tag :type="DICT_TYPE.MES_WM_STOCK_TAKING_TYPE" :value="item.type" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">盘点方案：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.planName || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">盘点日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDate(item.takingDate) || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">盘点人：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.userNickname || '-' }}</text>
            </view>
            <view class="text-26rpx text-[#999]">
              创建时间：{{ formatDateTime(item.createTime) || '-' }}
            </view>
          </view>
          <view v-if="hasRowActions(item)" class="flex border-t border-t-[#f0f0f0] text-28rpx">
            <view
              v-if="canUpdate(item)"
              class="flex-1 py-18rpx text-center text-[#1677ff]"
              @click="handleEdit(item)"
            >
              编辑
            </view>
            <view
              v-if="canSubmit(item)"
              class="flex-1 py-18rpx text-center text-[#52c41a]"
              @click="handleSubmitTask(item)"
            >
              提交
            </view>
            <view
              v-if="canExecute(item)"
              class="flex-1 py-18rpx text-center text-[#1677ff]"
              @click="handleExecute(item)"
            >
              执行盘点
            </view>
            <view
              v-if="canCancel(item)"
              class="flex-1 py-18rpx text-center text-[#fa8c16]"
              @click="handleCancelTask(item)"
            >
              取消
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
      v-if="hasAccessByCodes(['mes:wm-stock-taking-task:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { StockTakingTaskQueryParams, StockTakingTaskVO } from '@/api/mes/wm/stocktaking/task'
import type { ZPagingInstance } from 'z-paging'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  cancelStockTaking,
  deleteStockTaking,
  finishStockTaking,
  getStockTakingPage,
  submitStockTaking,
} from '@/api/mes/wm/stocktaking/task'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmStockTakingTaskStatusEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
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
const list = ref<StockTakingTaskVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingInstance<StockTakingTaskVO>>() // 分页组件引用
const queryParams = ref<Partial<StockTakingTaskQueryParams>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getStockTakingPage({
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
function handleQuery(data?: StockTakingTaskQueryParams) {
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
  uni.navigateTo({ url: '/pages-mes/wm/stocktaking/task/form/index' })
}

/** 查看详情 */
function handleDetail(item: StockTakingTaskVO) {
  uni.navigateTo({ url: `/pages-mes/wm/stocktaking/task/detail/index?id=${item.id}` })
}

/** 编辑 */
function handleEdit(item: StockTakingTaskVO) {
  uni.navigateTo({ url: `/pages-mes/wm/stocktaking/task/form/index?id=${item.id}` })
}

/** 执行盘点 */
function handleExecute(item: StockTakingTaskVO) {
  uni.navigateTo({ url: `/pages-mes/wm/stocktaking/task/form/index?id=${item.id}&mode=execute` })
}

/** 是否有行操作 */
function hasRowActions(item: StockTakingTaskVO) {
  return canUpdate(item) || canSubmit(item) || canExecute(item) || canCancel(item) || canDelete(item)
}

/** 是否可编辑 */
function canUpdate(item: StockTakingTaskVO) {
  return hasAccessByCodes(['mes:wm-stock-taking-task:update'])
    && item.status === MesWmStockTakingTaskStatusEnum.PREPARE
}

/** 是否可提交 */
function canSubmit(item: StockTakingTaskVO) {
  return hasAccessByCodes(['mes:wm-stock-taking-task:update'])
    && item.status === MesWmStockTakingTaskStatusEnum.PREPARE
}

/** 是否可执行 */
function canExecute(item: StockTakingTaskVO) {
  return hasAccessByCodes(['mes:wm-stock-taking-task:update'])
    && item.status === MesWmStockTakingTaskStatusEnum.APPROVING
}

/** 是否可取消 */
function canCancel(item: StockTakingTaskVO) {
  return hasAccessByCodes(['mes:wm-stock-taking-task:update'])
    && item.status === MesWmStockTakingTaskStatusEnum.APPROVING
}

/** 是否可删除 */
function canDelete(item: StockTakingTaskVO) {
  return hasAccessByCodes(['mes:wm-stock-taking-task:delete'])
    && item.status === MesWmStockTakingTaskStatusEnum.PREPARE
}

/** 提交任务 */
async function handleSubmitTask(item: StockTakingTaskVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认提交盘点任务「${item.name}」吗？提交后将不能修改。`,
    })
  } catch {
    return
  }
  await submitStockTaking(item.id)
  toast.success('提交成功')
  reload()
}

/** 取消任务 */
async function handleCancelTask(item: StockTakingTaskVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认取消盘点任务「${item.name}」吗？取消后不可恢复。`,
    })
  } catch {
    return
  }
  await cancelStockTaking(item.id)
  toast.success('取消成功')
  reload()
}

/** 删除任务 */
async function handleDelete(item: StockTakingTaskVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除盘点任务「${item.name}」吗？`,
    })
  } catch {
    return
  }
  await deleteStockTaking(item.id)
  toast.success('删除成功')
  reload()
}

/** 完成盘点，供执行页面后续复用 */
async function handleFinish(item: StockTakingTaskVO) {
  await finishStockTaking(item.id)
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:stocktaking:task:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:stocktaking:task:reload', reload)
})

defineExpose({
  handleFinish,
})
</script>
