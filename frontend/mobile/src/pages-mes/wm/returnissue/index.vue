<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 生产退料管理"
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
      empty-view-text="暂无生产退料数据"
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
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_RETURN_ISSUE_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">退料类型：</text>
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE" :value="item.type" />
              <text v-else class="min-w-0 flex-1 truncate">-</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">生产工单：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.workOrderCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">工作站：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.workstationName || '-' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">退料日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.returnDate) || '-' }}</text>
            </view>
          </view>
          <view v-if="hasRowActions(item)" class="flex flex-wrap border-t border-t-[#f0f0f0] text-28rpx" @click.stop>
            <view v-if="canUpdatePrepare(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#1677ff]" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="canSubmitPrepare(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#faad14]" @click="handleSubmitIssue(item)">
              提交
            </view>
            <view v-if="canDeletePrepare(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </view>
            <view v-if="canQualityConfirmed(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#faad14]" @click="handleQualityHint">
              执行质检
            </view>
            <view v-if="canStockApproving(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#52c41a]" @click="handleStock(item)">
              执行上架
            </view>
            <view v-if="canFinishApproved(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#52c41a]" @click="handleFinish(item)">
              执行退料
            </view>
            <view v-if="canCancelActive(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleCancel(item)">
              取消
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:wm-return-issue:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WmReturnIssueQueryParams, WmReturnIssueVO } from '@/api/mes/wm/returnissue'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  cancelReturnIssue,
  deleteReturnIssue,
  getReturnIssuePage,
  submitReturnIssue,
} from '@/api/mes/wm/returnissue'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmReturnIssueStatusEnum } from '@/utils/constants'
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
const list = ref<WmReturnIssueVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmReturnIssueVO>>() // 分页组件引用
const queryParams = ref<WmReturnIssueQueryParams>({}) // 查询参数

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
    const data = await getReturnIssuePage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: WmReturnIssueQueryParams) {
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
    url: '/pages-mes/wm/returnissue/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: WmReturnIssueVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/returnissue/detail/index?id=${item.id}`,
  })
}

/** 是否可编辑草稿 */
function canUpdatePrepare(item: WmReturnIssueVO) {
  return hasAccessByCodes(['mes:wm-return-issue:update']) && item.status === MesWmReturnIssueStatusEnum.PREPARE
}

/** 是否可删除草稿 */
function canDeletePrepare(item: WmReturnIssueVO) {
  return hasAccessByCodes(['mes:wm-return-issue:delete']) && item.status === MesWmReturnIssueStatusEnum.PREPARE
}

/** 是否可提交草稿 */
function canSubmitPrepare(item: WmReturnIssueVO) {
  return hasAccessByCodes(['mes:wm-return-issue:update']) && item.status === MesWmReturnIssueStatusEnum.PREPARE
}

/** 是否可提示质检 */
function canQualityConfirmed(item: WmReturnIssueVO) {
  return item.status === MesWmReturnIssueStatusEnum.CONFIRMED
}

/** 是否可执行上架 */
function canStockApproving(item: WmReturnIssueVO) {
  return hasAccessByCodes(['mes:wm-return-issue:update']) && item.status === MesWmReturnIssueStatusEnum.APPROVING
}

/** 是否可执行退料 */
function canFinishApproved(item: WmReturnIssueVO) {
  return hasAccessByCodes(['mes:wm-return-issue:finish']) && item.status === MesWmReturnIssueStatusEnum.APPROVED
}

/** 是否可取消 */
function canCancelActive(item: WmReturnIssueVO) {
  return hasAccessByCodes(['mes:wm-return-issue:update'])
    && [
      MesWmReturnIssueStatusEnum.CONFIRMED,
      MesWmReturnIssueStatusEnum.APPROVING,
      MesWmReturnIssueStatusEnum.APPROVED,
    ].includes(item.status ?? -1)
}

/** 是否存在行操作 */
function hasRowActions(item: WmReturnIssueVO) {
  return canUpdatePrepare(item)
    || canSubmitPrepare(item)
    || canDeletePrepare(item)
    || canQualityConfirmed(item)
    || canStockApproving(item)
    || canFinishApproved(item)
    || canCancelActive(item)
}

/** 编辑 */
function handleEdit(item: WmReturnIssueVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/returnissue/form/index?id=${item.id}`,
  })
}

/** 执行上架 */
function handleStock(item: WmReturnIssueVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/returnissue/form/index?id=${item.id}&mode=stock`,
  })
}

/** 执行退料 */
function handleFinish(item: WmReturnIssueVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/returnissue/form/index?id=${item.id}&mode=finish`,
  })
}

/** 质检提示 */
function handleQualityHint() {
  uni.showModal({
    title: '执行质检',
    content: '请前往【质量管理 - 退货检验（RQC）】中进行退料检验操作。',
    showCancel: false,
  })
}

/** 删除 */
async function handleDelete(item: WmReturnIssueVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.code || item.name || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteReturnIssue(item.id)
  toast.success('删除成功')
  reload()
}

/** 提交生产退料单 */
async function handleSubmitIssue(item: WmReturnIssueVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该退料单？提交后将不能修改。',
    })
  } catch {
    return
  }
  await submitReturnIssue(item.id)
  toast.success('提交成功')
  reload()
}

/** 取消生产退料单 */
async function handleCancel(item: WmReturnIssueVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该生产退料单？取消后不可恢复。',
    })
  } catch {
    return
  }
  await cancelReturnIssue(item.id)
  toast.success('取消成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:returnissue:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:returnissue:reload', reload)
})
</script>
