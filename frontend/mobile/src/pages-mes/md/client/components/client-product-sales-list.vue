<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view>
        <view class="text-30rpx text-[#333] font-semibold">
          销售出库记录
        </view>
        <view class="mt-6rpx text-24rpx text-[#999]">
          共 {{ total }} 条
        </view>
      </view>
      <view class="text-24rpx text-[#999]">
        只读
      </view>
    </view>

    <view v-if="loading && list.length === 0" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      暂无销售出库记录
    </view>
    <view v-else class="px-24rpx py-8rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
      >
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#1677ff] font-medium" @click="handleDetail(item)">
              {{ item.code || `出库单 #${item.id}` }}
            </view>
            <view class="mt-4rpx truncate text-26rpx text-[#666]">
              {{ item.name || '-' }}
            </view>
          </view>
          <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_PRODUCT_SALES_STATUS" :value="item.status" />
          <text v-else class="shrink-0 text-24rpx text-[#999]">-</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">销售订单：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.salesOrderCode || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">出库日期：</text>
          <text class="min-w-0 flex-1 truncate">{{ formatDate(item.salesDate || item.shipmentDate) || '-' }}</text>
        </view>
        <view class="flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">创建时间：</text>
          <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.createTime) || '-' }}</text>
        </view>
      </view>

      <view v-if="hasMore" class="py-20rpx text-center text-26rpx text-[#1677ff]" @click="loadMore">
        {{ loading ? '加载中...' : '加载更多' }}
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmProductSalesVO } from '@/api/mes/wm/productsales'
import { ref, watch } from 'vue'
import { getProductSalesPage } from '@/api/mes/wm/productsales'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'

const props = defineProps<{
  clientId?: number
}>()

const list = ref<WmProductSalesVO[]>([]) // 销售出库单
const total = ref(0) // 总条数
const pageNo = ref(1) // 当前页码
const pageSize = 5 // 移动端详情页内每次加载条数
const loading = ref(false) // 加载状态
const hasMore = ref(false) // 是否还有更多

/** 查询销售出库记录 */
async function getList(reset = true) {
  if (!props.clientId || loading.value) {
    return
  }
  loading.value = true
  try {
    if (reset) {
      pageNo.value = 1
      list.value = []
    }
    const data = await getProductSalesPage({
      pageNo: pageNo.value,
      pageSize,
      clientId: props.clientId,
    })
    list.value = reset ? data.list : [...list.value, ...data.list]
    total.value = data.total
    hasMore.value = list.value.length < total.value
  } finally {
    loading.value = false
  }
}

/** 加载更多 */
function loadMore() {
  if (!hasMore.value || loading.value) {
    return
  }
  pageNo.value += 1
  getList(false)
}

/** 查看销售出库详情 */
function handleDetail(item: WmProductSalesVO) {
  uni.navigateTo({ url: `/pages-mes/wm/productsales/detail/index?id=${item.id}` })
}

watch(
  () => props.clientId,
  () => getList(true),
  { immediate: true },
)
</script>
