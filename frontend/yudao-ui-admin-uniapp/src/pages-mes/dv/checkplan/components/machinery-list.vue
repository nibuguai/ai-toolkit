<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        设备清单
      </view>
      <view v-if="readonly" class="text-24rpx text-[#999]">
        只读
      </view>
      <wd-button v-else size="small" type="primary" variant="plain" @click="openCreateForm">
        添加设备
      </wd-button>
    </view>
    <view v-if="loading" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      暂无关联设备
    </view>
    <view v-else class="px-24rpx py-8rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
      >
        <view class="mb-12rpx flex items-center justify-between gap-16rpx">
          <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-medium">
            {{ item.machineryName || item.machineryCode || '-' }}
          </view>
          <view class="shrink-0 text-24rpx text-[#999]">
            {{ item.machineryCode || '-' }}
          </view>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">品牌：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.machineryBrand || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.machinerySpecification || '-' }}</text>
        </view>
        <view class="flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
        </view>
      </view>
    </view>
  </view>

  <!-- 添加设备弹窗 -->
  <!-- TODO @YunaiV：本 wd-popup 去掉 transition="fade" :duration="0"，对齐 system/infra（基线不带这俩属性） -->
  <wd-popup
    v-model="formVisible"
    position="top"
    transition="fade"
    :duration="0"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="formVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          添加设备
        </view>
        <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="设备" title-width="200rpx" prop="machineryId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openMachinerySelector">
                <text :class="selectedMachineryText ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedMachineryText || '请选择设备' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="备注" title-width="200rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
  <MachinerySelector ref="machinerySelectorRef" :existing-ids="existingMachineryIds" @confirm="handleMachineryConfirm" />
</template>

<script lang="ts" setup>
import type { DvCheckPlanMachineryVO } from '@/api/mes/dv/checkplan/machinery'
import type { DvMachineryVO } from '@/api/mes/dv/machinery'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { create, getListByPlan } from '@/api/mes/dv/checkplan/machinery'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import MachinerySelector from '../../machinery/components/machinery-selector.vue'

const props = defineProps<{
  planId?: number
  readonly?: boolean
}>()

const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<DvCheckPlanMachineryVO[]>([]) // 设备清单
const formVisible = ref(false) // 添加弹窗显示状态
const formLoading = ref(false) // 添加提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref({
  machineryId: undefined as number | undefined,
  remark: '',
}) // 添加表单数据
const selectedMachinery = ref<DvMachineryVO>() // 当前选择设备
const machinerySelectorRef = ref<InstanceType<typeof MachinerySelector>>() // 设备选择器引用
const formSchema = createFormSchema({
  machineryId: [{ required: true, message: '设备不能为空' }],
})
const existingMachineryIds = computed(() => list.value.map(item => item.machineryId))
const selectedMachineryText = computed(() => {
  if (!selectedMachinery.value) {
    return ''
  }
  return `${selectedMachinery.value.code || '-'} ${selectedMachinery.value.name || ''}`.trim()
})

/** 查询设备清单 */
async function getList() {
  if (!props.planId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getListByPlan(props.planId)
  } finally {
    loading.value = false
  }
}

/** 打开添加弹窗 */
function openCreateForm() {
  formData.value = {
    machineryId: undefined,
    remark: '',
  }
  selectedMachinery.value = undefined
  formVisible.value = true
}

/** 打开设备选择器 */
function openMachinerySelector() {
  machinerySelectorRef.value?.open()
}

/** 确认选择设备 */
function handleMachineryConfirm(item: DvMachineryVO) {
  selectedMachinery.value = item
  formData.value.machineryId = item.id
}

/** 提交添加设备 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!props.planId || !formData.value.machineryId) {
    return
  }
  formLoading.value = true
  try {
    await create({
      planId: props.planId,
      machineryId: formData.value.machineryId,
      remark: formData.value.remark || undefined,
    })
    toast.success('添加成功')
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

watch(
  () => props.planId,
  () => {
    getList()
  },
  { immediate: true },
)
</script>
