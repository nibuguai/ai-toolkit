<template>
  <wd-select-picker
    v-model="selectedValue"
    v-model:visible="visible"
    title="库存选择"
    :columns="availableInventoryList"
    value-key="pickerKey"
    label-key="displayName"
    type="checkbox"
    filterable
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { Inventory } from '@/api/wms/inventory'
import { computed, ref } from 'vue'
import { getInventoryPage } from '@/api/wms/inventory'

export interface InventoryPickerRow extends Inventory {
  availableQuantity?: number
  displayName: string
  pickerKey: string
}

const props = defineProps<{
  warehouseId?: number
}>()

const emit = defineEmits<{
  change: [list: InventoryPickerRow[]]
}>()

const visible = ref(false) // 选择器显示状态
const inventoryList = ref<InventoryPickerRow[]>([]) // 库存列表
const selectedValue = ref<string[]>([]) // 当前选中库存标识
const disabledInventoryKeys = ref<Set<string>>(new Set()) // 已选择库存

const availableInventoryList = computed(() => {
  return inventoryList.value.filter(item => !disabledInventoryKeys.value.has(item.pickerKey))
})

/** 获得业务库存标识 */
function getInventoryKey(row: Pick<Inventory, 'skuId' | 'warehouseId'>) {
  return row.skuId && row.warehouseId ? `${row.skuId}-${row.warehouseId}` : ''
}

/** 打开选择器 */
async function open(selectedInventoryKeys: string[] = []) {
  if (!props.warehouseId) {
    uni.showToast({ icon: 'none', title: '请先选择仓库' })
    return
  }
  disabledInventoryKeys.value = new Set(selectedInventoryKeys)
  selectedValue.value = []
  visible.value = true
  await loadInventoryList()
}

/** 加载库存列表 */
async function loadInventoryList() {
  const data = await getInventoryPage({
    pageNo: 1,
    pageSize: 100,
    type: 'warehouse',
    warehouseId: props.warehouseId,
    onlyPositiveQuantity: true,
  })
  inventoryList.value = data.list.map((item) => {
    const pickerKey = getInventoryKey(item) || `inventory-${item.id}`
    const availableQuantity = item.quantity
    return {
      ...item,
      availableQuantity,
      pickerKey,
      displayName: `${item.itemName || '-'} / ${item.skuName || '-'} / ${item.warehouseName || '-'}（${availableQuantity ?? 0}）`,
    }
  })
}

/** 选择确认 */
function handleConfirm({ value }: { value: any }) {
  const keys = Array.isArray(value) ? value : value ? [value] : []
  const list = inventoryList.value.filter(item => keys.includes(item.pickerKey))
  emit('change', list)
}

defineExpose({ open })
</script>
