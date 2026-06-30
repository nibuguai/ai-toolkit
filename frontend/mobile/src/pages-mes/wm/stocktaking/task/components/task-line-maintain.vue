<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        盘点清单
      </view>
      <view
        v-if="editable"
        class="border border-[#1677ff] rounded-8rpx px-20rpx py-8rpx text-24rpx text-[#1677ff]"
        @click.stop="openStockSelector"
      >
        添加物料
      </view>
      <view v-else class="text-24rpx text-[#999]">
        只读
      </view>
    </view>
    <view v-if="loading" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      暂无盘点清单
    </view>
    <view v-else class="px-24rpx py-8rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
      >
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333] font-medium">
              {{ item.itemCode || '-' }}
            </view>
            <view class="mt-4rpx truncate text-26rpx text-[#666]">
              {{ item.itemName || '-' }}
            </view>
          </view>
          <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_STOCK_TAKING_LINE_STATUS" :value="item.status" />
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">单位：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.unitMeasureName || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">批次：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">在库数量：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
        </view>
        <view class="flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">库存位置：</text>
          <text class="min-w-0 flex-1 truncate">
            {{ item.warehouseName || '-' }} / {{ item.locationName || '-' }} / {{ item.areaName || '-' }}
          </text>
        </view>
        <view
          v-if="editable"
          class="mt-16rpx border-t border-t-[#f0f0f0] pt-16rpx text-center text-26rpx text-[#f56c6c]"
          @click.stop="handleDeleteLine(item)"
        >
          删除
        </view>
      </view>
    </view>
  </view>

  <MaterialStockSelector ref="stockSelectorRef" @confirm="handleStockConfirm" />
</template>

<script lang="ts" setup>
import type { WmMaterialStockVO } from '@/api/mes/wm/materialstock'
import type { StockTakingTaskLineVO } from '@/api/mes/wm/stocktaking/task/line'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref, watch } from 'vue'
import {
  createStockTakingTaskLine,
  deleteStockTakingTaskLine,
  getStockTakingTaskLinePage,
} from '@/api/mes/wm/stocktaking/task/line'
import { DICT_TYPE } from '@/utils/constants'
import MaterialStockSelector from './material-stock-selector.vue'

const props = defineProps<{
  editable?: boolean
  taskId?: number
}>()

const toast = useToast()
const list = ref<StockTakingTaskLineVO[]>([]) // 清单数据
const loading = ref(false) // 加载状态
const stockSelectorRef = ref<InstanceType<typeof MaterialStockSelector>>() // 库存选择器

/** 加载盘点清单 */
async function loadList() {
  if (!props.taskId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getStockTakingTaskLinePage({
      pageNo: 1,
      pageSize: 100,
      taskId: props.taskId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 打开库存选择 */
function openStockSelector() {
  if (!props.taskId) {
    return
  }
  stockSelectorRef.value?.open()
}

/** 确认库存选择 */
async function handleStockConfirm(rows: WmMaterialStockVO[]) {
  if (!props.taskId || rows.length === 0) {
    return
  }
  loading.value = true
  try {
    for (const stock of rows) {
      await createStockTakingTaskLine({
        taskId: props.taskId,
        materialStockId: stock.id,
        itemId: stock.itemId,
        batchId: stock.batchId,
        quantity: stock.quantity,
        warehouseId: stock.warehouseId,
        locationId: stock.locationId,
        areaId: stock.areaId,
      })
    }
    toast.success(`成功添加 ${rows.length} 条盘点清单`)
    await loadList()
  } finally {
    loading.value = false
  }
}

/** 删除盘点行 */
async function handleDeleteLine(item: StockTakingTaskLineVO) {
  if (!item.id) {
    return
  }
  const { confirm } = await uni.showModal({
    title: '删除确认',
    content: `确定要删除盘点清单「${item.itemCode || item.itemName || item.id}」吗？`,
  })
  if (!confirm) {
    return
  }
  await deleteStockTakingTaskLine(item.id)
  toast.success('删除成功')
  await loadList()
}

watch(() => props.taskId, loadList)

/** 初始化 */
onMounted(() => {
  loadList()
})

defineExpose({
  loadList,
})
</script>
