<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 销售退货管理"
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
      empty-view-text="暂无销售退货数据"
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
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.code || '-' }}
                </view>
                <view class="mt-4rpx truncate text-24rpx text-[#999]">
                  {{ item.name || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_RETURN_SALES_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">销售订单号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.salesOrderCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">客户：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.clientName || item.clientCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">退货原因：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.returnReason || '-' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">退货日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDate(item.returnDate) || '-' }}</text>
            </view>
          </view>
          <view v-if="hasRowActions(item)" class="flex flex-wrap border-t border-t-[#f0f0f0] text-28rpx" @click.stop>
            <view v-if="canUpdatePrepare(item)" class="min-w-180rpx flex-1 py-18rpx text-center text-[#1677ff]" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="canDeletePrepare(item)" class="min-w-180rpx flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </view>
            <view v-if="canSubmitPrepare(item)" class="min-w-180rpx flex-1 py-18rpx text-center text-[#faad14]" @click="handleSubmitReturnSales(item)">
              提交
            </view>
            <view v-if="canQuality(item)" class="min-w-180rpx flex-1 py-18rpx text-center text-[#faad14]" @click="handleQuality">
              执行质检
            </view>
            <view v-if="canFinish(item)" class="min-w-180rpx flex-1 py-18rpx text-center text-[#52c41a]" @click="handleFinish(item)">
              执行退货
            </view>
            <view v-if="canStock(item)" class="min-w-180rpx flex-1 py-18rpx text-center text-[#52c41a]" @click="handleStock(item)">
              执行上架
            </view>
            <view v-if="canCancel(item)" class="min-w-180rpx flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleCancel(item)">
              取消
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:wm-return-sales:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WmReturnSalesQueryParams, WmReturnSalesVO } from '@/api/mes/wm/returnsales'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteReturnSales, getReturnSalesPage, submitReturnSales } from '@/api/mes/wm/returnsales'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmReturnSalesStatusEnum } from '@/utils/constants'
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
const list = ref<WmReturnSalesVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmReturnSalesVO>>() // 分页组件引用
const queryParams = ref<WmReturnSalesQueryParams>({}) // 查询参数
const submitting = ref(false) // 提交状态

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
    const data = await getReturnSalesPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: WmReturnSalesQueryParams) {
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
  uni.navigateTo({ url: '/pages-mes/wm/returnsales/form/index' })
}

/** 查看详情 */
function handleDetail(item: WmReturnSalesVO) {
  uni.navigateTo({ url: `/pages-mes/wm/returnsales/detail/index?id=${item.id}` })
}

/** 是否可编辑草稿 */
function canUpdatePrepare(item: WmReturnSalesVO) {
  return hasAccessByCodes(['mes:wm-return-sales:update']) && item.status === MesWmReturnSalesStatusEnum.PREPARE
}

/** 是否可删除草稿 */
function canDeletePrepare(item: WmReturnSalesVO) {
  return hasAccessByCodes(['mes:wm-return-sales:delete']) && item.status === MesWmReturnSalesStatusEnum.PREPARE
}

/** 是否可提交草稿 */
function canSubmitPrepare(item: WmReturnSalesVO) {
  return hasAccessByCodes(['mes:wm-return-sales:submit']) && item.status === MesWmReturnSalesStatusEnum.PREPARE
}

/** 是否可执行质检 */
function canQuality(item: WmReturnSalesVO) {
  return item.status === MesWmReturnSalesStatusEnum.CONFIRMED
}

/** 是否可执行退货 */
function canFinish(item: WmReturnSalesVO) {
  return hasAccessByCodes(['mes:wm-return-sales:finish']) && item.status === MesWmReturnSalesStatusEnum.APPROVING
}

/** 是否可执行上架 */
function canStock(item: WmReturnSalesVO) {
  return hasAccessByCodes(['mes:wm-return-sales:stock']) && item.status === MesWmReturnSalesStatusEnum.APPROVED
}

/** 是否可取消 */
function canCancel(item: WmReturnSalesVO) {
  return hasAccessByCodes(['mes:wm-return-sales:cancel'])
    && [
      MesWmReturnSalesStatusEnum.CONFIRMED,
      MesWmReturnSalesStatusEnum.APPROVING,
      MesWmReturnSalesStatusEnum.APPROVED,
    ].includes(item.status)
}

/** 是否存在行操作 */
function hasRowActions(item: WmReturnSalesVO) {
  return canUpdatePrepare(item)
    || canDeletePrepare(item)
    || canSubmitPrepare(item)
    || canQuality(item)
    || canFinish(item)
    || canStock(item)
    || canCancel(item)
}

/** 编辑 */
function handleEdit(item: WmReturnSalesVO) {
  uni.navigateTo({ url: `/pages-mes/wm/returnsales/form/index?id=${item.id}` })
}

/** 执行质检提示 */
function handleQuality() {
  uni.showModal({
    title: '执行质检',
    content: '请前往【质量管理 - 退货检验（RQC）】中进行退货检验操作。',
    showCancel: false,
  })
}

/** 执行退货 */
function handleFinish(item: WmReturnSalesVO) {
  uni.navigateTo({ url: `/pages-mes/wm/returnsales/form/index?id=${item.id}&mode=finish` })
}

/** 执行上架 */
function handleStock(item: WmReturnSalesVO) {
  uni.navigateTo({ url: `/pages-mes/wm/returnsales/form/index?id=${item.id}&mode=stock` })
}

/** 取消 */
function handleCancel(item: WmReturnSalesVO) {
  uni.navigateTo({ url: `/pages-mes/wm/returnsales/form/index?id=${item.id}&mode=cancel` })
}

/** 删除 */
async function handleDelete(item: WmReturnSalesVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.code || item.name || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteReturnSales(item.id)
  toast.success('删除成功')
  reload()
}

/** 提交销售退货单 */
async function handleSubmitReturnSales(item: WmReturnSalesVO) {
  if (submitting.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该销售退货单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitReturnSales(item.id)
    toast.success('提交成功')
    reload()
  } finally {
    submitting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:returnsales:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:returnsales:reload', reload)
})
</script>
