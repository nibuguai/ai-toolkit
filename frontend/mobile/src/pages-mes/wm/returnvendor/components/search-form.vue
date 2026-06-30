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
          退货单编号
        </view>
        <wd-input
          v-model="formData.code"
          placeholder="请输入退货单编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退货单名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入退货单名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          采购订单编号
        </view>
        <wd-input
          v-model="formData.purchaseOrderCode"
          placeholder="请输入采购订单编号"
          clearable
        />
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
// TODO @YunaiV：搜索风格对齐 system/infra——① 供应商选择器 MesSearchSelectorField+VendorSelector 后续评估收敛为 yd-search-picker；② wd-popup 去掉 transition="fade" :duration="0"
import type { MdVendorVO } from '@/api/mes/md/vendor'
import type { WmReturnVendorQueryParams } from '@/api/mes/wm/returnvendor'
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import MesSearchSelectorField from '@/pages-mes/components/mes-search-selector-field.vue'
import VendorSelector from '../../../md/vendor/components/vendor-selector.vue'

const emit = defineEmits<{
  search: [data: WmReturnVendorQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器引用
const selectedVendor = ref<MdVendorVO>() // 当前选择供应商
const formData = reactive<WmReturnVendorQueryParams>({
  code: undefined,
  name: undefined,
  purchaseOrderCode: undefined,
  vendorId: undefined,
}) // 搜索表单数据
const selectedVendorText = computed(() => {
  return selectedVendor.value
    ? `${selectedVendor.value.code || '-'} ${selectedVendor.value.name || ''}`.trim()
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
  if (formData.purchaseOrderCode) {
    conditions.push(`采购订单:${formData.purchaseOrderCode}`)
  }
  if (selectedVendorText.value) {
    conditions.push(`供应商:${selectedVendorText.value}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索采购退货'
})

/** 打开供应商选择器 */
function openVendorSelector() {
  vendorSelectorRef.value?.open()
}

/** 确认选择供应商 */
function handleVendorConfirm(vendors: MdVendorVO[]) {
  const vendor = vendors[0]
  if (!vendor) {
    return
  }
  selectedVendor.value = vendor
  formData.vendorId = vendor.id
}

/** 清空供应商 */
function clearVendor() {
  selectedVendor.value = undefined
  formData.vendorId = undefined
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.purchaseOrderCode = undefined
  clearVendor()
  visible.value = false
  emit('reset')
}
</script>
