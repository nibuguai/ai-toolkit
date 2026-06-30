<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 其他入库管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 顶部操作 -->
    <view class="bg-white px-24rpx py-16rpx">
      <view class="grid grid-cols-2 gap-16rpx">
        <wd-button
          v-if="hasAccessByCodes(['mes:wm:misc-receipt:create'])"
          block variant="plain" @click="handleAdd"
        >
          新增入库单
        </wd-button>
      </view>
    </view>

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
      empty-view-text="暂无其他入库数据"
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
            <view class="mb-16rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.code || '-' }}
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_MISC_RECEIPT_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">入库单名称：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.name || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">杂项类型：</text>
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_WM_MISC_RECEIPT_TYPE" :value="item.type" />
              <text v-else>-</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">来源单据类型：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.sourceDocType || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">来源单据编号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.sourceDocCode || '-' }}</text>
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
            <view v-if="canSubmitPrepare(item)" class="flex-1 py-18rpx text-center text-[#faad14]" @click="handleSubmitReceipt(item)">
              提交
            </view>
            <view v-if="canFinishApproved(item)" class="flex-1 py-18rpx text-center text-[#52c41a]" @click="handleFinish(item)">
              执行入库
            </view>
            <view v-if="canCancelApproved(item)" class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleCancel(item)">
              取消
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { WmMiscReceiptQueryParams, WmMiscReceiptVO } from '@/api/mes/wm/miscreceipt'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { cancelMiscReceipt, deleteMiscReceipt, getMiscReceiptPage, submitMiscReceipt } from '@/api/mes/wm/miscreceipt'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmMiscReceiptStatusEnum } from '@/utils/constants'
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
const list = ref<WmMiscReceiptVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmMiscReceiptVO>>() // 分页组件引用
const queryParams = ref<WmMiscReceiptQueryParams>({}) // 查询参数

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
    const data = await getMiscReceiptPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: WmMiscReceiptQueryParams) {
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
    url: '/pages-mes/wm/miscreceipt/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: WmMiscReceiptVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/miscreceipt/detail/index?id=${item.id}`,
  })
}

/** 是否可编辑草稿 */
function canUpdatePrepare(item: WmMiscReceiptVO) {
  return hasAccessByCodes(['mes:wm:misc-receipt:update']) && item.status === MesWmMiscReceiptStatusEnum.PREPARE
}

/** 是否可删除草稿 */
function canDeletePrepare(item: WmMiscReceiptVO) {
  return hasAccessByCodes(['mes:wm:misc-receipt:delete']) && item.status === MesWmMiscReceiptStatusEnum.PREPARE
}

/** 是否可提交草稿 */
function canSubmitPrepare(item: WmMiscReceiptVO) {
  return hasAccessByCodes(['mes:wm:misc-receipt:update']) && item.status === MesWmMiscReceiptStatusEnum.PREPARE
}

/** 是否可执行入库 */
function canFinishApproved(item: WmMiscReceiptVO) {
  return hasAccessByCodes(['mes:wm:misc-receipt:finish']) && item.status === MesWmMiscReceiptStatusEnum.APPROVED
}

/** 是否可取消待执行入库 */
function canCancelApproved(item: WmMiscReceiptVO) {
  return hasAccessByCodes(['mes:wm:misc-receipt:update']) && item.status === MesWmMiscReceiptStatusEnum.APPROVED
}

/** 是否存在行操作 */
function hasRowActions(item: WmMiscReceiptVO) {
  return canUpdatePrepare(item) || canDeletePrepare(item) || canSubmitPrepare(item) || canFinishApproved(item) || canCancelApproved(item)
}

/** 编辑 */
function handleEdit(item: WmMiscReceiptVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/miscreceipt/form/index?id=${item.id}`,
  })
}

/** 执行入库 */
function handleFinish(item: WmMiscReceiptVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/miscreceipt/form/index?id=${item.id}&mode=finish`,
  })
}

/** 删除 */
async function handleDelete(item: WmMiscReceiptVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.code || item.name || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteMiscReceipt(item.id)
  toast.success('删除成功')
  reload()
}

/** 提交 */
async function handleSubmitReceipt(item: WmMiscReceiptVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该杂项入库单？提交前请确认已维护入库物料，提交后将不能修改。',
    })
  } catch {
    return
  }
  await submitMiscReceipt(item.id)
  toast.success('提交成功')
  reload()
}

/** 取消 */
async function handleCancel(item: WmMiscReceiptVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该杂项入库单？取消后不可恢复。',
    })
  } catch {
    return
  }
  await cancelMiscReceipt(item.id)
  toast.success('取消成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:miscreceipt:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:miscreceipt:reload', reload)
})
</script>
