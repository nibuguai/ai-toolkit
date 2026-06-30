<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 采购入库管理"
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
      empty-view-text="暂无采购入库数据"
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
                <view class="mt-4rpx truncate text-24rpx text-[#999]">
                  {{ item.name || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_ITEM_RECEIPT_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">到货通知：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.noticeCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">来料检验：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.iqcCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">采购订单：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.purchaseOrderCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">供应商：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.vendorName || '-' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">入库日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDate(item.receiptDate) || '-' }}</text>
            </view>
          </view>
          <view v-if="hasRowActions(item)" class="flex border-t border-t-[#f0f0f0] text-28rpx" @click.stop>
            <view v-if="canUpdatePrepare(item)" class="flex-1 py-18rpx text-center text-[#1677ff]" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="canDeletePrepare(item)" class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </view>
            <view v-if="canStockApproving(item)" class="flex-1 py-18rpx text-center text-[#52c41a]" @click="handleStock(item)">
              执行上架
            </view>
            <view v-if="canFinishApproved(item)" class="flex-1 py-18rpx text-center text-[#52c41a]" @click="handleFinish(item)">
              执行入库
            </view>
            <view v-if="canCancelActive(item)" class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleCancel(item)">
              取消
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:wm-item-receipt:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WmItemReceiptQueryParams, WmItemReceiptVO } from '@/api/mes/wm/itemreceipt'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { cancelItemReceipt, deleteItemReceipt, getItemReceiptPage } from '@/api/mes/wm/itemreceipt'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmItemReceiptStatusEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
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
const list = ref<WmItemReceiptVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmItemReceiptVO>>() // 分页组件引用
const queryParams = ref<WmItemReceiptQueryParams>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getItemReceiptPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: WmItemReceiptQueryParams) {
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
  uni.navigateTo({
    url: '/pages-mes/wm/itemreceipt/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: WmItemReceiptVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/itemreceipt/detail/index?id=${item.id}`,
  })
}

/** 是否可编辑草稿 */
function canUpdatePrepare(item: WmItemReceiptVO) {
  return hasAccessByCodes(['mes:wm-item-receipt:update']) && item.status === MesWmItemReceiptStatusEnum.PREPARE
}

/** 是否可删除草稿 */
function canDeletePrepare(item: WmItemReceiptVO) {
  return hasAccessByCodes(['mes:wm-item-receipt:delete']) && item.status === MesWmItemReceiptStatusEnum.PREPARE
}

/** 是否可执行上架 */
function canStockApproving(item: WmItemReceiptVO) {
  return hasAccessByCodes(['mes:wm-item-receipt:update']) && item.status === MesWmItemReceiptStatusEnum.APPROVING
}

/** 是否可执行入库 */
function canFinishApproved(item: WmItemReceiptVO) {
  return hasAccessByCodes(['mes:wm-item-receipt:finish']) && item.status === MesWmItemReceiptStatusEnum.APPROVED
}

/** 是否可取消 */
function canCancelActive(item: WmItemReceiptVO) {
  return hasAccessByCodes(['mes:wm-item-receipt:update'])
    && [MesWmItemReceiptStatusEnum.APPROVING, MesWmItemReceiptStatusEnum.APPROVED].includes(item.status as number)
}

/** 是否显示行操作 */
function hasRowActions(item: WmItemReceiptVO) {
  return canUpdatePrepare(item) || canDeletePrepare(item) || canStockApproving(item) || canFinishApproved(item) || canCancelActive(item)
}

/** 编辑 */
function handleEdit(item: WmItemReceiptVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/itemreceipt/form/index?id=${item.id}`,
  })
}

/** 执行上架 */
function handleStock(item: WmItemReceiptVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/itemreceipt/form/index?id=${item.id}&mode=stock`,
  })
}

/** 执行入库 */
function handleFinish(item: WmItemReceiptVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/itemreceipt/form/index?id=${item.id}&mode=finish`,
  })
}

/** 删除 */
async function handleDelete(item: WmItemReceiptVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.code || item.name || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteItemReceipt(item.id)
  toast.success('删除成功')
  reload()
}

/** 取消采购入库单 */
async function handleCancel(item: WmItemReceiptVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该采购入库单？取消后不可恢复。',
    })
  } catch {
    return
  }
  await cancelItemReceipt(item.id)
  toast.success('取消成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:itemreceipt:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:itemreceipt:reload', reload)
})
</script>
