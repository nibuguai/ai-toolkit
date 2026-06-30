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
          供应商
        </view>
        <MesSearchSelectorField
          :model-value="selectedVendorText"
          placeholder="请选择供应商"
          clearable
          @click="openVendorSelector"
          @clear="clearVendor"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          入库日期
        </view>
        <wd-calendar
          v-model="receiptDateRange"
          type="daterange"
          placeholder="请选择入库日期范围"
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

  <VendorSelector ref="vendorSelectorRef" @confirm="handleVendorConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——① wd-calendar 日期范围改全局 yd-search-date-range；② wd-popup 去掉 transition="fade" :duration="0"；③ 供应商选择器 MesSearchSelectorField+VendorSelector 后续评估收敛为 yd-search-picker
import type { MdVendorVO } from '@/api/mes/md/vendor'
import type { WmItemReceiptQueryParams } from '@/api/mes/wm/itemreceipt'
import { computed, reactive, ref } from 'vue'
import { formatDateRange } from '@/utils/date'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import MesSearchSelectorField from '@/pages-mes/components/mes-search-selector-field.vue'
import VendorSelector from '../../../md/vendor/components/vendor-selector.vue'

const emit = defineEmits<{
  search: [data: WmItemReceiptQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器
const selectedVendor = ref<MdVendorVO>() // 已选供应商
const receiptDateRange = ref<[string, string]>() // 入库日期范围
const formData = reactive({
  code: '',
  name: '',
  vendorId: undefined as number | undefined,
}) // 搜索表单数据
const selectedVendorText = computed(() => {
  return selectedVendor.value
    ? `${selectedVendor.value.code || '-'} / ${selectedVendor.value.name || '-'}`
    : ''
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (selectedVendor.value) {
    conditions.push(`供应商:${selectedVendor.value.name || selectedVendor.value.code}`)
  }
  if (receiptDateRange.value?.length === 2) {
    conditions.push('入库日期')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索采购入库'
})

/** 打开供应商选择器 */
function openVendorSelector() {
  vendorSelectorRef.value?.open()
}

/** 选择供应商 */
function handleVendorConfirm(vendors: MdVendorVO[]) {
  selectedVendor.value = vendors[0]
  formData.vendorId = vendors[0]?.id
}

/** 清空供应商 */
function clearVendor() {
  selectedVendor.value = undefined
  formData.vendorId = undefined
}

/** 构造搜索参数 */
function buildParams() {
  const params: WmItemReceiptQueryParams = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.name) {
    params.name = formData.name
  }
  if (formData.vendorId != null) {
    params.vendorId = formData.vendorId
  }
  const range = formatDateRange(receiptDateRange.value)
  if (range) {
    params.receiptDate = range
  }
  return params
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildParams())
}

/** 重置字段 */
function resetFields() {
  formData.code = ''
  formData.name = ''
  formData.vendorId = undefined
  selectedVendor.value = undefined
  receiptDateRange.value = undefined
}

/** 重置按钮操作 */
function handleReset() {
  resetFields()
  visible.value = false
  emit('reset')
}

defineExpose({ resetFields })
</script>
