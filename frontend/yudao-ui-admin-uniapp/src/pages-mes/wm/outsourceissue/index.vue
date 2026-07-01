<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 外协发料管理"
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
      empty-view-text="暂无外协发料数据"
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
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_OUTSOURCE_ISSUE_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">外协工单：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.workOrderCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">供应商：</text>
              <text class="min-w-0 flex-1 truncate">{{ getVendorText(item) }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">发料日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.issueDate) || '-' }}</text>
            </view>
          </view>
          <view v-if="hasRowActions(item)" class="flex border-t border-t-[#f0f0f0] text-28rpx" @click.stop>
            <view v-if="canUpdatePrepare(item)" class="flex-1 py-18rpx text-center text-[#1677ff]" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="canSubmitPrepare(item)" class="flex-1 py-18rpx text-center text-[#faad14]" @click="handleSubmitIssue(item)">
              提交
            </view>
            <view v-if="canDeletePrepare(item)" class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </view>
            <view v-if="canStockApproving(item)" class="flex-1 py-18rpx text-center text-[#52c41a]" @click="handleStock(item)">
              执行拣货
            </view>
            <view v-if="canFinishApproved(item)" class="flex-1 py-18rpx text-center text-[#52c41a]" @click="handleFinish(item)">
              执行领出
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
      v-if="hasAccessByCodes(['mes:wm-outsource-issue:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WmOutsourceIssueQueryParams, WmOutsourceIssueVO } from '@/api/mes/wm/outsourceissue'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { cancelOutsourceIssue, deleteOutsourceIssue, getOutsourceIssuePage, submitOutsourceIssue } from '@/api/mes/wm/outsourceissue'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmOutsourceIssueStatusEnum } from '@/utils/constants'
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
const list = ref<WmOutsourceIssueVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmOutsourceIssueVO>>() // 分页组件引用
const queryParams = ref<WmOutsourceIssueQueryParams>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 供应商展示文案 */
function getVendorText(item: WmOutsourceIssueVO) {
  if (item.vendorCode || item.vendorName) {
    return `${item.vendorCode || '-'} / ${item.vendorName || '-'}`.trim()
  }
  return '-'
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getOutsourceIssuePage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: WmOutsourceIssueQueryParams) {
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
    url: '/pages-mes/wm/outsourceissue/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: WmOutsourceIssueVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/outsourceissue/detail/index?id=${item.id}`,
  })
}

/** 是否可编辑草稿 */
function canUpdatePrepare(item: WmOutsourceIssueVO) {
  return hasAccessByCodes(['mes:wm-outsource-issue:update']) && item.status === MesWmOutsourceIssueStatusEnum.PREPARE
}

/** 是否可删除草稿 */
function canDeletePrepare(item: WmOutsourceIssueVO) {
  return hasAccessByCodes(['mes:wm-outsource-issue:delete']) && item.status === MesWmOutsourceIssueStatusEnum.PREPARE
}

/** 是否可提交草稿 */
function canSubmitPrepare(item: WmOutsourceIssueVO) {
  return hasAccessByCodes(['mes:wm-outsource-issue:update']) && item.status === MesWmOutsourceIssueStatusEnum.PREPARE
}

/** 是否可执行拣货 */
function canStockApproving(item: WmOutsourceIssueVO) {
  return hasAccessByCodes(['mes:wm-outsource-issue:update']) && item.status === MesWmOutsourceIssueStatusEnum.APPROVING
}

/** 是否可执行领出 */
function canFinishApproved(item: WmOutsourceIssueVO) {
  return hasAccessByCodes(['mes:wm-outsource-issue:finish']) && item.status === MesWmOutsourceIssueStatusEnum.APPROVED
}

/** 是否可取消 */
function canCancelActive(item: WmOutsourceIssueVO) {
  return hasAccessByCodes(['mes:wm-outsource-issue:update'])
    && [MesWmOutsourceIssueStatusEnum.APPROVING, MesWmOutsourceIssueStatusEnum.APPROVED].includes(item.status)
}

/** 是否存在行操作 */
function hasRowActions(item: WmOutsourceIssueVO) {
  return canUpdatePrepare(item)
    || canSubmitPrepare(item)
    || canDeletePrepare(item)
    || canStockApproving(item)
    || canFinishApproved(item)
    || canCancelActive(item)
}

/** 编辑 */
function handleEdit(item: WmOutsourceIssueVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/outsourceissue/form/index?id=${item.id}`,
  })
}

/** 执行拣货 */
function handleStock(item: WmOutsourceIssueVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/outsourceissue/form/index?id=${item.id}&mode=stock`,
  })
}

/** 执行领出 */
function handleFinish(item: WmOutsourceIssueVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/outsourceissue/form/index?id=${item.id}&mode=finish`,
  })
}

/** 删除 */
async function handleDelete(item: WmOutsourceIssueVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.code || item.name || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteOutsourceIssue(item.id)
  toast.success('删除成功')
  reload()
}

/** 提交外协发料单 */
async function handleSubmitIssue(item: WmOutsourceIssueVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该外协发料单？提交前请确认已维护发料物料，提交后将不能修改。',
    })
  } catch {
    return
  }
  await submitOutsourceIssue(item.id)
  toast.success('提交成功')
  reload()
}

/** 取消外协发料单 */
async function handleCancel(item: WmOutsourceIssueVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该外协发料单？取消后不可恢复。',
    })
  } catch {
    return
  }
  await cancelOutsourceIssue(item.id)
  toast.success('取消成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:outsourceissue:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:outsourceissue:reload', reload)
})
</script>
