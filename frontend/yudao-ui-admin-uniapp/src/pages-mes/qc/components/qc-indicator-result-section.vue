<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        检测结果记录
      </view>
      <view v-if="total > 0" class="text-24rpx text-[#999]">
        共 {{ total }} 条
      </view>
    </view>

    <view v-if="loading" class="p-24rpx text-28rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="p-24rpx text-28rpx text-[#999]">
      暂无检测结果记录
    </view>
    <view v-else class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-20rpx rounded-12rpx bg-[#f8f9fb] p-20rpx last:mb-0"
      >
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333] font-semibold">
              {{ item.code || '-' }}
            </view>
            <view class="mt-6rpx truncate text-24rpx text-[#999]">
              物资SN：{{ item.sn || '-' }}
            </view>
          </view>
          <wd-button size="small" variant="plain" @click="openDetail(item)">
            查看检测值
          </wd-button>
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">备注：</text>{{ item.remark || '-' }}
        </view>
        <view class="text-24rpx text-[#999]">
          创建时间：{{ formatDateTime(item.createTime) || '-' }}
        </view>
      </view>

      <view v-if="list.length < total" class="pt-4rpx">
        <wd-button block size="small" :loading="loadingMore" variant="plain" @click="loadMore">
          加载更多
        </wd-button>
      </view>
    </view>

    <!-- 检测值明细 -->
    <wd-popup
      v-model="detailVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 78vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-32rpx text-[#333] font-semibold">
              {{ currentResult?.code || '检测值明细' }}
            </view>
            <view class="mt-4rpx truncate text-24rpx text-[#999]">
              物资SN：{{ currentResult?.sn || '-' }}
            </view>
          </view>
          <wd-button size="small" variant="plain" @click="detailVisible = false">
            关闭
          </wd-button>
        </view>

        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <view v-if="detailLoading" class="p-24rpx text-28rpx text-[#999]">
            加载中...
          </view>
          <view v-else-if="detailItems.length === 0" class="p-24rpx text-28rpx text-[#999]">
            暂无检测值
          </view>
          <view v-else class="p-24rpx">
            <view
              v-for="item in detailItems"
              :key="item.indicatorId || item.id"
              class="mb-20rpx rounded-12rpx bg-white p-20rpx last:mb-0"
            >
              <view class="mb-10rpx flex items-center justify-between gap-16rpx">
                <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-semibold">
                  {{ item.indicatorName || '-' }}
                </view>
                <dict-tag v-if="item.valueType != null" :type="DICT_TYPE.MES_QC_RESULT_TYPE" :value="item.valueType" />
              </view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                <text class="text-[#999]">检测值：</text>{{ formatResultValue(item) }}
              </view>
              <view v-if="item.valueSpecification" class="mb-8rpx text-24rpx text-[#999]">
                值属性：{{ item.valueSpecification }}
              </view>
              <view class="text-24rpx text-[#999]">
                备注：{{ item.remark || '-' }}
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { QcIndicatorResultDetailVO, QcIndicatorResultVO } from '@/api/mes/qc/indicatorresult'
import { ref, watch } from 'vue'
import { getDetail, getResultPage } from '@/api/mes/qc/indicatorresult'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

type QcType = 1 | 2 | 3 | 4

const props = defineProps<{
  qcId?: number
  qcType: QcType
}>()

const pageSize = 10
const pageNo = ref(1) // 当前页码
const total = ref(0) // 结果总数
const list = ref<QcIndicatorResultVO[]>([]) // 检测结果记录
const loading = ref(false) // 首屏加载状态
const loadingMore = ref(false) // 追加加载状态
const detailVisible = ref(false) // 明细弹层状态
const detailLoading = ref(false) // 明细加载状态
const currentResult = ref<QcIndicatorResultVO>() // 当前结果
const detailItems = ref<QcIndicatorResultDetailVO[]>([]) // 检测值明细

/** 加载检测结果 */
async function loadList(reset = true) {
  if (!props.qcId) {
    list.value = []
    total.value = 0
    return
  }
  if (reset) {
    pageNo.value = 1
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const data = await getResultPage({
      pageNo: pageNo.value,
      pageSize,
      qcId: props.qcId,
      qcType: props.qcType,
    })
    list.value = reset ? data.list : [...list.value, ...data.list]
    total.value = data.total
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

/** 加载更多 */
async function loadMore() {
  if (list.value.length >= total.value || loadingMore.value) {
    return
  }
  pageNo.value += 1
  await loadList(false)
}

/** 打开检测值明细 */
async function openDetail(item: QcIndicatorResultVO) {
  if (!props.qcId) {
    return
  }
  currentResult.value = item
  detailVisible.value = true
  detailLoading.value = true
  try {
    const data = await getDetail(props.qcId, props.qcType, item.id)
    detailItems.value = data.items || []
  } finally {
    detailLoading.value = false
  }
}

/** 格式化检测值 */
function formatResultValue(item: QcIndicatorResultDetailVO) {
  if (item.value === undefined || item.value === null || item.value === '') {
    return '-'
  }
  return item.value
}

watch(
  () => [props.qcId, props.qcType],
  () => loadList(),
  { immediate: true },
)

defineExpose({ loadList })
</script>
