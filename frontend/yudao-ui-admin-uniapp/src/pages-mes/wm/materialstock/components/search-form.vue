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
          批次号
        </view>
        <wd-input
          v-model="formData.batchCode"
          placeholder="请输入批次号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          仓库
        </view>
        <view
          class="min-h-72rpx flex items-center justify-between gap-16rpx rounded-8rpx bg-[#f7f8fa] px-20rpx text-28rpx"
          @click="warehousePickerVisible = true"
        >
          <text class="min-w-0 flex-1 truncate" :class="warehouseDisplayValue ? 'text-[#333]' : 'text-[#999]'">
            {{ warehouseDisplayValue || '请选择仓库' }}
          </text>
          <wd-icon v-if="formData.warehouseId" name="close" size="28rpx" @click.stop="clearWarehouse" />
          <wd-icon v-else name="arrow-right" size="28rpx" />
        </view>
        <wd-picker
          v-model:visible="warehousePickerVisible"
          :model-value="warehousePickerValue"
          :columns="warehouseOptions"
          label-key="name"
          value-key="id"
          @confirm="handleWarehouseConfirm"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          库区
        </view>
        <view
          class="min-h-72rpx flex items-center justify-between gap-16rpx rounded-8rpx bg-[#f7f8fa] px-20rpx text-28rpx"
          @click="openLocationPicker"
        >
          <text class="min-w-0 flex-1 truncate" :class="locationDisplayValue ? 'text-[#333]' : 'text-[#999]'">
            {{ locationDisplayValue || '请选择库区' }}
          </text>
          <wd-icon v-if="formData.locationId" name="close" size="28rpx" @click.stop="clearLocation" />
          <wd-icon v-else name="arrow-right" size="28rpx" />
        </view>
        <wd-picker
          v-model:visible="locationPickerVisible"
          :model-value="locationPickerValue"
          :columns="locationOptions"
          label-key="name"
          value-key="id"
          @confirm="handleLocationConfirm"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          是否冻结
        </view>
        <wd-radio-group v-model="formData.frozen" type="button">
          <wd-radio :value="undefined">
            全部
          </wd-radio>
          <wd-radio :value="true">
            是
          </wd-radio>
          <wd-radio :value="false">
            否
          </wd-radio>
        </wd-radio-group>
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

  <!-- 物料选择器 -->
  <ItemSelector
    ref="itemSelectorRef"
    :multiple="false"
    @confirm="handleItemConfirm"
  />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——① wd-picker（仓库/库区）改 yd-search-picker（:columns + all-option）；② wd-radio-group 冻结状态改 yd-search-picker（frozen，:columns + all-option）；③ 物料选择器后续评估收敛为 yd-search-picker
import type { MdItemVO } from '@/api/mes/md/item'
import type { WmMaterialStockQueryParams } from '@/api/mes/wm/materialstock'
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import type { WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import type { WotPickerValue } from '@/utils/wot'
import { computed, onMounted, reactive, ref } from 'vue'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { getWotPickerFormValue } from '@/utils/wot'

interface MaterialStockSearchFormData {
  itemId?: number
  batchCode?: string
  warehouseId?: number
  locationId?: number
  frozen?: boolean
}

const emit = defineEmits<{
  search: [data: WmMaterialStockQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const selectedItem = ref<MdItemVO>() // 已选物料
const warehouseOptions = ref<WmWarehouseVO[]>([]) // 仓库选项
const locationOptions = ref<WmWarehouseLocationVO[]>([]) // 库区选项
const warehousePickerVisible = ref(false) // 仓库选择器显示状态
const locationPickerVisible = ref(false) // 库区选择器显示状态
const formData = reactive<MaterialStockSearchFormData>({}) // 搜索表单数据

const selectedItemText = computed(() => {
  return selectedItem.value
    ? `${selectedItem.value.code || '-'} ${selectedItem.value.name || ''}`.trim()
    : ''
})
const warehousePickerValue = computed(() => formData.warehouseId !== undefined ? [formData.warehouseId] : [])
const locationPickerValue = computed(() => formData.locationId !== undefined ? [formData.locationId] : [])
const warehouseDisplayValue = computed(() => getWotPickerFormValue(warehouseOptions.value, formData.warehouseId, {
  labelKey: 'name',
  placeholder: '',
  valueKey: 'id',
}))
const locationDisplayValue = computed(() => getWotPickerFormValue(locationOptions.value, formData.locationId, {
  labelKey: 'name',
  placeholder: '',
  valueKey: 'id',
}))
const frozenDisplayValue = computed(() => {
  if (formData.frozen === true) {
    return '是'
  }
  if (formData.frozen === false) {
    return '否'
  }
  return ''
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (selectedItemText.value) {
    conditions.push(`物料:${selectedItemText.value}`)
  }
  if (formData.batchCode) {
    conditions.push(`批次号:${formData.batchCode}`)
  }
  if (warehouseDisplayValue.value) {
    conditions.push(`仓库:${warehouseDisplayValue.value}`)
  }
  if (locationDisplayValue.value) {
    conditions.push(`库区:${locationDisplayValue.value}`)
  }
  if (frozenDisplayValue.value) {
    conditions.push(`冻结:${frozenDisplayValue.value}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索库存台账'
})

/** 加载仓库选项 */
async function loadWarehouseOptions() {
  warehouseOptions.value = await getWarehouseSimpleList() || []
}

/** 打开物料选择 */
function openItemSelector() {
  itemSelectorRef.value?.open()
}

/** 确认物料选择 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  formData.itemId = item.id
  selectedItem.value = item
}

/** 清空物料 */
function clearItem() {
  formData.itemId = undefined
  selectedItem.value = undefined
}

/** 选择仓库 */
async function handleWarehouseConfirm({ value }: { value: WotPickerValue[] }) {
  formData.warehouseId = Number(value[0])
  formData.locationId = undefined
  locationOptions.value = await getWarehouseLocationSimpleList(formData.warehouseId) || []
}

/** 清空仓库 */
function clearWarehouse() {
  formData.warehouseId = undefined
  formData.locationId = undefined
  locationOptions.value = []
}

/** 打开库区选择 */
async function openLocationPicker() {
  if (!formData.warehouseId) {
    uni.showToast({ title: '请先选择仓库', icon: 'none' })
    return
  }
  if (locationOptions.value.length === 0) {
    locationOptions.value = await getWarehouseLocationSimpleList(formData.warehouseId) || []
  }
  locationPickerVisible.value = true
}

/** 选择库区 */
function handleLocationConfirm({ value }: { value: WotPickerValue[] }) {
  formData.locationId = Number(value[0])
}

/** 清空库区 */
function clearLocation() {
  formData.locationId = undefined
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置按钮操作 */
function handleReset() {
  formData.itemId = undefined
  formData.batchCode = undefined
  formData.warehouseId = undefined
  formData.locationId = undefined
  formData.frozen = undefined
  selectedItem.value = undefined
  locationOptions.value = []
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(() => {
  loadWarehouseOptions()
})
</script>
