<template>
  <view class="w-full">
    <view v-for="(item, index) in items" :key="index" class="mb-24rpx rounded-12rpx bg-[#f8f8f8] p-20rpx">
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-28rpx text-[#333] font-semibold">付款明细 {{ index + 1 }}</text>
        <wd-button v-if="!disabled" size="small" type="error" variant="plain" @click="handleRemove(index)">
          删除
        </wd-button>
      </view>
      <wd-cell title="采购单据编号" :value="item.bizNo || '-'" />
      <wd-cell title="采购业务类型" :value="getBizTypeName(item.bizType)" />
      <wd-cell title="应付金额" :value="formatMoney(item.totalPrice)" />
      <wd-cell title="已付金额" :value="formatMoney(item.paidPrice)" />
      <wd-form-item title="本次付款" title-width="180rpx" center>
        <wd-input-number v-model="item.paymentPrice" :precision="2" :disabled="disabled" />
      </wd-form-item>
      <wd-form-item title="备注" title-width="180rpx">
        <wd-input v-model="item.remark" placeholder="请输入备注" clearable :disabled="disabled" />
      </wd-form-item>
    </view>

    <PaymentSourcePicker ref="purchaseInSelectorRef" source="purchase-in" @success="handleAddPurchaseIn" />
    <PaymentSourcePicker ref="purchaseReturnSelectorRef" source="purchase-return" @success="handleAddPurchaseReturn" />
  </view>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref, watch } from 'vue'
import PaymentSourcePicker from './payment-source-picker.vue'
import { formatMoney, toNumber } from '@/pages-erp/utils/erp'
import { ErpBizType } from '@/utils/constants'

const props = defineProps<{
  disabled?: boolean
  modelValue?: Record<string, any>[]
  supplierId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>[]]
}>()

const toast = useToast()
const items = ref<Record<string, any>[]>([])
const purchaseInSelectorRef = ref<InstanceType<typeof PaymentSourcePicker>>()
const purchaseReturnSelectorRef = ref<InstanceType<typeof PaymentSourcePicker>>()

function getBizTypeName(value?: number) {
  if (value === ErpBizType.PURCHASE_IN) {
    return '采购入库'
  }
  if (value === ErpBizType.PURCHASE_RETURN) {
    return '采购退货'
  }
  return '-'
}

function openPurchaseInPicker() {
  if (!props.supplierId) {
    toast.warning('请先选择供应商')
    return
  }
  purchaseInSelectorRef.value?.open(Number(props.supplierId))
}

function openPurchaseReturnPicker() {
  if (!props.supplierId) {
    toast.warning('请先选择供应商')
    return
  }
  purchaseReturnSelectorRef.value?.open(Number(props.supplierId))
}

function handleAddPurchaseIn(rows: Record<string, any>[]) {
  rows.forEach((row) => {
    const paidPrice = toNumber(row.paymentPrice)
    items.value.push({
      bizId: row.id,
      bizType: ErpBizType.PURCHASE_IN,
      bizNo: row.no,
      totalPrice: toNumber(row.totalPrice),
      paidPrice,
      paymentPrice: toNumber(row.totalPrice) - paidPrice,
    })
  })
}

function handleAddPurchaseReturn(rows: Record<string, any>[]) {
  rows.forEach((row) => {
    const refundPrice = toNumber(row.refundPrice)
    items.value.push({
      bizId: row.id,
      bizType: ErpBizType.PURCHASE_RETURN,
      bizNo: row.no,
      totalPrice: -toNumber(row.totalPrice),
      paidPrice: -refundPrice,
      paymentPrice: -toNumber(row.totalPrice) + refundPrice,
    })
  })
}

function handleRemove(index: number) {
  items.value.splice(index, 1)
}

function validate() {
  if (items.value.length === 0) {
    toast.warning('请至少添加一条付款明细')
    return false
  }
  const invalidIndex = items.value.findIndex(item => item.paymentPrice === undefined || item.paymentPrice === null || item.paymentPrice === '')
  if (invalidIndex >= 0) {
    toast.warning(`请完善付款明细 ${invalidIndex + 1}`)
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

defineExpose({ openPurchaseInPicker, openPurchaseReturnPicker, validate })
</script>
