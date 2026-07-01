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
          批次编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入批次编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          物料
        </view>
        <view
          class="min-h-72rpx flex items-center justify-between gap-16rpx rounded-8rpx bg-[#f7f8fa] px-20rpx text-28rpx"
          @click="openItemSelector"
        >
          <text class="min-w-0 flex-1 truncate" :class="selectedItemText ? 'text-[#333]' : 'text-[#999]'">
            {{ selectedItemText || '请选择物料' }}
          </text>
          <wd-icon v-if="formData.itemId" name="close" size="28rpx" @click.stop="clearItem" />
          <wd-icon v-else name="arrow-right" size="28rpx" />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          供应商
        </view>
        <view
          class="min-h-72rpx flex items-center justify-between gap-16rpx rounded-8rpx bg-[#f7f8fa] px-20rpx text-28rpx"
          @click="openVendorSelector"
        >
          <text class="min-w-0 flex-1 truncate" :class="selectedVendorText ? 'text-[#333]' : 'text-[#999]'">
            {{ selectedVendorText || '请选择供应商' }}
          </text>
          <wd-icon v-if="formData.vendorId" name="close" size="28rpx" @click.stop="clearVendor" />
          <wd-icon v-else name="arrow-right" size="28rpx" />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          客户
        </view>
        <view
          class="min-h-72rpx flex items-center justify-between gap-16rpx rounded-8rpx bg-[#f7f8fa] px-20rpx text-28rpx"
          @click="openClientSelector"
        >
          <text class="min-w-0 flex-1 truncate" :class="selectedClientText ? 'text-[#333]' : 'text-[#999]'">
            {{ selectedClientText || '请选择客户' }}
          </text>
          <wd-icon v-if="formData.clientId" name="close" size="28rpx" @click.stop="clearClient" />
          <wd-icon v-else name="arrow-right" size="28rpx" />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          生产批号
        </view>
        <wd-input v-model="formData.lotNumber" placeholder="请输入生产批号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          质量状态
        </view>
        <wd-radio-group v-model="formData.qualityStatus" type="button">
          <wd-radio :value="undefined">
            全部
          </wd-radio>
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_QUALITY_STATUS)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          采购订单编号
        </view>
        <wd-input v-model="formData.purchaseOrderCode" placeholder="请输入采购订单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          销售订单编号
        </view>
        <wd-input v-model="formData.salesOrderCode" placeholder="请输入销售订单编号" clearable />
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

  <ItemSelector ref="itemSelectorRef" :multiple="false" @confirm="handleItemConfirm" />
  <VendorSelector ref="vendorSelectorRef" @confirm="handleVendorConfirm" />
  <ClientSelector ref="clientSelectorRef" @confirm="handleClientConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——① wd-radio-group 质量状态筛选改 yd-search-picker（qualityStatus，配 dict-kind + all-option）；② 物料/供应商/客户选择器 MesSearchSelectorField+XxxSelector 后续评估收敛为 yd-search-picker
import type { MdClientVO } from '@/api/mes/md/client'
import type { MdItemVO } from '@/api/mes/md/item'
import type { MdVendorVO } from '@/api/mes/md/vendor'
import type { BatchPageParam } from '@/api/mes/wm/batch'
import { computed, reactive, ref } from 'vue'
import { getIntDictOptions } from '@/hooks/useDict'
import ClientSelector from '@/pages-mes/md/client/components/client-selector.vue'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import VendorSelector from '@/pages-mes/md/vendor/components/vendor-selector.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

interface BatchSearchFormData {
  code?: string
  itemId?: number
  vendorId?: number
  clientId?: number
  lotNumber?: string
  qualityStatus?: number
  purchaseOrderCode?: string
  salesOrderCode?: string
}

const emit = defineEmits<{
  search: [data: Partial<BatchPageParam>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器引用
const clientSelectorRef = ref<InstanceType<typeof ClientSelector>>() // 客户选择器引用
const selectedItem = ref<MdItemVO>() // 已选物料
const selectedVendor = ref<MdVendorVO>() // 已选供应商
const selectedClient = ref<MdClientVO>() // 已选客户
const formData = reactive<BatchSearchFormData>({}) // 搜索表单数据

const selectedItemText = computed(() => selectedItem.value
  ? `${selectedItem.value.code || '-'} ${selectedItem.value.name || ''}`.trim()
  : '')
const selectedVendorText = computed(() => selectedVendor.value
  ? `${selectedVendor.value.code || '-'} ${selectedVendor.value.name || ''}`.trim()
  : '')
const selectedClientText = computed(() => selectedClient.value
  ? `${selectedClient.value.code || '-'} ${selectedClient.value.name || ''}`.trim()
  : '')
const qualityStatusText = computed(() => {
  if (formData.qualityStatus === undefined) {
    return ''
  }
  const option = getIntDictOptions(DICT_TYPE.MES_WM_QUALITY_STATUS).find(item => item.value === formData.qualityStatus)
  return option?.label || String(formData.qualityStatus)
})
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`批次:${formData.code}`)
  }
  if (selectedItemText.value) {
    conditions.push(`物料:${selectedItemText.value}`)
  }
  if (selectedVendorText.value) {
    conditions.push(`供应商:${selectedVendorText.value}`)
  }
  if (selectedClientText.value) {
    conditions.push(`客户:${selectedClientText.value}`)
  }
  if (formData.lotNumber) {
    conditions.push(`生产批号:${formData.lotNumber}`)
  }
  if (qualityStatusText.value) {
    conditions.push(`质量:${qualityStatusText.value}`)
  }
  if (formData.purchaseOrderCode) {
    conditions.push(`采购订单:${formData.purchaseOrderCode}`)
  }
  if (formData.salesOrderCode) {
    conditions.push(`销售订单:${formData.salesOrderCode}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索批次管理'
})

/** 打开搜索弹层 */
function openSearch() {
  visible.value = true
}

/** 打开物料选择 */
function openItemSelector() {
  itemSelectorRef.value?.open()
}

/** 打开供应商选择 */
function openVendorSelector() {
  vendorSelectorRef.value?.open()
}

/** 打开客户选择 */
function openClientSelector() {
  clientSelectorRef.value?.open()
}

/** 确认物料选择 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  selectedItem.value = item
  formData.itemId = item.id
}

/** 确认供应商选择 */
function handleVendorConfirm(vendors: MdVendorVO[]) {
  const vendor = vendors[0]
  if (!vendor) {
    return
  }
  selectedVendor.value = vendor
  formData.vendorId = vendor.id
}

/** 确认客户选择 */
function handleClientConfirm(clients: MdClientVO[]) {
  const client = clients[0]
  if (!client) {
    return
  }
  selectedClient.value = client
  formData.clientId = client.id
}

/** 清空物料 */
function clearItem() {
  selectedItem.value = undefined
  formData.itemId = undefined
}

/** 清空供应商 */
function clearVendor() {
  selectedVendor.value = undefined
  formData.vendorId = undefined
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
  formData.lotNumber = undefined
  formData.qualityStatus = undefined
  formData.purchaseOrderCode = undefined
  formData.salesOrderCode = undefined
  selectedItem.value = undefined
  selectedVendor.value = undefined
  selectedClient.value = undefined
  visible.value = false
  emit('reset')
}
</script>
