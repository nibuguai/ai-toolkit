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
          发料单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入发料单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          发料单名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入发料单名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          供应商
        </view>
        <view class="min-h-64rpx flex items-center justify-between rounded-8rpx bg-white px-4rpx" @click.stop="openVendorSelector">
          <text :class="selectedVendorText ? 'text-[#333]' : 'text-[#999]'">
            {{ selectedVendorText || '请选择供应商' }}
          </text>
          <wd-icon name="arrow-right" size="28rpx" color="#999" />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          发料日期
        </view>
        <wd-calendar v-model="issueDateRange" type="daterange" placeholder="请选择发料日期范围" />
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
// TODO @YunaiV：搜索风格对齐 system/infra——① wd-calendar 日期范围改全局 yd-search-date-range（issueDate）；② wd-popup 去掉 transition="fade" :duration="0"；③ 供应商选择器 MesSearchSelectorField/VendorSelector 后续评估收敛为 yd-search-picker
import type { MdVendorVO } from '@/api/mes/md/vendor'
import type { WmOutsourceIssueQueryParams } from '@/api/mes/wm/outsourceissue'
import { computed, reactive, ref } from 'vue'
import { formatDateRange } from '@/utils/date'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import VendorSelector from '../../../md/vendor/components/vendor-selector.vue'

const emit = defineEmits<{
  search: [data: WmOutsourceIssueQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const issueDateRange = ref<[string, string]>() // 发料日期范围
const selectedVendor = ref<MdVendorVO>() // 当前选择供应商
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器引用
const formData = reactive({
  code: '',
  name: '',
  vendorId: undefined as number | undefined,
}) // 搜索表单数据
const selectedVendorText = computed(() => {
  if (!selectedVendor.value) {
    return ''
  }
  return `${selectedVendor.value.code || '-'} ${selectedVendor.value.name || ''}`.trim()
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
  if (selectedVendorText.value) {
    conditions.push(`供应商:${selectedVendorText.value}`)
  }
  if (issueDateRange.value?.length === 2) {
    conditions.push('发料日期')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索外协发料'
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

/** 构造搜索参数 */
function buildParams() {
  const params: WmOutsourceIssueQueryParams = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.name) {
    params.name = formData.name
  }
  if (formData.vendorId) {
    params.vendorId = formData.vendorId
  }
  const range = formatDateRange(issueDateRange.value)
  if (range) {
    params.issueDate = range
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
  formData.vendorId = undefined
  selectedVendor.value = undefined
  issueDateRange.value = undefined
  visible.value = false
  emit('reset')
}
</script>
