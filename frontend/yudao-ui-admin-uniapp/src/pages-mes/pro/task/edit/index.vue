<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="排产列表式编辑" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 任务列表 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-24rpx text-[#8a5a00]">
        PC 端支持甘特图拖拽编辑；移动端本轮采用列表式编辑，点击生产任务进入时间和数量维护。
      </view>
      <view v-if="loading" class="py-100rpx text-center text-26rpx text-[#999]">
        加载中...
      </view>
      <view v-else-if="taskRows.length === 0" class="py-100rpx text-center">
        <wd-empty icon="content" tip="暂无生产任务" />
      </view>
      <view v-else class="p-24rpx">
        <view
          v-for="item in taskRows"
          :key="item.originalId || item.id"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleEdit(item)"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-30rpx text-[#333] font-semibold">
                {{ item.text || '-' }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ item.process || item.workstation || '生产任务' }}
              </view>
            </view>
            <view class="h-28rpx w-28rpx rounded-full" :style="{ backgroundColor: item.colorCode || item.color || '#1677ff' }" />
          </view>
          <view class="text-26rpx text-[#666] space-y-8rpx">
            <view>工作站：{{ item.workstation || '-' }}</view>
            <view>开始：{{ formatDateTime(item.startDate) || '-' }}</view>
            <view>结束：{{ formatDateTime(item.endDate) || '-' }}</view>
            <view>时长：{{ item.duration ?? '-' }}</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { ProTaskGanttVO } from '@/api/mes/pro/task'
import { computed, onMounted, ref } from 'vue'
import { getGanttTaskList } from '@/api/mes/pro/task'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

const BarcodeBizTypeEnum = {
  TASK: 303,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const loading = ref(false) // 列表加载状态
const ganttTasks = ref<ProTaskGanttVO[]>([]) // 甘特任务数据
const taskRows = computed(() =>
  ganttTasks.value.filter(item => item.type === BarcodeBizTypeEnum.TASK || item.type === 'task' || item.originalId),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/task/index')
}

/** 加载甘特任务 */
async function getList() {
  loading.value = true
  try {
    ganttTasks.value = await getGanttTaskList({})
  } finally {
    loading.value = false
  }
}

/** 编辑任务 */
function handleEdit(item: ProTaskGanttVO) {
  const taskId = item.originalId || Number(item.id)
  if (!taskId) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/pro/task/form/index?id=${taskId}` })
}

onMounted(() => {
  getList()
})
</script>
