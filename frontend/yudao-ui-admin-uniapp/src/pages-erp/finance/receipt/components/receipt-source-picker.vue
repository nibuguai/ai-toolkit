<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="visible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-button size="small" type="primary" :disabled="selectedRows.length === 0" @click="handleConfirm">
          确定{{ selectedRows.length ? `(${selectedRows.length})` : '' }}
        </wd-button>
      </view>

      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.no" :placeholder="`请输入${sourceLabel}单号`" clearable />
        <ErpPicker v-model="queryParams.productId" class="mt-12rpx" source="product" form-item placeholder="请选择产品" />
        <yd-search-date-range v-model="queryParams.time" class="mt-12rpx" :label="timeLabel" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">
            搜索
          </wd-button>
        </view>
      </view>

      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation @scrolltolower="handleLoadMore">
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="isSelected(item) ? 'ring-2 ring-[#1677ff]' : ''"
            @click="toggleSelect(item)"
          >
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ item.no || '-' }}
              </view>
              <text v-if="isSelected(item)" class="shrink-0 text-24rpx text-[#1677ff]">已选择</text>
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">客户：</text>{{ item.customerName || '-' }}
            </view>
            <view v-if="item.productNames" class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">产品：</text>
              <text class="line-clamp-1">{{ item.productNames }}</text>
            </view>
            <view class="mb-8rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">{{ timeLabel }}：</text>{{ formatDateTime(item[timeField]) || '-' }}
            </view>
            <view class="flex text-26rpx text-[#666]">
              <view class="flex-1">
                <text class="mr-8rpx text-[#999]">{{ totalLabel }}：</text>{{ formatMoney(item.totalPrice) }}
              </view>
              <view class="flex-1">
                <text class="mr-8rpx text-[#999]">{{ receivedLabel }}：</text>{{ formatMoney(item[receivedField]) }}
              </view>
            </view>
          </view>
          <view v-if="!loading && list.length === 0" class="py-80rpx text-center">
            <wd-empty icon="content" :tip="`暂无可选择${sourceLabel}`" />
          </view>
          <view v-if="loading" class="py-24rpx text-center text-26rpx text-[#999]">
            加载中...
          </view>
          <view v-else-if="finished && list.length > 0" class="py-24rpx text-center text-26rpx text-[#999]">
            没有更多了
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getSaleOutPage } from '@/api/erp/sale/out'
import { getSaleReturnPage } from '@/api/erp/sale/return'
import { formatDateRange, formatDateTime } from '@/utils/date'
import ErpPicker from '@/pages-erp/components/erp-picker.vue'
import { formatMoney } from '@/pages-erp/utils/erp'

type SourceType = 'sale-out' | 'sale-return'

const props = defineProps<{
  source: SourceType
}>()

const emit = defineEmits<{
  success: [rows: Record<string, any>[]]
}>()

const visible = ref(false)
const loading = ref(false)
const finished = ref(false)
const pageNo = ref(1)
const pageSize = 10
const total = ref(0)
const customerId = ref<number>()
const list = ref<Record<string, any>[]>([])
const selectedRows = ref<Record<string, any>[]>([])
const queryParams = reactive({
  no: undefined as string | undefined,
  productId: undefined as number | undefined,
  time: [undefined, undefined] as [number | undefined, number | undefined],
})

const isSaleOut = computed(() => props.source === 'sale-out')
const title = computed(() => isSaleOut.value ? '选择销售出库（仅展示可收款）' : '选择销售退货（仅展示可退款）')
const sourceLabel = computed(() => isSaleOut.value ? '销售出库' : '销售退货')
const timeField = computed(() => isSaleOut.value ? 'outTime' : 'returnTime')
const timeLabel = computed(() => isSaleOut.value ? '出库时间' : '退货时间')
const receivedField = computed(() => isSaleOut.value ? 'receiptPrice' : 'refundPrice')
const receivedLabel = computed(() => isSaleOut.value ? '已收金额' : '已退金额')
const totalLabel = computed(() => isSaleOut.value ? '应收金额' : '应退金额')

function isSelected(item: Record<string, any>) {
  return selectedRows.value.some(row => String(row.id) === String(item.id))
}

function toggleSelect(item: Record<string, any>) {
  if (isSelected(item)) {
    selectedRows.value = selectedRows.value.filter(row => String(row.id) !== String(item.id))
  } else {
    selectedRows.value.push(item)
  }
}

/** 查询可选单据列表 */
async function queryList(reset = false) {
  if (loading.value) {
    return
  }
  if (reset) {
    pageNo.value = 1
    list.value = []
    selectedRows.value = []
    finished.value = false
  }
  if (finished.value) {
    return
  }
  loading.value = true
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize,
      no: queryParams.no || undefined,
      productId: queryParams.productId,
      customerId: customerId.value,
      [timeField.value]: formatDateRange(queryParams.time),
      ...(isSaleOut.value ? { receiptEnable: true } : { refundEnable: true }),
    }
    const data = isSaleOut.value ? await getSaleOutPage(params) : await getSaleReturnPage(params)
    list.value = reset ? data.list : list.value.concat(data.list)
    total.value = data.total
    finished.value = list.value.length >= total.value
    pageNo.value += 1
  } finally {
    loading.value = false
  }
}

async function open(nextCustomerId: number) {
  customerId.value = nextCustomerId
  visible.value = true
  await queryList(true)
}

function handleSearch() {
  queryList(true)
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.no = undefined
  queryParams.productId = undefined
  queryParams.time = [undefined, undefined]
  queryList(true)
}

function handleLoadMore() {
  queryList()
}

function handleConfirm() {
  emit('success', selectedRows.value)
  visible.value = false
}

defineExpose({ open })
</script>
