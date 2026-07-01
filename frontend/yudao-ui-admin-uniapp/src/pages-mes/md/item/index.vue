<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="物料产品" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <!-- 搜索组件 -->
    <SearchForm ref="searchFormRef" @search="handleQuery" @reset="handleReset" />
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
      empty-view-text="暂无物料产品数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <ListCardWrapper
          v-for="item in list"
          :key="item.id"
          :item="item"
          :item-id="item.id!"
          :selecting="selecting"
          :selected="isSelected(item.id!)"
          :can-delete="canDelete"
          @click="handleDetail"
          @longpress="enterSelectMode"
          @toggle-select="toggleSelect"
          @swipe-delete="handleSwipeDelete"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.code || '-' }}
              </view>
              <view
                class="flex shrink-0 items-center gap-12rpx"
                @click="handleStatusClick($event, item)"
              >
                <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
                <view
                  v-if="hasAccessByCodes(['mes:md-item:update'])"
                  class="rounded-8rpx bg-[#1677ff] px-16rpx py-8rpx text-24rpx text-white"
                  :class="statusTogglingId !== undefined ? 'opacity-60' : ''"
                >
                  {{ statusTogglingId === item.id ? '处理中...' : item.status === CommonStatusEnum.ENABLE ? '停用' : '启用' }}
                </view>
              </view>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">物料名称：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.name || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">单位：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.unitMeasureName || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">物料分类：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.itemTypeName || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">物料/产品：</text>
              <dict-tag v-if="item.itemOrProduct" :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="item.itemOrProduct" />
              <text v-else>-</text>
            </view>
            <view class="flex items-center justify-between text-24rpx text-[#999]">
              <view class="flex items-center gap-16rpx">
                <view class="flex items-center">
                  <text class="mr-4rpx">安全库存：</text>
                  <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(item.safeStockFlag)" />
                </view>
              </view>
              <text>{{ formatDateTime(item.createTime) || '-' }}</text>
            </view>
          </view>
        </ListCardWrapper>
      </view>
    </z-paging>

    <!-- 批量操作栏 -->
    <MesFooterActions v-if="selecting" content-class="flex items-center justify-between px-24rpx">
      <wd-button variant="plain" size="small" @click="exitSelectMode">
        取消
      </wd-button>
      <text class="text-28rpx text-[#666]">已选 {{ selectedIds.size }} 项</text>
      <wd-button type="danger" size="small" :loading="batchDeleting" :disabled="selectedIds.size === 0" @click="handleBatchDelete">
        删除
      </wd-button>
    </MesFooterActions>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:md-item:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MdItemQueryParams, MdItemVO } from '@/api/mes/md/item'
import type { ZPagingRef } from 'z-paging'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { deleteItem, getItemPage, updateItemStatus } from '@/api/mes/md/item'
import { useAccess } from '@/hooks/useAccess'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useMesBatchSelect } from '@/pages-mes/hooks/useMesBatchSelect'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ListCardWrapper from '@/pages-mes/components/list-card-wrapper.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const list = ref<MdItemVO[]>([]) // 列表数据
const statusTogglingId = ref<number>() // 正在切换状态的物料 ID
const pagingRef = ref<ZPagingRef<MdItemVO>>() // 分页组件引用
const queryParams = ref<MdItemQueryParams>({}) // 查询参数
const searchFormRef = ref<InstanceType<typeof SearchForm>>() // 搜索组件引用

const {
  selecting,
  selectedIds,
  batchDeleting,
  canDelete,
  isSelected,
  toggleSelect,
  enterSelectMode,
  exitSelectMode,
  handleSwipeDelete,
  handleBatchDelete,
} = useMesBatchSelect({
  permission: 'mes:md-item:delete',
  deleteApi: (ids: number[]) => Promise.all(ids.map(id => deleteItem(id))).then(() => {}),
  reloadEvent: 'mes:md:item:reload',
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = { ...queryParams.value, pageNo, pageSize }
    const data = await getItemPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data: MdItemQueryParams) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {}
  reload()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增 */
function handleAdd() {
  uni.navigateTo({ url: `/pages-mes/md/item/form/index` })
}

/** 切换物料状态 */
function handleStatusClick(event: Event, item: MdItemVO) {
  event.stopPropagation()
  if (hasAccessByCodes(['mes:md-item:update'])) {
    void handleStatusAction(item)
  }
}

/** 执行物料状态切换 */
async function handleStatusAction(item: MdItemVO) {
  if (statusTogglingId.value || !item.id) {
    return
  }
  const newStatus = item.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  const actionName = newStatus === CommonStatusEnum.ENABLE ? '启用' : '停用'
  const confirmed = await new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '提示',
      content: `确认要${actionName}「${item.name}」吗？`,
      success: result => resolve(result.confirm),
      fail: () => resolve(false),
    })
  })
  if (!confirmed) {
    return
  }
  statusTogglingId.value = item.id
  try {
    toast.loading(`${actionName}中...`)
    await updateItemStatus(item.id, newStatus)
    toast.close()
    toast.success(`${actionName}成功`)
    item.status = newStatus
  } catch {
    toast.close()
  } finally {
    statusTogglingId.value = undefined
  }
}

/** 查看详情 */
function handleDetail(item: MdItemVO) {
  uni.navigateTo({ url: `/pages-mes/md/item/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:md:item:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:md:item:reload', reload)
})
</script>
