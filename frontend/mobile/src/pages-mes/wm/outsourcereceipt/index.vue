<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 外协入库管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无外协入库数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.code || '-' }}
                </view>
                <view class="mt-6rpx truncate text-26rpx text-[#666]">
                  {{ item.name || '-' }}
                </view>
              </view>
              <dict-tag :type="DICT_TYPE.MES_WM_OUTSOURCE_RECEIPT_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">外协工单：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.workOrderCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">供应商：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.vendorName || '-' }}</text>
            </view>
            <view class="mb-16rpx flex text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">入库日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.receiptDate) || '-' }}</text>
            </view>
            <view class="flex flex-wrap gap-16rpx text-26rpx">
              <view v-if="canUpdatePrepare(item)" class="rounded-8rpx bg-[#e6f4ff] px-20rpx py-10rpx text-[#1677ff]" @click.stop="handleEdit(item)">
                编辑
              </view>
              <view v-if="canSubmitPrepare(item)" class="rounded-8rpx bg-[#fff7e6] px-20rpx py-10rpx text-[#fa8c16]" @click.stop="handleSubmitIssue(item)">
                提交
              </view>
              <view v-if="canDeletePrepare(item)" class="rounded-8rpx bg-[#fff1f0] px-20rpx py-10rpx text-[#f5222d]" @click.stop="handleDelete(item)">
                删除
              </view>
              <view v-if="canStockApproving(item)" class="rounded-8rpx bg-[#f6ffed] px-20rpx py-10rpx text-[#52c41a]" @click.stop="handleStock(item)">
                执行上架
              </view>
              <view v-if="canFinishApproved(item)" class="rounded-8rpx bg-[#f6ffed] px-20rpx py-10rpx text-[#52c41a]" @click.stop="handleFinish(item)">
                完成入库
              </view>
              <view v-if="canCancelActive(item)" class="rounded-8rpx bg-[#fff1f0] px-20rpx py-10rpx text-[#f5222d]" @click.stop="handleCancelIssue(item)">
                取消
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:wm-outsource-receipt:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WmOutsourceReceiptQueryParams, WmOutsourceReceiptVO } from '@/api/mes/wm/outsourcereceipt'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  cancelOutsourceReceipt,
  deleteOutsourceReceipt,
  getOutsourceReceiptPage,
  submitOutsourceReceipt,
} from '@/api/mes/wm/outsourcereceipt'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmOutsourceReceiptStatusEnum } from '@/utils/constants'
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
const list = ref<WmOutsourceReceiptVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingInstance>() // 分页组件引用
const queryParams = ref<WmOutsourceReceiptQueryParams>({
  pageNo: 1,
  pageSize: 10,
}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 是否草稿可编辑 */
function canUpdatePrepare(item: WmOutsourceReceiptVO) {
  return hasAccessByCodes(['mes:wm-outsource-receipt:update'])
    && item.status === MesWmOutsourceReceiptStatusEnum.PREPARE
}

/** 是否草稿可删除 */
function canDeletePrepare(item: WmOutsourceReceiptVO) {
  return hasAccessByCodes(['mes:wm-outsource-receipt:delete'])
    && item.status === MesWmOutsourceReceiptStatusEnum.PREPARE
}

/** 是否草稿可提交 */
function canSubmitPrepare(item: WmOutsourceReceiptVO) {
  return hasAccessByCodes(['mes:wm-outsource-receipt:update'])
    && item.status === MesWmOutsourceReceiptStatusEnum.PREPARE
}

/** 是否待上架 */
function canStockApproving(item: WmOutsourceReceiptVO) {
  return hasAccessByCodes(['mes:wm-outsource-receipt:update'])
    && item.status === MesWmOutsourceReceiptStatusEnum.APPROVING
}

/** 是否待执行入库 */
function canFinishApproved(item: WmOutsourceReceiptVO) {
  return hasAccessByCodes(['mes:wm-outsource-receipt:finish'])
    && item.status === MesWmOutsourceReceiptStatusEnum.APPROVED
}

/** 是否可取消 */
function canCancelActive(item: WmOutsourceReceiptVO) {
  return hasAccessByCodes(['mes:wm-outsource-receipt:update'])
    && [MesWmOutsourceReceiptStatusEnum.APPROVING, MesWmOutsourceReceiptStatusEnum.APPROVED].includes(item.status)
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getOutsourceReceiptPage({
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
function handleQuery(data: WmOutsourceReceiptQueryParams) {
  queryParams.value = {
    ...data,
    pageNo: 1,
    pageSize: 10,
  }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {
    pageNo: 1,
    pageSize: 10,
  }
  reload()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/wm/outsourcereceipt/form/index' })
}

/** 编辑 */
function handleEdit(item: WmOutsourceReceiptVO) {
  uni.navigateTo({ url: `/pages-mes/wm/outsourcereceipt/form/index?id=${item.id}` })
}

/** 查看详情 */
function handleDetail(item: WmOutsourceReceiptVO) {
  uni.navigateTo({ url: `/pages-mes/wm/outsourcereceipt/detail/index?id=${item.id}` })
}

/** 执行上架 */
function handleStock(item: WmOutsourceReceiptVO) {
  uni.navigateTo({ url: `/pages-mes/wm/outsourcereceipt/form/index?id=${item.id}&mode=stock` })
}

/** 完成入库 */
function handleFinish(item: WmOutsourceReceiptVO) {
  uni.navigateTo({ url: `/pages-mes/wm/outsourcereceipt/form/index?id=${item.id}&mode=finish` })
}

/** 删除 */
async function handleDelete(item: WmOutsourceReceiptVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.code || item.name || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteOutsourceReceipt(item.id)
  toast.success('删除成功')
  reload()
}

/** 提交外协入库单 */
async function handleSubmitIssue(item: WmOutsourceReceiptVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该外协入库单？提交前请确认已维护入库物料，提交后将不能修改。',
    })
  } catch {
    return
  }
  await submitOutsourceReceipt(item.id)
  toast.success('提交成功')
  reload()
}

/** 取消外协入库单 */
async function handleCancelIssue(item: WmOutsourceReceiptVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该外协入库单？取消后不可恢复。',
    })
  } catch {
    return
  }
  await cancelOutsourceReceipt(item.id)
  toast.success('取消成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:outsourcereceipt:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:outsourcereceipt:reload', reload)
})
</script>
