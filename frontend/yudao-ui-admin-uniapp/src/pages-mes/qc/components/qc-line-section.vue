<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        检验项明细
      </view>
      <view v-if="total > 0" class="text-24rpx text-[#999]">
        共 {{ total }} 项
      </view>
    </view>

    <view v-if="loading" class="p-24rpx text-28rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="p-24rpx text-28rpx text-[#999]">
      暂无检验项明细
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
              {{ item.indicatorName || '-' }}
            </view>
            <view class="mt-6rpx truncate text-24rpx text-[#999]">
              {{ item.indicatorCode || '-' }}
            </view>
          </view>
          <dict-tag v-if="item.indicatorType != null" :type="DICT_TYPE.MES_INDICATOR_TYPE" :value="item.indicatorType" />
        </view>

        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">检测工具：</text>{{ item.tool || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">检测方法：</text>{{ item.checkMethod || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">标准值：</text>{{ formatValue(item.standardValue) }} {{ item.unitMeasureName || '' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">误差范围：</text>{{ formatValue(item.minThreshold) }} ~ {{ formatValue(item.maxThreshold) }}
        </view>
        <view class="grid grid-cols-3 gap-12rpx rounded-10rpx bg-white px-16rpx py-14rpx text-center">
          <view>
            <view class="text-22rpx text-[#999]">
              致命
            </view>
            <view class="mt-4rpx text-26rpx text-[#d93026] font-semibold">
              {{ formatValue(item.criticalQuantity) }}
            </view>
          </view>
          <view>
            <view class="text-22rpx text-[#999]">
              严重
            </view>
            <view class="mt-4rpx text-26rpx text-[#fa8c16] font-semibold">
              {{ formatValue(item.majorQuantity) }}
            </view>
          </view>
          <view>
            <view class="text-22rpx text-[#999]">
              轻微
            </view>
            <view class="mt-4rpx text-26rpx text-[#1677ff] font-semibold">
              {{ formatValue(item.minorQuantity) }}
            </view>
          </view>
        </view>
        <view v-if="item.remark" class="mt-10rpx text-24rpx text-[#999]">
          备注：{{ item.remark }}
        </view>
        <view class="mt-16rpx">
          <wd-button block size="small" variant="plain" @click="openDefectRecords(item)">
            缺陷记录
          </wd-button>
        </view>
      </view>

      <view v-if="list.length < total" class="pt-4rpx">
        <wd-button block size="small" :loading="loadingMore" variant="plain" @click="loadMore">
          加载更多
        </wd-button>
      </view>
    </view>

    <!-- 缺陷记录 -->
    <wd-popup
      v-model="defectVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 72vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-32rpx text-[#333] font-semibold">
              缺陷记录
            </view>
            <view class="mt-4rpx truncate text-24rpx text-[#999]">
              {{ currentLine?.indicatorName || '-' }}
            </view>
          </view>
          <wd-button size="small" variant="plain" @click="defectVisible = false">
            关闭
          </wd-button>
        </view>

        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <view v-if="defectLoading" class="p-24rpx text-28rpx text-[#999]">
            加载中...
          </view>
          <view v-else-if="defectList.length === 0" class="p-24rpx text-28rpx text-[#999]">
            暂无缺陷记录
          </view>
          <view v-else class="p-24rpx">
            <view
              v-for="record in defectList"
              :key="record.id"
              class="mb-20rpx rounded-12rpx bg-white p-20rpx last:mb-0"
            >
              <view class="mb-10rpx flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1 text-28rpx text-[#333] font-semibold">
                  {{ record.name || '-' }}
                </view>
                <dict-tag v-if="record.level != null" :type="DICT_TYPE.MES_DEFECT_LEVEL" :value="record.level" />
              </view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                <text class="text-[#999]">缺陷数量：</text>{{ formatValue(record.quantity) }}
              </view>
              <view class="mb-8rpx text-24rpx text-[#999]">
                备注：{{ record.remark || '-' }}
              </view>
              <view class="text-24rpx text-[#999]">
                创建时间：{{ formatDateTime(record.createTime) || '-' }}
              </view>
            </view>

            <view v-if="defectList.length < defectTotal" class="pt-4rpx">
              <wd-button block size="small" :loading="defectLoadingMore" variant="plain" @click="loadMoreDefects">
                加载更多
              </wd-button>
            </view>
          </view>
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { QcIqcLineVO } from '@/api/mes/qc/iqc/line'
import type { QcIpqcLineVO } from '@/api/mes/qc/ipqc/line'
import type { QcOqcLineVO } from '@/api/mes/qc/oqc/line'
import type { QcRqcLineVO } from '@/api/mes/qc/rqc/line'
import type { QcDefectRecordVO } from '@/api/mes/qc/defectrecord'
import { onMounted, ref, watch } from 'vue'
import { getDefectRecordPage } from '@/api/mes/qc/defectrecord'
import { getIqcLinePage } from '@/api/mes/qc/iqc/line'
import { getIpqcLinePage } from '@/api/mes/qc/ipqc/line'
import { getOqcLinePage } from '@/api/mes/qc/oqc/line'
import { getRqcLinePage } from '@/api/mes/qc/rqc/line'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

type QcLineType = 'iqc' | 'ipqc' | 'oqc' | 'rqc'
type QcLineItem = QcIqcLineVO | QcIpqcLineVO | QcOqcLineVO | QcRqcLineVO
type QcType = 1 | 2 | 3 | 4

const props = defineProps<{
  type: QcLineType
  orderId?: number
  qcType: QcType
}>()

const pageSize = 10
const pageNo = ref(1) // 当前页码
const total = ref(0) // 明细总数
const list = ref<QcLineItem[]>([]) // 检验项明细
const loading = ref(false) // 首屏加载状态
const loadingMore = ref(false) // 追加加载状态
const defectVisible = ref(false) // 缺陷弹层状态
const defectLoading = ref(false) // 缺陷首屏加载状态
const defectLoadingMore = ref(false) // 缺陷追加加载状态
const defectPageNo = ref(1) // 缺陷当前页码
const defectTotal = ref(0) // 缺陷总数
const currentLine = ref<QcLineItem>() // 当前检验项
const defectList = ref<QcDefectRecordVO[]>([]) // 缺陷记录

/** 加载明细 */
async function loadList(reset = true) {
  if (!props.orderId) {
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
    const data = await queryLinePage(pageNo.value)
    list.value = reset ? data.list : [...list.value, ...data.list]
    total.value = data.total
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

/** 查询对应检验单行 */
function queryLinePage(currentPage: number) {
  const baseParam = {
    pageNo: currentPage,
    pageSize,
  }
  if (props.type === 'iqc') {
    return getIqcLinePage({ ...baseParam, iqcId: props.orderId || 0 })
  }
  if (props.type === 'ipqc') {
    return getIpqcLinePage({ ...baseParam, ipqcId: props.orderId || 0 })
  }
  if (props.type === 'oqc') {
    return getOqcLinePage({ ...baseParam, oqcId: props.orderId || 0 })
  }
  return getRqcLinePage({ ...baseParam, rqcId: props.orderId || 0 })
}

/** 加载更多 */
async function loadMore() {
  if (list.value.length >= total.value || loadingMore.value) {
    return
  }
  pageNo.value += 1
  await loadList(false)
}

/** 打开缺陷记录 */
async function openDefectRecords(item: QcLineItem) {
  currentLine.value = item
  defectVisible.value = true
  await loadDefectRecords()
}

/** 加载缺陷记录 */
async function loadDefectRecords(reset = true) {
  if (!props.orderId || !currentLine.value?.id) {
    defectList.value = []
    defectTotal.value = 0
    return
  }
  if (reset) {
    defectPageNo.value = 1
    defectLoading.value = true
  } else {
    defectLoadingMore.value = true
  }

  try {
    const data = await getDefectRecordPage({
      pageNo: defectPageNo.value,
      pageSize,
      qcType: props.qcType,
      qcId: props.orderId,
      lineId: currentLine.value.id,
    })
    defectList.value = reset ? data.list : [...defectList.value, ...data.list]
    defectTotal.value = data.total
  } finally {
    defectLoading.value = false
    defectLoadingMore.value = false
  }
}

/** 加载更多缺陷记录 */
async function loadMoreDefects() {
  if (defectList.value.length >= defectTotal.value || defectLoadingMore.value) {
    return
  }
  defectPageNo.value += 1
  await loadDefectRecords(false)
}

/** 格式化展示值 */
function formatValue(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return String(value)
}

watch(
  () => props.orderId,
  () => loadList(),
)

onMounted(() => {
  loadList()
})

defineExpose({ loadList })
</script>
