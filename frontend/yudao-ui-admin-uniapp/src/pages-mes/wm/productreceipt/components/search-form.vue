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
          生产工单
        </view>
        <MesSearchSelectorField
          :model-value="selectedWorkOrderText"
          placeholder="请选择生产工单"
          clearable
          @click="openWorkOrderSelector"
          @clear="clearWorkOrder"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          产品物料
        </view>
        <MesSearchSelectorField
          :model-value="selectedItemText"
          placeholder="请选择产品物料"
          clearable
          @click="openItemSelector"
          @clear="clearItem"
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

  <WorkOrderSelector ref="workOrderSelectorRef" :confirmed-only="false" @confirm="handleWorkOrderConfirm" />
  <ItemSelector ref="itemSelectorRef" item-or-product="PRODUCT" title="选择产品物料" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——工单/物料选择器 MesSearchSelectorField+XxxSelector 后续评估收敛为 yd-search-picker
import type { MdItemVO } from '@/api/mes/md/item'
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import type { WmProductReceiptQueryParams } from '@/api/mes/wm/productreceipt'
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import MesSearchSelectorField from '@/pages-mes/components/mes-search-selector-field.vue'
import WorkOrderSelector from '../../../pro/card/components/workorder-selector.vue'
import ItemSelector from '../../../md/item/components/item-selector.vue'

const emit = defineEmits<{
  search: [data: WmProductReceiptQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const workOrderSelectorRef = ref<InstanceType<typeof WorkOrderSelector>>() // 工单选择器引用
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const selectedWorkOrder = ref<ProWorkOrderVO>() // 当前选择工单
const selectedItem = ref<MdItemVO>() // 当前选择物料
const formData = reactive<WmProductReceiptQueryParams>({
  code: undefined,
  name: undefined,
  workOrderId: undefined,
  itemId: undefined,
}) // 搜索表单数据
const selectedWorkOrderText = computed(() => {
  return selectedWorkOrder.value
    ? `${selectedWorkOrder.value.code || '-'} ${selectedWorkOrder.value.name || ''}`.trim()
    : ''
})
const selectedItemText = computed(() => {
  return selectedItem.value
    ? `${selectedItem.value.code || '-'} ${selectedItem.value.name || ''}`.trim()
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
  if (selectedWorkOrderText.value) {
    conditions.push(`工单:${selectedWorkOrderText.value}`)
  }
  if (selectedItemText.value) {
    conditions.push(`产品:${selectedItemText.value}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索产品入库'
})

/** 打开工单选择器 */
function openWorkOrderSelector() {
  workOrderSelectorRef.value?.open(formData.workOrderId)
}

/** 打开物料选择器 */
function openItemSelector() {
  itemSelectorRef.value?.open()
}

/** 确认选择工单 */
function handleWorkOrderConfirm(workOrder: ProWorkOrderVO) {
  selectedWorkOrder.value = workOrder
  formData.workOrderId = workOrder.id
}

/** 确认选择物料 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  selectedItem.value = item
  formData.itemId = item.id
}

/** 清空工单 */
function clearWorkOrder() {
  selectedWorkOrder.value = undefined
  formData.workOrderId = undefined
}

/** 清空物料 */
function clearItem() {
  selectedItem.value = undefined
  formData.itemId = undefined
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
  clearWorkOrder()
  clearItem()
  visible.value = false
  emit('reset')
}
</script>
