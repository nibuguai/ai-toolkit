<template>
  <view class="w-full">
    <view v-for="(item, index) in items" :key="index" class="mb-24rpx rounded-12rpx bg-[#f8f8f8] p-20rpx">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">收款明细 {{ index + 1 }}</text>
        <wd-button v-if="!disabled" size="small" type="error" variant="plain" @click="handleRemove(index)">
          删除
        </wd-button>
      </view>
      <wd-cell title="销售单据编号" :value="item.bizNo || '-'" />
      <wd-cell title="销售业务类型" :value="getBizTypeName(item.bizType)" />
      <wd-cell title="应收金额" :value="formatMoney(item.totalPrice)" />
      <wd-cell title="已收金额" :value="formatMoney(item.receiptedPrice)" />
      <wd-form-item title="本次收款" title-width="180rpx" center>
        <wd-input-number v-model="item.receiptPrice" :precision="2" :disabled="disabled" />
      </wd-form-item>
      <wd-form-item title="备注" title-width="180rpx">
        <wd-input v-model="item.remark" placeholder="请输入备注" clearable :disabled="disabled" />
      </wd-form-item>
    </view>

    <ReceiptSourcePicker ref="saleOutSelectorRef" source="sale-out" @success="handleAddSaleOut" />
    <ReceiptSourcePicker ref="saleReturnSelectorRef" source="sale-return" @success="handleAddSaleReturn" />
  </view>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref, watch } from 'vue'
import ReceiptSourcePicker from './receipt-source-picker.vue'
import { formatMoney, toNumber } from '@/pages-erp/utils/erp'
import { ErpBizType } from '@/utils/constants'

const props = defineProps<{
  disabled?: boolean
  modelValue?: Record<string, any>[]
  customerId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>[]]
}>()

const toast = useToast()
const items = ref<Record<string, any>[]>([])
const saleOutSelectorRef = ref<InstanceType<typeof ReceiptSourcePicker>>()
const saleReturnSelectorRef = ref<InstanceType<typeof ReceiptSourcePicker>>()

function getBizTypeName(value?: number) {
  if (value === ErpBizType.SALE_OUT) {
    return '销售出库'
  }
  if (value === ErpBizType.SALE_RETURN) {
    return '销售退货'
  }
  return '-'
}

function openSaleOutPicker() {
  if (!props.customerId) {
    toast.warning('请先选择客户')
    return
  }
  saleOutSelectorRef.value?.open(Number(props.customerId))
}

function openSaleReturnPicker() {
  if (!props.customerId) {
    toast.warning('请先选择客户')
    return
  }
  saleReturnSelectorRef.value?.open(Number(props.customerId))
}

function handleAddSaleOut(rows: Record<string, any>[]) {
  rows.forEach((row) => {
    const receiptedPrice = toNumber(row.receiptPrice)
    items.value.push({
      bizId: row.id,
      bizType: ErpBizType.SALE_OUT,
      bizNo: row.no,
      totalPrice: toNumber(row.totalPrice),
      receiptedPrice,
      receiptPrice: toNumber(row.totalPrice) - receiptedPrice,
    })
  })
}

function handleAddSaleReturn(rows: Record<string, any>[]) {
  rows.forEach((row) => {
    const refundPrice = toNumber(row.refundPrice)
    items.value.push({
      bizId: row.id,
      bizType: ErpBizType.SALE_RETURN,
      bizNo: row.no,
      totalPrice: -toNumber(row.totalPrice),
      receiptedPrice: -refundPrice,
      receiptPrice: -toNumber(row.totalPrice) + refundPrice,
    })
  })
}

function handleRemove(index: number) {
  items.value.splice(index, 1)
}

function validate() {
  if (items.value.length === 0) {
    toast.warning('请至少添加一条收款明细')
    return false
  }
  const invalidIndex = items.value.findIndex(item => item.receiptPrice === undefined || item.receiptPrice === null || item.receiptPrice === '')
  if (invalidIndex >= 0) {
    toast.warning(`请完善收款明细 ${invalidIndex + 1}`)
    return false
  }
  return true
}

watch(() => props.modelValue, (value) => {
  items.value = Array.isArray(value) ? value : []
}, { immediate: true })

watch(items, (value) => {
  emit('update:modelValue', value)
}, { deep: true })

defineExpose({ openSaleOutPicker, openSaleReturnPicker, validate })
</script>
