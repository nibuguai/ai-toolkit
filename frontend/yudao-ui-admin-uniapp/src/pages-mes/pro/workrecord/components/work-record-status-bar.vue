<template>
  <view class="bg-white px-24rpx py-20rpx">
    <view class="rounded-16rpx bg-[#f6f9ff] p-24rpx">
      <view class="mb-12rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1">
          <view class="text-30rpx text-[#333] font-semibold">
            {{ isClockIn ? '当前已上工' : '当前未上工' }}
          </view>
          <view class="mt-8rpx text-24rpx text-[#667085]">
            {{ statusDescription }}
          </view>
        </view>
        <wd-tag :type="isClockIn ? 'success' : 'warning'" plain>
          {{ isClockIn ? '上工中' : '待上工' }}
        </wd-tag>
      </view>

      <view v-if="isClockIn" class="mt-18rpx text-26rpx text-[#475467] space-y-8rpx">
        <view>工作站：{{ current?.workstationCode || '-' }} / {{ current?.workstationName || '-' }}</view>
        <view>上工时间：{{ formatDateTime(current?.clockInTime) || '-' }}</view>
      </view>

      <view v-if="hasAccessByCodes(['mes:pro-workrecord:clock'])" class="mt-20rpx">
        <wd-button
          v-if="isClockIn"
          :loading="submitting"

          plain block
          type="warning"
          @click="handleClockOut"
        >
          下工
        </wd-button>
        <wd-button
          v-else
          block
          type="primary"
          :loading="submitting"
          @click="openWorkstationSelector"
        >
          选择工作站上工
        </wd-button>
      </view>
    </view>

    <WorkstationSelector ref="workstationSelectorRef" @confirm="handleWorkstationConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { MdWorkstationVO } from '@/api/mes/md/workstation'
import type { ProWorkRecordVO } from '@/api/mes/pro/workrecord'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  clockInWorkRecord,
  clockOutWorkRecord,
  getMyWorkRecord,
} from '@/api/mes/pro/workrecord'
import { useAccess } from '@/hooks/useAccess'
import { formatDateTime } from '@/utils/date'
import WorkstationSelector from '@/pages-mes/pro/task/components/workstation-selector.vue'

const emit = defineEmits<{
  change: []
}>()

const MesProWorkRecordTypeEnum = {
  CLOCK_IN: 1,
  CLOCK_OUT: 2,
} as const

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const current = ref<ProWorkRecordVO | null>(null) // 当前上工状态
const loading = ref(false) // 状态加载中
const submitting = ref(false) // 上下工提交中
const workstationSelectorRef = ref<InstanceType<typeof WorkstationSelector>>() // 工作站选择器
const isClockIn = computed(() => current.value?.type === MesProWorkRecordTypeEnum.CLOCK_IN)
const statusDescription = computed(() => {
  if (loading.value) {
    return '正在读取当前工作站状态'
  }
  if (isClockIn.value) {
    return '完成现场作业后请及时下工'
  }
  return hasAccessByCodes(['mes:pro-workrecord:clock']) ? '请选择工作站开始本次作业' : '暂无上工记录'
})

/** 加载当前上工状态 */
async function loadCurrent() {
  loading.value = true
  try {
    current.value = await getMyWorkRecord()
  } finally {
    loading.value = false
  }
}

/** 打开工作站选择器 */
function openWorkstationSelector() {
  workstationSelectorRef.value?.open(current.value?.workstationId)
}

/** 确认选择工作站 */
async function handleWorkstationConfirm(item: MdWorkstationVO) {
  const { confirm } = await uni.showModal({
    title: '上工确认',
    content: `确定要在「${item.code || '-'} / ${item.name || '-'}」上工吗？`,
  })
  if (!confirm) {
    return
  }
  submitting.value = true
  try {
    await clockInWorkRecord(item.id)
    toast.success('上工成功')
    await loadCurrent()
    emit('change')
  } finally {
    submitting.value = false
  }
}

/** 下工操作 */
async function handleClockOut() {
  const { confirm } = await uni.showModal({
    title: '下工确认',
    content: '确定要结束当前上工状态吗？',
  })
  if (!confirm) {
    return
  }
  submitting.value = true
  try {
    await clockOutWorkRecord()
    toast.success('下工成功')
    await loadCurrent()
    emit('change')
  } finally {
    submitting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadCurrent()
})

defineExpose({ loadCurrent })
</script>
