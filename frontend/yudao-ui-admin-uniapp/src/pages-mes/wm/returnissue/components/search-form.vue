<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    transition="fade"
    :duration="0"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退料单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入退料单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退料单名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入退料单名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          生产工单
        </view>
        <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openWorkOrderSelector">
          <text :class="selectedWorkOrderText ? 'text-[#333]' : 'text-[#999]'">
            {{ selectedWorkOrderText || '请选择生产工单' }}
          </text>
          <wd-icon name="arrow-right" size="28rpx" color="#999" />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退料类型
        </view>
        <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openTypePicker">
          <text :class="selectedTypeText ? 'text-[#333]' : 'text-[#999]'">
            {{ selectedTypeText || '请选择退料类型' }}
          </text>
          <wd-icon name="arrow-right" size="28rpx" color="#999" />
        </view>
        <wd-picker
          v-model:visible="pickerVisible.type"
          :model-value="typePickerValue"
          :columns="typeOptions"
          label-key="label"
          value-key="value"
          title="请选择退料类型"
          placeholder="请选择退料类型"
          clearable
          @confirm="handleTypeConfirm"
        />
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>

  <WorkOrderSelector ref="workOrderSelectorRef" @confirm="handleWorkOrderConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——① wd-picker（物料/工作站）改 yd-search-picker（:columns + all-option）；② 工单选择器后续评估收敛为 yd-search-picker；③ wd-popup 去掉 transition="fade" :duration="0"
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import type { WmReturnIssueQueryParams } from '@/api/mes/wm/returnissue'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import WorkOrderSelector from '../../../pro/card/components/workorder-selector.vue'

interface PickerConfirmPayload {
  value: Array<number | string>
}

const emit = defineEmits<{
  search: [data: WmReturnIssueQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const typeOptions = getIntDictOptions(DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE) // 退料类型选项
const workOrderSelectorRef = ref<InstanceType<typeof WorkOrderSelector>>() // 工单选择器引用
const selectedWorkOrder = ref<ProWorkOrderVO>() // 当前选择工单
const pickerVisible = ref({ type: false }) // 字典选择器显示状态
const formData = reactive({
  code: '',
  name: '',
  workOrderId: undefined as number | undefined,
  type: undefined as number | undefined,
}) // 搜索表单数据
const selectedWorkOrderText = computed(() => {
  if (!selectedWorkOrder.value) {
    return ''
  }
  return `${selectedWorkOrder.value.code || '-'} ${selectedWorkOrder.value.name || ''}`.trim()
})
const selectedTypeText = computed(() => {
  if (formData.type == null) {
    return ''
  }
  return getDictLabel(DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE, formData.type)
})
const typePickerValue = computed(() => formData.type != null ? [formData.type] : [])

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (selectedWorkOrderText.value) {
    conditions.push(`工单:${selectedWorkOrderText.value}`)
  }
  if (formData.type != null) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE, formData.type)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索生产退料'
})

/** 打开生产工单选择 */
function openWorkOrderSelector() {
  workOrderSelectorRef.value?.open(formData.workOrderId)
}

/** 打开退料类型选择 */
function openTypePicker() {
  pickerVisible.value.type = true
}

/** 确认退料类型 */
function handleTypeConfirm({ value }: PickerConfirmPayload) {
  const [type] = value
  formData.type = type == null ? undefined : Number(type)
  pickerVisible.value.type = false
}

/** 确认生产工单 */
function handleWorkOrderConfirm(workOrder: ProWorkOrderVO) {
  selectedWorkOrder.value = workOrder
  formData.workOrderId = workOrder.id
}

/** 构造搜索参数 */
function buildParams() {
  const params: WmReturnIssueQueryParams = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.name) {
    params.name = formData.name
  }
  if (formData.workOrderId != null) {
    params.workOrderId = formData.workOrderId
  }
  if (formData.type != null) {
    params.type = formData.type
  }
  return params
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildParams())
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.name = ''
  formData.workOrderId = undefined
  formData.type = undefined
  selectedWorkOrder.value = undefined
  visible.value = false
  emit('reset')
}
</script>
