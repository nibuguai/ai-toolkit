<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 维修工单管理"
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
      empty-view-text="暂无维修工单数据"
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
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_DV_REPAIR_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">设备编码：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.machineryCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">设备名称：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.machineryName || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">报修日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.requireDate) || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">维修完成：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.finishDate) || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">维修人员：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.acceptedUserNickname || '-' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">维修结果：</text>
              <dict-tag v-if="item.result != null" :type="DICT_TYPE.MES_DV_REPAIR_RESULT" :value="item.result" />
              <text v-else>-</text>
            </view>
          </view>
          <view v-if="hasRowActions(item)" class="flex border-t border-t-[#f0f0f0] text-28rpx" @click.stop>
            <view v-if="canUpdatePrepare(item)" class="flex-1 py-18rpx text-center text-[#1677ff]" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="canDeletePrepare(item)" class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </view>
            <view v-if="canConfirmRepair(item)" class="flex-1 py-18rpx text-center text-[#52c41a]" @click="handleConfirm(item)">
              完成维修
            </view>
            <view v-if="canFinishRepair(item)" class="flex-1 py-18rpx text-center text-[#52c41a]" @click="handleFinish(item)">
              验收
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:dv-repair:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { DvRepairQueryParams, DvRepairVO } from '@/api/mes/dv/repair'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteRepair, getRepairPage } from '@/api/mes/dv/repair'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesDvRepairStatusEnum } from '@/utils/constants'
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
const list = ref<DvRepairVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<DvRepairVO>>() // 分页组件引用
const queryParams = ref<DvRepairQueryParams>({}) // 查询参数

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
    const data = await getRepairPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: DvRepairQueryParams) {
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
    url: '/pages-mes/dv/repair/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: DvRepairVO) {
  uni.navigateTo({
    url: `/pages-mes/dv/repair/detail/index?id=${item.id}`,
  })
}

/** 是否可编辑草稿 */
function canUpdatePrepare(item: DvRepairVO) {
  return hasAccessByCodes(['mes:dv-repair:update']) && item.status === MesDvRepairStatusEnum.PREPARE
}

/** 是否可删除草稿 */
function canDeletePrepare(item: DvRepairVO) {
  return hasAccessByCodes(['mes:dv-repair:delete']) && item.status === MesDvRepairStatusEnum.PREPARE
}

/** 是否可完成维修 */
function canConfirmRepair(item: DvRepairVO) {
  return hasAccessByCodes(['mes:dv-repair:update']) && item.status === MesDvRepairStatusEnum.CONFIRMED
}

/** 是否可验收 */
function canFinishRepair(item: DvRepairVO) {
  return hasAccessByCodes(['mes:dv-repair:update']) && item.status === MesDvRepairStatusEnum.APPROVING
}

/** 是否显示行操作 */
function hasRowActions(item: DvRepairVO) {
  return canUpdatePrepare(item) || canDeletePrepare(item) || canConfirmRepair(item) || canFinishRepair(item)
}

/** 编辑 */
function handleEdit(item: DvRepairVO) {
  uni.navigateTo({
    url: `/pages-mes/dv/repair/form/index?id=${item.id}`,
  })
}

/** 删除 */
async function handleDelete(item: DvRepairVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.code || item.name || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteRepair(item.id)
  toast.success('删除成功')
  reload()
}

/** 完成维修 */
function handleConfirm(item: DvRepairVO) {
  uni.navigateTo({
    url: `/pages-mes/dv/repair/form/index?id=${item.id}&mode=confirm`,
  })
}

/** 验收 */
function handleFinish(item: DvRepairVO) {
  uni.navigateTo({
    url: `/pages-mes/dv/repair/form/index?id=${item.id}&mode=finish`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:dv:repair:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:dv:repair:reload', reload)
})
</script>
