<template>
  <view class="w-full">
    <view v-for="(item, index) in items" :key="index" class="mb-24rpx rounded-12rpx bg-[#f8f8f8] p-20rpx">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">盘点明细 {{ index + 1 }}</text>
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

      <ErpPicker
        v-model="item.productId"
        label="产品"
        label-width="180rpx"
        source="product"
        placeholder="请选择产品"
        :disabled="disabled"
        @confirm="option => handleProductConfirm(index, option?.id)"
      />

      <wd-cell title="账面库存" :value="formatCount(item.stockCount)" />
      <wd-cell title="条码" :value="item.productBarCode || '-'" />
      <wd-cell title="单位" :value="item.productUnitName || '-'" />

      <wd-form-item title="实际库存" title-width="180rpx" center>
        <wd-input-number v-model="item.actualCount" :precision="3" :disabled="disabled" />
      </wd-form-item>
      <wd-cell title="盈亏数量" :value="formatCount(item.count)" />
      <wd-form-item title="产品单价" title-width="180rpx" center>
        <wd-input-number v-model="item.productPrice" :min="0.01" :precision="2" :disabled="disabled" />
      </wd-form-item>
      <wd-cell title="合计金额" :value="formatMoney(item.totalPrice)" />
      <wd-form-item title="备注" title-width="180rpx">
        <wd-input v-model="item.remark" placeholder="请输入备注" clearable :disabled="disabled" />
      </wd-form-item>
    </view>

    <wd-button v-if="!disabled" block variant="plain" @click="handleAdd">
      添加盘点产品
    </wd-button>
  </view>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/erp/product/product'
import type { Warehouse } from '@/api/erp/stock/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref, watch } from 'vue'
import ErpPicker from '@/pages-erp/components/erp-picker.vue'
import { formatCount, formatMoney, roundCount, roundPrice, setItemStockCount, toNumber } from '@/pages-erp/utils/erp'

const props = defineProps<{
  disabled?: boolean
  modelValue?: Record<string, any>[]
  productOptions: Product[]
  warehouseOptions: Warehouse[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>[]]
}>()

const toast = useToast()
const items = ref<Record<string, any>[]>([]) // 明细数据

/** 是否有值 */
function hasValue(value: any) {
  return value !== undefined && value !== null && value !== ''
}

/** 创建默认明细 */
function createDefaultItem() {
  const defaultWarehouse = props.warehouseOptions.find(item => item.defaultStatus)
  return {
    id: undefined,
    warehouseId: defaultWarehouse?.id,
    productId: undefined,
    productName: undefined,
    productUnitName: undefined,
    productBarCode: undefined,
    productPrice: undefined,
    stockCount: undefined,
    actualCount: undefined,
    count: undefined,
    totalPrice: undefined,
    remark: undefined,
  }
}

/** 补充默认仓库 */
function applyDefaultWarehouse() {
  const defaultWarehouse = props.warehouseOptions.find(item => item.defaultStatus)
  if (!defaultWarehouse?.id) {
    return
  }
  items.value.forEach((item) => {
    if (!item.warehouseId) {
      item.warehouseId = defaultWarehouse.id
    }
  })
}

/** 新增明细 */
function handleAdd() {
  items.value.push(createDefaultItem())
}

/** 删除明细 */
function handleRemove(index: number) {
  items.value.splice(index, 1)
}

/** 选择仓库 */
async function handleWarehouseConfirm(index: number, warehouseId?: number | string) {
  const item = items.value[index]
  if (!item) {
    return
  }
  item.warehouseId = warehouseId
  await setItemStockCount(item)
  if (hasValue(item.stockCount)) {
    item.actualCount = item.stockCount
  }
  refreshItemAmount(item)
}

/** 选择产品 */
async function handleProductConfirm(index: number, productId?: number | string) {
  const item = items.value[index]
  if (!item) {
    return
  }
  item.productId = productId
  const product = props.productOptions.find(option => String(option.id) === String(productId))
  if (product) {
    item.productName = product.name
    item.productUnitName = product.unitName
    item.productBarCode = product.barCode
    item.productPrice = product.minPrice
  }
  await setItemStockCount(item)
  if (hasValue(item.stockCount)) {
    item.actualCount = item.stockCount
  }
  refreshItemAmount(item)
}
function refreshItemAmount(item: Record<string, any>) {
  if (hasValue(item.stockCount) && hasValue(item.actualCount)) {
    item.count = roundCount(toNumber(item.actualCount) - toNumber(item.stockCount))
  } else {
    item.count = undefined
  }
  if (hasValue(item.count) && hasValue(item.productPrice)) {
    item.totalPrice = roundPrice(toNumber(item.count) * toNumber(item.productPrice))
  }
}

/** 校验明细 */
function validate() {
  if (items.value.length === 0) {
    toast.warning('请至少添加一个盘点产品')
    return false
  }
  const invalidIndex = items.value.findIndex(item => !item.warehouseId || !item.productId || !hasValue(item.actualCount))
  if (invalidIndex >= 0) {
    toast.warning(`请完善盘点明细 ${invalidIndex + 1}`)
    return false
  }
  return true
}

watch(() => props.modelValue, (value) => {
  items.value = Array.isArray(value) ? value : []
  applyDefaultWarehouse()
}, { immediate: true })

watch(() => props.warehouseOptions, applyDefaultWarehouse, { deep: true })

watch(items, (value) => {
  value.forEach(item => refreshItemAmount(item))
  emit('update:modelValue', value)
}, { deep: true })

/** 初始化 */
onMounted(() => {
  if (items.value.length === 0 && !props.disabled) {
    handleAdd()
  }
})

defineExpose({ validate })
</script>
