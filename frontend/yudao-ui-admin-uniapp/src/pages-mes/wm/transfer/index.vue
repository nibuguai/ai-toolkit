<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 库存调拨管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 顶部操作 -->
    <view class="bg-white px-24rpx py-16rpx">
      <view class="grid grid-cols-2 gap-16rpx">
        <wd-button
          v-if="hasAccessByCodes(['mes:wm-transfer:create'])"
          block variant="plain" @click="handleAdd"
        >
          新增转移单
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
      empty-view-text="暂无库存调拨数据"
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
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_TRANSFER_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">转移单名称：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.name || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">转移单类型：</text>
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_WM_TRANSFER_TYPE" :value="item.type" />
              <text v-else>-</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">是否配送：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.deliveryFlag ? '是' : '否' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">是否确认：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.confirmFlag ? '是' : '否' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">转移日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDate(item.transferDate) || '-' }}</text>
            </view>
          </view>
          <view v-if="hasRowActions(item)" class="flex flex-wrap border-t border-t-[#f0f0f0] text-28rpx" @click.stop>
            <view v-if="canUpdatePrepare(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#1677ff]" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="canDeletePrepare(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </view>
            <view v-if="canSubmitPrepare(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#faad14]" @click="handleSubmitTransfer(item)">
              提交
            </view>
            <view v-if="canConfirm(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#52c41a]" @click="handleConfirm(item)">
              到货确认
            </view>
            <view v-if="canStock(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#52c41a]" @click="handleStock(item)">
              执行上架
            </view>
            <view v-if="canFinish(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#52c41a]" @click="handleFinish(item)">
              执行转移
            </view>
            <view v-if="canCancel(item)" class="min-w-160rpx flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleCancel(item)">
              取消
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { WmTransferQueryParams, WmTransferVO } from '@/api/mes/wm/transfer'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  cancelTransfer,
  deleteTransfer,
  getTransferPage,
  submitTransfer,
} from '@/api/mes/wm/transfer'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmTransferStatusEnum } from '@/utils/constants'
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
const list = ref<WmTransferVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmTransferVO>>() // 分页组件引用
const queryParams = ref<WmTransferQueryParams>({}) // 查询参数

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
    const data = await getTransferPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: WmTransferQueryParams) {
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
    url: '/pages-mes/wm/transfer/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: WmTransferVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/transfer/detail/index?id=${item.id}`,
  })
}

/** 是否可编辑草稿 */
function canUpdatePrepare(item: WmTransferVO) {
  return hasAccessByCodes(['mes:wm-transfer:update']) && item.status === MesWmTransferStatusEnum.PREPARE
}

/** 是否可删除草稿 */
function canDeletePrepare(item: WmTransferVO) {
  return hasAccessByCodes(['mes:wm-transfer:delete']) && item.status === MesWmTransferStatusEnum.PREPARE
}

/** 是否可提交草稿 */
function canSubmitPrepare(item: WmTransferVO) {
  return hasAccessByCodes(['mes:wm-transfer:update']) && item.status === MesWmTransferStatusEnum.PREPARE
}

/** 是否可到货确认 */
function canConfirm(item: WmTransferVO) {
  return hasAccessByCodes(['mes:wm-transfer:update']) && item.status === MesWmTransferStatusEnum.UNCONFIRMED
}

/** 是否可执行上架 */
function canStock(item: WmTransferVO) {
  return hasAccessByCodes(['mes:wm-transfer:update']) && item.status === MesWmTransferStatusEnum.APPROVING
}

/** 是否可执行转移 */
function canFinish(item: WmTransferVO) {
  return hasAccessByCodes(['mes:wm-transfer:finish']) && item.status === MesWmTransferStatusEnum.APPROVED
}

/** 是否可取消 */
function canCancel(item: WmTransferVO) {
  return hasAccessByCodes(['mes:wm-transfer:update'])
    && [
      MesWmTransferStatusEnum.UNCONFIRMED,
      MesWmTransferStatusEnum.APPROVING,
      MesWmTransferStatusEnum.APPROVED,
    ].includes(item.status)
}

/** 是否存在行操作 */
function hasRowActions(item: WmTransferVO) {
  return canUpdatePrepare(item)
    || canDeletePrepare(item)
    || canSubmitPrepare(item)
    || canConfirm(item)
    || canStock(item)
    || canFinish(item)
    || canCancel(item)
}

/** 编辑 */
function handleEdit(item: WmTransferVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/transfer/form/index?id=${item.id}`,
  })
}

/** 到货确认 */
function handleConfirm(item: WmTransferVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/transfer/form/index?id=${item.id}&mode=confirm`,
  })
}

/** 执行上架 */
function handleStock(item: WmTransferVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/transfer/form/index?id=${item.id}&mode=stock`,
  })
}

/** 执行转移 */
function handleFinish(item: WmTransferVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/transfer/form/index?id=${item.id}&mode=finish`,
  })
}

/** 删除 */
async function handleDelete(item: WmTransferVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.code || item.name || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteTransfer(item.id)
  toast.success('删除成功')
  reload()
}

/** 提交 */
async function handleSubmitTransfer(item: WmTransferVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该转移单？提交前请确认已维护调拨物料，提交后将不能修改。',
    })
  } catch {
    return
  }
  await submitTransfer(item.id)
  toast.success('提交成功')
  reload()
}

/** 取消 */
async function handleCancel(item: WmTransferVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该转移单？取消后不可恢复。',
    })
  } catch {
    return
  }
  await cancelTransfer(item.id)
  toast.success('取消成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:transfer:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:transfer:reload', reload)
})
</script>
