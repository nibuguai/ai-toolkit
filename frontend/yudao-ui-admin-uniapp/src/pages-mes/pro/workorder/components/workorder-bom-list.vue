<template>
  <view class="mx-24rpx mt-24rpx">
    <view class="mb-16rpx flex items-center justify-between">
      <view class="text-30rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <wd-tag type="primary" plain>
        {{ list.length }} 条
      </wd-tag>
    </view>
    <view v-if="loading" class="rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999]">
      {{ emptyText }}
    </view>
    <view v-else>
      <view v-for="item in list" :key="item.id || item.itemId" class="mb-16rpx rounded-12rpx bg-white p-20rpx shadow-sm">
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333] font-semibold">
              {{ item.itemName || '-' }}
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              {{ item.itemCode || '-' }}
            </view>
          </view>
          <dict-tag v-if="item.itemOrProduct" :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="item.itemOrProduct" />
        </view>
        <view class="text-24rpx text-[#666] space-y-6rpx">
          <view>规格型号：{{ item.itemSpecification || '-' }}</view>
          <view>单位：{{ item.unitMeasureName || '-' }}</view>
          <view>{{ quantityLabel }}：{{ item.quantity ?? '-' }}</view>
          <view v-if="item.remark">
            备注：{{ item.remark }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProWorkOrderBomVO } from '@/api/mes/pro/workorder/bom'
import { onMounted, ref, watch } from 'vue'
import { getWorkOrderBomItemListByWorkOrderId, getWorkOrderBomPage } from '@/api/mes/pro/workorder/bom'
import { DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{
  workOrderId?: number
  mode?: 'bom' | 'item'
}>(), {
  workOrderId: undefined,
  mode: 'bom',
})

const title = props.mode === 'bom' ? '工单 BOM' : '物料需求'
const emptyText = props.mode === 'bom' ? '暂无工单 BOM' : '暂无物料需求'
const quantityLabel = props.mode === 'bom' ? '预计使用量' : '需求数量'
const loading = ref(false) // 列表加载状态
const list = ref<ProWorkOrderBomVO[]>([]) // 明细数据

/** 查询明细列表 */
async function getList() {
  if (!props.workOrderId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    if (props.mode === 'bom') {
      const data = await getWorkOrderBomPage({ pageNo: 1, pageSize: 100, workOrderId: props.workOrderId })
      list.value = data.list
    } else {
      list.value = await getWorkOrderBomItemListByWorkOrderId(props.workOrderId)
    }
  } finally {
    loading.value = false
  }
}

watch(() => props.workOrderId, getList)

onMounted(() => {
  getList()
})
</script>
