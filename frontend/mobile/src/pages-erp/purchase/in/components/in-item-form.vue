<template>
  <view class="w-full">
    <view v-for="(item, index) in items" :key="index" class="mb-24rpx rounded-12rpx bg-[#f8f8f8] p-20rpx">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">入库明细 {{ index + 1 }}</text>
        <wd-button v-if="!disabled && items.length > 1" size="small" type="error" variant="plain" @click="handleRemove(index)">
          删除
        </wd-button>
      </view>

      <ErpPicker
        v-model="item.warehouseId"
        label="仓库"
        label-width="180rpx"
        source="warehouse"
        placeholder="请选择仓库"
        :disabled="disabled"
        @confirm="option => handleWarehouseConfirm(index, option?.id)"
      />

      <wd-cell title="产品" :value="item.productName || '-'" />
      <wd-cell title="库存" :value="formatCount(item.stockCount)" />
      <wd-cell title="条码" :value="item.productBarCode || '-'" />
      <wd-cell title="单位" :value="item.productUnitName || '-'" />
      <wd-cell v-if="item.totalCount != null" title="原数量" :value="formatCount(item.totalCount)" />
      <wd-cell v-if="item.inCount != null" title="已入库" :value="formatCount(item.inCount)" />

      <wd-form-item title="数量" title-width="180rpx" center>
        <wd-input-number v-model="item.count" :min="0.001" :precision="3" :disabled="disabled" />
      </wd-form-item>
      <wd-form-item title="采购单价" title-width="180rpx" center>
        <wd-input-number v-model="item.productPrice" :min="0.01" :precision="2" :disabled="disabled" />
      </wd-form-item>
      <wd-cell title="金额" :value="formatMoney(item.totalProductPrice)" />
      <wd-form-item title="税率(%)" title-width="180rpx" center>
        <wd-input-number v-model="item.taxPercent" :min="0" :precision="2" :disabled="disabled" />
      </wd-form-item>
      <wd-cell title="税额" :value="formatMoney(item.taxPrice)" />
      <wd-cell title="含税金额" :value="formatMoney(item.totalPrice)" />
      <wd-form-item title="备注" title-width="180rpx">
        <wd-input v-model="item.remark" placeholder="请输入备注" clearable :disabled="disabled" />
      </wd-form-item>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Warehouse } from '@/api/erp/stock/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref, watch } from 'vue'
import ErpPicker from '@/pages-erp/components/erp-picker.vue'
import { formatCount, formatMoney, refreshSingleItemAmount, setItemStockCount } from '@/pages-erp/utils/erp'

const props = defineProps<{
  disabled?: boolean
  modelValue?: Record<string, any>[]
  warehouseOptions: Warehouse[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>[]]
}>()

const toast = useToast()
const items = ref<Record<string, any>[]>([])

function handleRemove(index: number) {
  items.value.splice(index, 1)
}

async function handleWarehouseConfirm(index: number, warehouseId?: number | string) {
  const item = items.value[index]
  if (!item) {
    return
  }
  item.warehouseId = warehouseId
  await setItemStockCount(item)
}

function applyDefaultWarehouse(value: Record<string, any>[]) {
  const defaultWarehouse = props.warehouseOptions.find(item => item.defaultStatus)
  value.forEach((item) => {
    if (!item.warehouseId && defaultWarehouse?.id) {
      item.warehouseId = defaultWarehouse.id
    }
    if (item.productId) {
      setItemStockCount(item)
    }
  })
}

function validate() {
  if (items.value.length === 0) {
    toast.warning('请先选择采购订单并生成入库明细')
    return false
  }
  const invalidIndex = items.value.findIndex(item => !item.warehouseId || !item.productId || !item.count || !item.productPrice)
  if (invalidIndex >= 0) {
    toast.warning(`请完善入库明细 ${invalidIndex + 1}`)
    return false
  }
  return true
}

watch(() => [props.modelValue, props.warehouseOptions], () => {
  items.value = Array.isArray(props.modelValue) ? props.modelValue : []
  applyDefaultWarehouse(items.value)
}, { immediate: true, deep: true })

watch(items, (value) => {
  value.forEach(item => refreshSingleItemAmount(item))
  emit('update:modelValue', value)
}, { deep: true })

defineExpose({ validate })
</script>
