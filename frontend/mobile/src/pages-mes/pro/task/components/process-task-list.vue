<template>
  <view class="mx-24rpx mt-24rpx">
    <view class="mb-16rpx flex items-center justify-between">
      <view>
        <view class="text-30rpx text-[#333] font-semibold">
          {{ process.processName || '未命名工序' }}
        </view>
        <view class="mt-4rpx text-24rpx text-[#999]">
          顺序 {{ process.sort }}，{{ process.checkFlag ? '质检工序' : '普通工序' }}
        </view>
      </view>
      <wd-button
        v-if="!readonly && hasAccessByCodes(['mes:pro-task:create'])"
        size="small"
        type="primary"
        @click="handleAdd"
      >
        新增任务
      </wd-button>
    </view>

    <view v-if="loading" class="rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999]">
      暂无生产任务
    </view>
    <view v-else>
      <view v-for="item in list" :key="item.id" class="mb-16rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
        <view class="p-20rpx" @click="handleDetail(item)">
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ item.code || '-' }}
              </view>
            </view>
            <TaskStatusTag v-if="item.status != null" :value="item.status" />
          </view>
          <view class="text-24rpx text-[#666] space-y-6rpx">
            <view>工作站：{{ item.workstationCode || '-' }} / {{ item.workstationName || '-' }}</view>
            <view>数量：{{ item.quantity ?? '-' }}，已生产：{{ item.producedQuantity ?? 0 }}</view>
            <view>开始：{{ formatDateTime(item.startTime) || '-' }}</view>
            <view>时长：{{ item.duration ?? '-' }} 工作日，预计完成：{{ formatDateTime(item.endTime) || '-' }}</view>
          </view>
        </view>
        <view v-if="!readonly" class="flex border-t border-[#f3f4f6] text-26rpx">
          <view v-if="hasAccessByCodes(['mes:pro-task:update'])" class="flex-1 py-18rpx text-center text-[#1677ff]" @click="handleEdit(item)">
            编辑
          </view>
          <view v-if="hasAccessByCodes(['mes:pro-task:delete'])" class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
            删除
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProRouteProcessVO } from '@/api/mes/pro/route/process'
import type { ProTaskVO } from '@/api/mes/pro/task'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref, watch } from 'vue'
import { deleteTask, getTaskPage } from '@/api/mes/pro/task'
import { useAccess } from '@/hooks/useAccess'
import { formatDateTime } from '@/utils/date'
import TaskStatusTag from './task-status-tag.vue'

const props = withDefaults(defineProps<{
  workOrderId: number
  routeId: number
  itemId: number
  process: ProRouteProcessVO
  readonly?: boolean
}>(), {
  readonly: false,
})

const emit = defineEmits<{
  reload: []
}>()

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<ProTaskVO[]>([]) // 任务列表

/** 查询任务列表 */
async function getList() {
  loading.value = true
  try {
    const data = await getTaskPage({
      workOrderId: props.workOrderId,
      routeId: props.routeId,
      processId: props.process.processId,
      pageNo: 1,
      pageSize: 100,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 新增任务 */
function handleAdd() {
  const query = [
    `workOrderId=${props.workOrderId}`,
    `routeId=${props.routeId}`,
    `processId=${props.process.processId}`,
    `itemId=${props.itemId}`,
    props.process.colorCode ? `colorCode=${encodeURIComponent(props.process.colorCode)}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-mes/pro/task/form/index?${query}` })
}

/** 查看任务详情 */
function handleDetail(item: ProTaskVO) {
  uni.navigateTo({ url: `/pages-mes/pro/task/form/index?id=${item.id}&readonly=true` })
}

/** 编辑任务 */
function handleEdit(item: ProTaskVO) {
  uni.navigateTo({ url: `/pages-mes/pro/task/form/index?id=${item.id}` })
}

/** 删除任务 */
async function handleDelete(item: ProTaskVO) {
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${item.code}」生产任务吗？` })
  } catch {
    return
  }
  await deleteTask(item.id)
  toast.success('删除成功')
  await getList()
  emit('reload')
}

watch(() => props.process.processId, getList)

onMounted(() => {
  getList()
})

defineExpose({ getList })
</script>
