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
          入库单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入入库单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          入库单名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入入库单名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          外协工单号
        </view>
        <wd-input v-model="formData.workOrderCode" placeholder="请输入外协工单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          供应商
        </view>
        <view class="min-h-72rpx flex items-center justify-between rounded-8rpx bg-white px-4rpx" @click.stop="openVendorSelector">
          <text :class="selectedVendorText ? 'text-[#333]' : 'text-[#999]'">
            {{ selectedVendorText || '请选择供应商' }}
          </text>
          <wd-icon name="arrow-right" size="28rpx" color="#999" />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          单据状态
        </view>
        <wd-picker
          :model-value="statusPickerValue"
          :columns="statusColumns"
          label-key="label"
          value-key="value"
          placeholder="请选择单据状态"
          clearable
          @confirm="handleStatusConfirm"
          @clear="handleStatusClear"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          入库日期
        </view>
        <wd-calendar
          v-model="formData.receiptDate"
          type="daterange"
          placeholder="请选择入库日期"
          clearable
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

  <VendorSelector ref="vendorSelectorRef" title="选择供应商" @confirm="handleVendorConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——① wd-picker（仓库/库位）改 yd-search-picker（:columns + all-option）；② wd-calendar 日期范围改全局 yd-search-date-range；③ 供应商选择器后续评估收敛为 yd-search-picker
import type { MdVendorVO } from '@/api/mes/md/vendor'
import type { WmOutsourceReceiptQueryParams } from '@/api/mes/wm/outsourcereceipt'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'
import VendorSelector from '../../../md/vendor/components/vendor-selector.vue'

interface SearchFormData {
  code?: string
  name?: string
  workOrderCode?: string
  vendorId?: number
  status?: number
  receiptDate?: string[]
}

const emit = defineEmits<{
  search: [data: WmOutsourceReceiptQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器引用
const selectedVendor = ref<MdVendorVO>() // 当前供应商
const formData = reactive<SearchFormData>({
  code: undefined,
  name: undefined,
  workOrderCode: undefined,
  vendorId: undefined,
  status: undefined,
  receiptDate: undefined,
}) // 搜索表单数据
const statusColumns = getIntDictOptions(DICT_TYPE.MES_WM_OUTSOURCE_RECEIPT_STATUS)
const statusPickerValue = computed(() => formData.status == null ? [] : [formData.status])
const selectedVendorText = computed(() => {
  return selectedVendor.value
    ? `${selectedVendor.value.code || '-'} ${selectedVendor.value.name || ''}`.trim()
    : ''
})
const placeholder = computed(() => { // 搜索条件摘要
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.workOrderCode) {
    conditions.push(`工单:${formData.workOrderCode}`)
  }
  if (selectedVendorText.value) {
    conditions.push(`供应商:${selectedVendorText.value}`)
  }
  if (formData.status != null) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_WM_OUTSOURCE_RECEIPT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索外协入库'
})

/** 打开供应商选择器 */
function openVendorSelector() {
  vendorSelectorRef.value?.open()
}

/** 确认供应商 */
function handleVendorConfirm(vendors: MdVendorVO[]) {
  const vendor = vendors[0]
  selectedVendor.value = vendor
  formData.vendorId = vendor?.id
}

/** 确认状态 */
function handleStatusConfirm({ value }: { value: number[] }) {
  formData.status = value[0]
}

/** 清空状态 */
function handleStatusClear() {
  formData.status = undefined
}

/** 构造搜索参数 */
function buildSearchParams(): WmOutsourceReceiptQueryParams {
  return {
    pageNo: 1,
    pageSize: 10,
    code: formData.code || undefined,
    name: formData.name || undefined,
    workOrderCode: formData.workOrderCode || undefined,
    vendorId: formData.vendorId,
    status: formData.status,
    receiptDate: formatDateRange(formData.receiptDate),
  }
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildSearchParams())
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.workOrderCode = undefined
  formData.vendorId = undefined
  formData.status = undefined
  formData.receiptDate = undefined
  selectedVendor.value = undefined
  visible.value = false
  emit('reset')
}
</script>
