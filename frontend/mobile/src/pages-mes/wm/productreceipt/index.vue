<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 产品入库管理"
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
      empty-view-text="暂无产品入库数据"
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
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_PRODUCT_RECPT_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">生产工单：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.workOrderCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">产品物料：</text>
              <text class="min-w-0 flex-1 truncate">{{ getItemText(item) }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">计量单位：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.unitMeasureName || '-' }}</text>
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
      v-if="hasAccessByCodes(['mes:wm-product-receipt:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WmProductReceiptQueryParams, WmProductReceiptVO } from '@/api/mes/wm/productreceipt'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { cancelProductReceipt, deleteProductReceipt, getProductReceiptPage } from '@/api/mes/wm/productreceipt'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmProductReceiptStatusEnum } from '@/utils/constants'
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
const list = ref<WmProductReceiptVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmProductReceiptVO>>() // 分页组件引用
const queryParams = ref<WmProductReceiptQueryParams>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 产品展示文案 */
function getItemText(item: WmProductReceiptVO) {
  if (item.itemCode || item.itemName) {
    return `${item.itemCode || '-'} / ${item.itemName || '-'}`.trim()
  }
  return item.itemId ? `物料 #${item.itemId}` : '-'
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getProductReceiptPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: WmProductReceiptQueryParams) {
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
    url: '/pages-mes/wm/productreceipt/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: WmProductReceiptVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/productreceipt/detail/index?id=${item.id}`,
  })
}

/** 是否可编辑草稿 */
function canUpdatePrepare(item: WmProductReceiptVO) {
  return hasAccessByCodes(['mes:wm-product-receipt:update']) && item.status === MesWmProductReceiptStatusEnum.PREPARE
}

/** 是否可删除草稿 */
function canDeletePrepare(item: WmProductReceiptVO) {
  return hasAccessByCodes(['mes:wm-product-receipt:delete']) && item.status === MesWmProductReceiptStatusEnum.PREPARE
}

/** 是否可执行上架 */
function canStockApproving(item: WmProductReceiptVO) {
  return hasAccessByCodes(['mes:wm-product-receipt:update']) && item.status === MesWmProductReceiptStatusEnum.APPROVING
}

/** 是否可执行入库 */
function canFinishApproved(item: WmProductReceiptVO) {
  return hasAccessByCodes(['mes:wm-product-receipt:finish']) && item.status === MesWmProductReceiptStatusEnum.APPROVED
}

/** 是否可取消 */
function canCancelActive(item: WmProductReceiptVO) {
  return hasAccessByCodes(['mes:wm-product-receipt:update'])
    && [MesWmProductReceiptStatusEnum.APPROVING, MesWmProductReceiptStatusEnum.APPROVED].includes(item.status)
}

/** 是否存在行操作 */
function hasRowActions(item: WmProductReceiptVO) {
  return canUpdatePrepare(item) || canDeletePrepare(item) || canStockApproving(item) || canFinishApproved(item) || canCancelActive(item)
}

/** 编辑 */
function handleEdit(item: WmProductReceiptVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/productreceipt/form/index?id=${item.id}`,
  })
}

/** 执行上架 */
function handleStock(item: WmProductReceiptVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/productreceipt/form/index?id=${item.id}&mode=stock`,
  })
}

/** 执行入库 */
function handleFinish(item: WmProductReceiptVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/productreceipt/form/index?id=${item.id}&mode=finish`,
  })
}

/** 删除 */
async function handleDelete(item: WmProductReceiptVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.code || item.name || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteProductReceipt(item.id)
  toast.success('删除成功')
  reload()
}

/** 取消产品入库单 */
async function handleCancel(item: WmProductReceiptVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该产品入库单？取消后不可恢复。',
    })
  } catch {
    return
  }
  await cancelProductReceipt(item.id)
  toast.success('取消成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:productreceipt:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:productreceipt:reload', reload)
})
</script>
