<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 库存台账管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 库存列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无库存台账数据"
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
                  {{ item.itemCode || '-' }}
                </view>
                <view class="mt-4rpx truncate text-24rpx text-[#999]">
                  {{ item.itemName || '-' }}
                </view>
              </view>
              <view
                class="shrink-0 rounded-999rpx px-16rpx py-6rpx text-24rpx"
                :class="item.frozen ? 'bg-[#fff1f0] text-[#f5222d]' : 'bg-[#f6ffed] text-[#52c41a]'"
              >
                {{ item.frozen ? '已冻结' : '可用' }}
              </view>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">规格：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">在库数量：</text>
              <text class="min-w-0 flex-1 truncate font-semibold">
                {{ item.quantity ?? '-' }} {{ item.unitMeasureName || '' }}
              </text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">批次号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">库存位置：</text>
              <text class="min-w-0 flex-1 truncate">{{ stockPlaceText(item) }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">入库日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDate(item.receiptTime) || '-' }}</text>
            </view>
          </view>
          <view
            v-if="hasAccessByCodes(['mes:wm-material-stock:update'])"
            class="border-t border-t-[#f0f0f0] py-18rpx text-center text-28rpx"
            :class="item.frozen ? 'text-[#52c41a]' : 'text-[#faad14]'"
            @click.stop="handleFrozenChange(item)"
          >
            {{ item.frozen ? '解除冻结' : '冻结库存' }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { WmMaterialStockQueryParams, WmMaterialStockVO } from '@/api/mes/wm/materialstock'
import { onUnload } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getMaterialStockPage, updateMaterialStockFrozen } from '@/api/mes/wm/materialstock'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const list = ref<WmMaterialStockVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmMaterialStockVO>>() // 分页组件引用
const queryParams = ref<WmMaterialStockQueryParams>({}) // 查询参数
const frozenLoadingId = ref<number>() // 冻结操作中的库存编号

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
    const data = await getMaterialStockPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: WmMaterialStockQueryParams) {
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

/** 查看详情 */
function handleDetail(item: WmMaterialStockVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/materialstock/detail/index?id=${item.id}`,
  })
}

/** 库存位置展示 */
function stockPlaceText(item: WmMaterialStockVO) {
  return [
    item.warehouseName,
    item.locationName,
    item.areaName,
  ].filter(Boolean).join(' / ') || '-'
}

/** 冻结状态切换 */
async function handleFrozenChange(item: WmMaterialStockVO) {
  if (frozenLoadingId.value) {
    return
  }
  const targetFrozen = !item.frozen
  const actionText = targetFrozen ? '冻结' : '解冻'
  const { confirm } = await uni.showModal({
    title: `${actionText}确认`,
    content: `确定要${actionText}该库存记录吗？`,
  })
  if (!confirm) {
    return
  }
  frozenLoadingId.value = item.id
  try {
    await updateMaterialStockFrozen({ id: item.id, frozen: targetFrozen })
    toast.success(`${actionText}成功`)
    item.frozen = targetFrozen
    uni.$emit('mes:wm:materialstock:reload')
  } finally {
    frozenLoadingId.value = undefined
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:materialstock:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:materialstock:reload', reload)
})
</script>
