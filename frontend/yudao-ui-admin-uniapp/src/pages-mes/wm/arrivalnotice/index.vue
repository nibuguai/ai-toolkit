<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 到货通知管理"
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
      empty-view-text="暂无到货通知数据"
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
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_ARRIVAL_NOTICE_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">采购订单：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.purchaseOrderCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">供应商：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.vendorName || item.vendorCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">联系人：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.contactName || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">联系方式：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.contactTelephone || '-' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">到货日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDate(item.arrivalDate) || '-' }}</text>
            </view>
          </view>
          <view v-if="hasRowActions(item)" class="flex border-t border-t-[#f0f0f0] text-28rpx" @click.stop>
            <view v-if="canUpdatePrepare(item)" class="flex-1 py-18rpx text-center text-[#1677ff]" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="canDeletePrepare(item)" class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </view>
            <view v-if="canPendingQc(item)" class="flex-1 py-18rpx text-center text-[#faad14]" @click="handlePendingQc(item)">
              执行质检
            </view>
            <view v-if="canPendingReceipt(item)" class="flex-1 py-18rpx text-center text-[#52c41a]" @click="handlePendingReceipt(item)">
              执行入库
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:wm-arrival-notice:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WmArrivalNoticeQueryParams, WmArrivalNoticeVO } from '@/api/mes/wm/arrivalnotice'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteArrivalNotice, getArrivalNoticePage } from '@/api/mes/wm/arrivalnotice'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmArrivalNoticeStatusEnum } from '@/utils/constants'
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
const list = ref<WmArrivalNoticeVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmArrivalNoticeVO>>() // 分页组件引用
const queryParams = ref<WmArrivalNoticeQueryParams>({}) // 查询参数

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
    const data = await getArrivalNoticePage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: WmArrivalNoticeQueryParams) {
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
    url: '/pages-mes/wm/arrivalnotice/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: WmArrivalNoticeVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/arrivalnotice/detail/index?id=${item.id}`,
  })
}

/** 是否可编辑草稿 */
function canUpdatePrepare(item: WmArrivalNoticeVO) {
  return hasAccessByCodes(['mes:wm-arrival-notice:update']) && item.status === MesWmArrivalNoticeStatusEnum.PREPARE
}

/** 是否可删除草稿 */
function canDeletePrepare(item: WmArrivalNoticeVO) {
  return hasAccessByCodes(['mes:wm-arrival-notice:delete']) && item.status === MesWmArrivalNoticeStatusEnum.PREPARE
}

/** 是否可执行质检 */
function canPendingQc(item: WmArrivalNoticeVO) {
  return item.status === MesWmArrivalNoticeStatusEnum.PENDING_QC
}

/** 是否可执行入库 */
function canPendingReceipt(item: WmArrivalNoticeVO) {
  return item.status === MesWmArrivalNoticeStatusEnum.PENDING_RECEIPT
}

/** 是否显示行操作 */
function hasRowActions(item: WmArrivalNoticeVO) {
  return canUpdatePrepare(item) || canDeletePrepare(item) || canPendingQc(item) || canPendingReceipt(item)
}

/** 编辑 */
function handleEdit(item: WmArrivalNoticeVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/arrivalnotice/form/index?id=${item.id}`,
  })
}

/** 删除 */
async function handleDelete(item: WmArrivalNoticeVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.code || item.name || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteArrivalNotice(item.id)
  toast.success('删除成功')
  reload()
}

/** 执行质检 */
function handlePendingQc(item: WmArrivalNoticeVO) {
  uni.navigateTo({
    url: `/pages-mes/qc/pendinginspect/index?sourceDocCode=${encodeURIComponent(item.code)}&qcType=1`,
  })
}

/** 执行入库 */
function handlePendingReceipt(item: WmArrivalNoticeVO) {
  uni.navigateTo({ url: `/pages-mes/wm/itemreceipt/form/index?noticeId=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:arrivalnotice:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:arrivalnotice:reload', reload)
})
</script>
