<template>
  <!-- 搜索框入口 -->
  <view class="bg-white px-24rpx py-16rpx" @click="openSearch">
    <view class="flex items-center rounded-36rpx bg-[#f5f5f5] px-24rpx py-14rpx text-28rpx text-[#999]">
      <wd-icon name="search" size="32rpx" />
      <text class="ml-12rpx min-w-0 flex-1 truncate">
        {{ placeholder }}
      </text>
    </view>
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
          批次号
        </view>
        <wd-input
          v-model="formData.code"
          placeholder="请输入批次号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          产品物料
        </view>
        <view @click="itemSelectorRef?.open(formData.itemId)">
          <wd-input :model-value="itemDisplay" placeholder="请选择产品物料" readonly clearable @clear="clearItem" />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          供应商
        </view>
        <view @click="vendorSelectorRef?.open(formData.vendorId)">
          <wd-input :model-value="vendorDisplay" placeholder="请选择供应商" readonly clearable @clear="clearVendor" />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          客户
        </view>
        <view @click="clientSelectorRef?.open(formData.clientId)">
          <wd-input :model-value="clientDisplay" placeholder="请选择客户" readonly clearable @clear="clearClient" />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          销售订单编号
        </view>
        <wd-input
          v-model="formData.salesOrderCode"
          placeholder="请输入销售订单编号"
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

  <ItemSelector ref="itemSelectorRef" @confirm="handleItemConfirm" />
  <VendorSelector ref="vendorSelectorRef" @confirm="handleVendorConfirm" />
  <ClientSelector ref="clientSelectorRef" @confirm="handleClientConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——业务选择器（Selector/MesSearchSelectorField）后续评估收敛为 yd-search-picker
import { computed, reactive, ref } from 'vue'
import type { MdClientVO } from '@/api/mes/md/client'
import type { MdItemVO } from '@/api/mes/md/item'
import type { MdVendorVO } from '@/api/mes/md/vendor'
import type { BatchPageParam } from '@/api/mes/wm/batch'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import ClientSelector from '../../../md/client/components/client-selector.vue'
import ItemSelector from '../../../md/item/components/item-selector.vue'
import VendorSelector from '../../../md/vendor/components/vendor-selector.vue'

const emit = defineEmits<{
  search: [data: Partial<BatchPageParam>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Partial<BatchPageParam>>({
  code: undefined,
  itemId: undefined,
  vendorId: undefined,
  clientId: undefined,
  salesOrderCode: undefined,
  purchaseOrderCode: undefined,
}) // 搜索表单数据
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器
const clientSelectorRef = ref<InstanceType<typeof ClientSelector>>() // 客户选择器
const selectedItem = ref<MdItemVO>() // 当前物料
const selectedVendor = ref<MdVendorVO>() // 当前供应商
const selectedClient = ref<MdClientVO>() // 当前客户

const itemDisplay = computed(() => selectedItem.value ? `${selectedItem.value.code} / ${selectedItem.value.name}` : '')
const vendorDisplay = computed(() => selectedVendor.value ? `${selectedVendor.value.code} / ${selectedVendor.value.name}` : '')
const clientDisplay = computed(() => selectedClient.value ? `${selectedClient.value.code} / ${selectedClient.value.name}` : '')

/** 打开搜索弹层 */
function openSearch() {
  visible.value = true
}

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code !== undefined && formData.code !== '') {
    conditions.push(`批次号:${formData.code}`)
  }
  if (formData.itemId !== undefined && formData.itemId !== '') {
    conditions.push(`产品物料:${selectedItem.value?.name || formData.itemId}`)
  }
  if (formData.vendorId !== undefined && formData.vendorId !== '') {
    conditions.push(`供应商:${selectedVendor.value?.name || formData.vendorId}`)
  }
  if (formData.clientId !== undefined && formData.clientId !== '') {
    conditions.push(`客户:${selectedClient.value?.name || formData.clientId}`)
  }
  if (formData.salesOrderCode !== undefined && formData.salesOrderCode !== '') {
    conditions.push(`销售订单编号:${formData.salesOrderCode}`)
  }
  if (formData.purchaseOrderCode !== undefined && formData.purchaseOrderCode !== '') {
    conditions.push(`采购订单编号:${formData.purchaseOrderCode}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索批次追溯'
})

/** 选择物料 */
function handleItemConfirm(item: MdItemVO) {
  selectedItem.value = item
  formData.itemId = item.id
}

/** 清空物料 */
function clearItem() {
  selectedItem.value = undefined
  formData.itemId = undefined
}

/** 选择供应商 */
function handleVendorConfirm(item: MdVendorVO) {
  selectedVendor.value = item
  formData.vendorId = item.id
}

/** 清空供应商 */
function clearVendor() {
  selectedVendor.value = undefined
  formData.vendorId = undefined
}

/** 选择客户 */
function handleClientConfirm(item: MdClientVO) {
  selectedClient.value = item
  formData.clientId = item.id
}

/** 清空客户 */
function clearClient() {
  selectedClient.value = undefined
  formData.clientId = undefined
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.itemId = undefined
  formData.vendorId = undefined
  formData.clientId = undefined
  formData.salesOrderCode = undefined
  formData.purchaseOrderCode = undefined
  selectedItem.value = undefined
  selectedVendor.value = undefined
  selectedClient.value = undefined
  visible.value = false
  emit('reset')
}
</script>
