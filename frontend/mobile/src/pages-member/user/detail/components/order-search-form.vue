<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          订单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入订单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          订单状态
        </view>
        <view class="yd-search-form-date-range-picker" @click="pickerVisible.status = true">
          {{ getWotPickerDisplay(statusOptions, formData.status, { placeholder: '请选择订单状态' }) }}
        </view>
        <wd-picker
          v-model:visible="pickerVisible.status"
          :model-value="[formData.status]"
          :columns="statusOptions"
          @confirm="({ value }) => formData.status = value[0]"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          支付方式
        </view>
        <view class="yd-search-form-date-range-picker" @click="pickerVisible.payChannelCode = true">
          {{ getWotPickerDisplay(payChannelCodeOptions, formData.payChannelCode, { placeholder: '请选择支付方式' }) }}
        </view>
        <wd-picker
          v-model:visible="pickerVisible.payChannelCode"
          :model-value="[formData.payChannelCode]"
          :columns="payChannelCodeOptions"
          @confirm="({ value }) => formData.payChannelCode = value[0]"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          订单来源
        </view>
        <view class="yd-search-form-date-range-picker" @click="pickerVisible.terminal = true">
          {{ getWotPickerDisplay(terminalOptions, formData.terminal, { placeholder: '请选择订单来源' }) }}
        </view>
        <wd-picker
          v-model:visible="pickerVisible.terminal"
          :model-value="[formData.terminal]"
          :columns="terminalOptions"
          @confirm="({ value }) => formData.terminal = value[0]"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          订单类型
        </view>
        <view class="yd-search-form-date-range-picker" @click="pickerVisible.type = true">
          {{ getWotPickerDisplay(typeOptions, formData.type, { placeholder: '请选择订单类型' }) }}
        </view>
        <wd-picker
          v-model:visible="pickerVisible.type"
          :model-value="[formData.type]"
          :columns="typeOptions"
          @confirm="({ value }) => formData.type = value[0]"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          配送方式
        </view>
        <view class="yd-search-form-date-range-picker" @click="pickerVisible.deliveryType = true">
          {{ getWotPickerDisplay(deliveryTypeOptions, formData.deliveryType, { placeholder: '请选择配送方式' }) }}
        </view>
        <wd-picker
          v-model:visible="pickerVisible.deliveryType"
          :model-value="[formData.deliveryType]"
          :columns="deliveryTypeOptions"
          @confirm="({ value }) => formData.deliveryType = value[0]"
        />
      </view>
      <yd-search-date-range v-model="formData.createTime" label="下单时间" />
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
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import { getWotPickerDisplay } from '@/utils/wot'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const pickerVisible = ref<Record<string, boolean>>({})
const statusOptions = computed(() => [
  { label: '全部', value: -1 },
  ...getIntDictOptions(DICT_TYPE.TRADE_ORDER_STATUS),
])
const typeOptions = computed(() => [
  { label: '全部', value: -1 },
  ...getIntDictOptions(DICT_TYPE.TRADE_ORDER_TYPE),
])
const deliveryTypeOptions = computed(() => [
  { label: '全部', value: -1 },
  ...getIntDictOptions(DICT_TYPE.TRADE_DELIVERY_TYPE),
])
const payChannelCodeOptions = computed(() => [
  { label: '全部', value: '' },
  ...getStrDictOptions(DICT_TYPE.PAY_CHANNEL_CODE),
])
const terminalOptions = computed(() => [
  { label: '全部', value: -1 },
  ...getIntDictOptions(DICT_TYPE.TERMINAL),
])
const formData = reactive({
  no: undefined as string | undefined,
  status: -1,
  type: -1,
  deliveryType: -1,
  payChannelCode: '' as string,
  terminal: -1,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`订单:${formData.no}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.TRADE_ORDER_STATUS, formData.status)}`)
  }
  if (formData.type !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.TRADE_ORDER_TYPE, formData.type)}`)
  }
  if (formData.deliveryType !== -1) {
    conditions.push(`配送:${getDictLabel(DICT_TYPE.TRADE_DELIVERY_TYPE, formData.deliveryType)}`)
  }
  if (formData.payChannelCode) {
    conditions.push(`支付:${getDictLabel(DICT_TYPE.PAY_CHANNEL_CODE, formData.payChannelCode)}`)
  }
  if (formData.terminal !== -1) {
    conditions.push(`来源:${getDictLabel(DICT_TYPE.TERMINAL, formData.terminal)}`)
  }
  if (formData.createTime[0] && formData.createTime[1]) {
    conditions.push(`下单:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索订单记录'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    status: formData.status === -1 ? undefined : formData.status,
    type: formData.type === -1 ? undefined : formData.type,
    deliveryType: formData.deliveryType === -1 ? undefined : formData.deliveryType,
    payChannelCode: formData.payChannelCode || undefined,
    terminal: formData.terminal === -1 ? undefined : formData.terminal,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.status = -1
  formData.type = -1
  formData.deliveryType = -1
  formData.payChannelCode = ''
  formData.terminal = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
