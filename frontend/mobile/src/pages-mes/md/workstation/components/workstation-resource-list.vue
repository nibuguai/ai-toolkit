<template>
  <view>
    <!-- 设备资源 -->
    <view class="mx-24rpx mt-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
      <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
        <view class="text-30rpx text-[#333] font-semibold">
          设备资源
        </view>
        <wd-tag type="primary" plain>
          {{ machineList.length }} 项
        </wd-tag>
      </view>
      <view v-if="loading" class="py-40rpx text-center">
        <wd-loading />
      </view>
      <template v-else>
        <view v-for="item in machineList" :key="item.id" class="border-b border-[#f7f7f7] px-24rpx py-20rpx last:border-b-0">
          <view class="mb-8rpx text-28rpx text-[#333] font-medium">
            {{ item.machineryName || '-' }}
          </view>
          <view class="text-26rpx text-[#666] space-y-6rpx">
            <view>设备编码：{{ item.machineryCode || '-' }}</view>
            <view>数量：{{ item.quantity ?? '-' }}</view>
            <view v-if="item.remark">
              备注：{{ item.remark }}
            </view>
          </view>
        </view>
        <view v-if="machineList.length === 0" class="py-48rpx text-center">
          <wd-empty icon="content" tip="暂无设备资源" />
        </view>
      </template>
    </view>

    <!-- 工装夹具 -->
    <view class="mx-24rpx mt-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
      <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
        <view class="text-30rpx text-[#333] font-semibold">
          工装夹具
        </view>
        <wd-tag type="primary" plain>
          {{ toolList.length }} 项
        </wd-tag>
      </view>
      <view v-if="loading" class="py-40rpx text-center">
        <wd-loading />
      </view>
      <template v-else>
        <view v-for="item in toolList" :key="item.id" class="border-b border-[#f7f7f7] px-24rpx py-20rpx last:border-b-0">
          <view class="mb-8rpx text-28rpx text-[#333] font-medium">
            {{ item.toolTypeName || '-' }}
          </view>
          <view class="text-26rpx text-[#666] space-y-6rpx">
            <view>工具类型编号：{{ item.toolTypeId || '-' }}</view>
            <view>数量：{{ item.quantity ?? '-' }}</view>
            <view v-if="item.remark">
              备注：{{ item.remark }}
            </view>
          </view>
        </view>
        <view v-if="toolList.length === 0" class="py-48rpx text-center">
          <wd-empty icon="content" tip="暂无工装夹具" />
        </view>
      </template>
    </view>

    <!-- 人力资源 -->
    <view class="mx-24rpx mt-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
      <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
        <view class="text-30rpx text-[#333] font-semibold">
          人力资源
        </view>
        <wd-tag type="primary" plain>
          {{ workerList.length }} 项
        </wd-tag>
      </view>
      <view v-if="loading" class="py-40rpx text-center">
        <wd-loading />
      </view>
      <template v-else>
        <view v-for="item in workerList" :key="item.id" class="border-b border-[#f7f7f7] px-24rpx py-20rpx last:border-b-0">
          <view class="mb-8rpx text-28rpx text-[#333] font-medium">
            {{ item.postName || '-' }}
          </view>
          <view class="text-26rpx text-[#666] space-y-6rpx">
            <view>岗位编号：{{ item.postId || '-' }}</view>
            <view>数量：{{ item.quantity ?? '-' }}</view>
            <view v-if="item.remark">
              备注：{{ item.remark }}
            </view>
          </view>
        </view>
        <view v-if="workerList.length === 0" class="py-48rpx text-center">
          <wd-empty icon="content" tip="暂无人力资源" />
        </view>
      </template>
    </view>

    <view v-if="mode === 'edit'" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#8a5a00] leading-38rpx">
      当前已对齐 PC 端三类资源清单的只读展示；新增、编辑和删除维护将在选择器与写入验证补齐后开放。
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MdWorkstationMachineVO } from '@/api/mes/md/workstation/machine'
import type { MdWorkstationToolVO } from '@/api/mes/md/workstation/tool'
import type { MdWorkstationWorkerVO } from '@/api/mes/md/workstation/worker'
import { ref, watch } from 'vue'
import { getWorkstationMachineList } from '@/api/mes/md/workstation/machine'
import { getWorkstationToolList } from '@/api/mes/md/workstation/tool'
import { getWorkstationWorkerList } from '@/api/mes/md/workstation/worker'

const props = withDefaults(defineProps<{
  workstationId?: number | string
  mode?: 'detail' | 'edit'
}>(), {
  workstationId: undefined,
  mode: 'detail',
})

const loading = ref(false) // 资源加载状态
const machineList = ref<MdWorkstationMachineVO[]>([]) // 设备资源
const toolList = ref<MdWorkstationToolVO[]>([]) // 工装夹具
const workerList = ref<MdWorkstationWorkerVO[]>([]) // 人力资源

/** 加载三类工作站资源 */
async function loadList() {
  const workstationId = Number(props.workstationId)
  if (!Number.isFinite(workstationId) || workstationId <= 0) {
    machineList.value = []
    toolList.value = []
    workerList.value = []
    return
  }
  loading.value = true
  try {
    const [machines, tools, workers] = await Promise.all([
      getWorkstationMachineList(workstationId),
      getWorkstationToolList(workstationId),
      getWorkstationWorkerList(workstationId),
    ])
    machineList.value = machines || []
    toolList.value = tools || []
    workerList.value = workers || []
  } finally {
    loading.value = false
  }
}

watch(() => props.workstationId, loadList, { immediate: true })
</script>
