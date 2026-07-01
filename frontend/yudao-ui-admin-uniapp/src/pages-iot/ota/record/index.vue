<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="OTA 记录" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 统计信息 -->
    <view class="p-24rpx pb-0">
      <view class="grid grid-cols-3 gap-16rpx">
        <view v-for="item in statusOptions" :key="item.value" class="rounded-12rpx bg-white p-16rpx text-center shadow-sm" @click="handleStatus(item.value)">
          <view class="text-34rpx text-[#1677ff] font-semibold">{{ statistics[item.value] || 0 }}</view>
          <view class="mt-4rpx text-22rpx text-[#666]">{{ item.label }}</view>
        </view>
      </view>
    </view>

    <!-- 状态筛选 -->
    <view class="px-24rpx py-16rpx">
      <wd-radio-group v-model="currentStatus" type="button" @change="handleStatusChange">
        <wd-radio :value="-1">全部</wd-radio>
        <wd-radio v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</wd-radio>
      </wd-radio-group>
    </view>

    <!-- 分页列表 -->
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无升级记录数据" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 text-32rpx text-[#333] font-semibold">
              {{ item.deviceName || item.deviceId }}
            </view>
            <dict-tag :type="DICT_TYPE.IOT_OTA_TASK_RECORD_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">当前版本：</text>{{ item.currentVersion || item.fromFirmwareVersion || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">目标版本：</text>{{ item.firmwareVersion || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">升级进度：</text>{{ item.progress || 0 }}%
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">状态描述：</text>{{ item.description || '-' }}
          </view>
          <view class="flex items-center justify-between gap-16rpx">
            <text class="text-24rpx text-[#999]">{{ formatDateTime(item.updateTime) || '-' }}</text>
            <wd-button
              v-if="canCancel(item)"
              size="small"
              type="danger"
              variant="plain"
              :loading="cancelingId === item.id"
              @click="handleCancel(item)"
            >
              取消
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { OtaTaskRecord } from '@/api/iot/ota/task/record'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { cancelOtaTaskRecord, getOtaTaskRecordPage, getOtaTaskRecordStatusStatistics } from '@/api/iot/ota/task/record'
import { useAccess } from '@/hooks/useAccess'
import { IoTOtaTaskRecordStatusEnum } from '@/pages-iot/utils/constants'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ taskId?: number | any, firmwareId?: number | any }>()

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<OtaTaskRecord[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const statistics = ref<Record<string, number>>({}) // 状态统计
const currentStatus = ref(-1) // 当前状态筛选
const cancelingId = ref<number>() // 取消中的记录编号
const statusOptions = computed(() => Object.values(IoTOtaTaskRecordStatusEnum))
const inProcessStatuses: number[] = [
  IoTOtaTaskRecordStatusEnum.PENDING.value,
  IoTOtaTaskRecordStatusEnum.PUSHED.value,
  IoTOtaTaskRecordStatusEnum.UPGRADING.value,
]

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(props.taskId ? '/pages-iot/ota/task/index' : '/pages-iot/ota/firmware/index')
}

/** 查询状态统计 */
async function getStatistics() {
  statistics.value = await getOtaTaskRecordStatusStatistics(
    props.firmwareId ? Number(props.firmwareId) : undefined,
    props.taskId ? Number(props.taskId) : undefined,
  )
}

/** 查询升级记录 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getOtaTaskRecordPage({
      pageNo,
      pageSize,
      taskId: props.taskId ? Number(props.taskId) : undefined,
      firmwareId: props.firmwareId ? Number(props.firmwareId) : undefined,
      status: currentStatus.value === -1 ? undefined : currentStatus.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 是否允许取消记录 */
function canCancel(item: OtaTaskRecord) {
  return !!item.id && hasAccessByCodes(['iot:ota-task-record:cancel']) && inProcessStatuses.includes(Number(item.status))
}

/** 切换状态 */
function handleStatus(status: number) {
  currentStatus.value = status
  pagingRef.value?.reload()
}

/** 状态筛选变更 */
function handleStatusChange() {
  pagingRef.value?.reload()
}

/** 取消升级记录 */
async function handleCancel(item: OtaTaskRecord) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要取消该设备的升级任务吗？' })
  } catch {
    return
  }
  cancelingId.value = item.id
  try {
    await cancelOtaTaskRecord(item.id)
    toast.success('取消成功')
    await getStatistics()
    pagingRef.value?.reload()
  } finally {
    cancelingId.value = undefined
  }
}

/** 初始化 */
onMounted(() => {
  getStatistics()
})
</script>
