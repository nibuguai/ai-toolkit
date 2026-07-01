<template>
  <wd-select-picker
    v-model="selectedValue"
    v-model:visible="visible"
    title="商品选择"
    :columns="availableSkuList"
    value-key="id"
    label-key="displayName"
    :type="multiple ? 'checkbox' : 'radio'"
    filterable
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { ItemSku } from '@/api/wms/md/item/sku'
import { computed, ref } from 'vue'
import { getItemSkuPage } from '@/api/wms/md/item/sku'

interface SkuPickerColumn extends ItemSku {
  displayName: string
}

const emit = defineEmits<{
  change: [list: ItemSku[]]
}>()

const visible = ref(false) // 选择器显示状态
const skuList = ref<SkuPickerColumn[]>([]) // SKU 列表
const selectedValue = ref<number | number[] | string>('') // 当前选中值
const disabledSkuIds = ref<Set<number>>(new Set()) // 已选择 SKU
const multiple = ref(true) // 是否多选

const availableSkuList = computed(() => {
  return skuList.value.filter(item => !item.id || !disabledSkuIds.value.has(item.id))
})

/** 打开选择器 */
async function open(selectedIds: number[] = [], options?: { multiple?: boolean }) {
  disabledSkuIds.value = new Set(selectedIds)
  multiple.value = options?.multiple ?? true
  selectedValue.value = multiple.value ? [] : ''
  visible.value = true
  await loadSkuList()
}

/** 加载 SKU 列表 */
async function loadSkuList() {
  const data = await getItemSkuPage({ pageNo: 1, pageSize: 100 })
  skuList.value = data.list.map(item => ({
    ...item,
    displayName: `${item.itemName || '-'} / ${item.name || '-'}${item.code ? `（${item.code}）` : ''}`,
  }))
}

/** 选择确认 */
function handleConfirm({ value }: { value: any }) {
  const ids = Array.isArray(value) ? value.map(Number) : value ? [Number(value)] : []
  const list = skuList.value.filter(item => item.id && ids.includes(item.id))
  emit('change', list)
}

defineExpose({ open })
</script>
