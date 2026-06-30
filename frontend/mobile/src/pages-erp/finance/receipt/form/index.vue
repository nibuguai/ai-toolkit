<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="收款单号" :value="formData.no || '保存时自动生成'" />
          <wd-form-item title="收款时间" title-width="220rpx" prop="receiptTime" is-link :value="formatDate(formData.receiptTime) || ''" placeholder="请选择收款时间" @click="dateVisible.receiptTime = true" />
          <wd-datetime-picker v-model="formData.receiptTime" v-model:visible="dateVisible.receiptTime" title="请选择收款时间" type="date" />
          <ErpPicker v-model="formData.customerId" label="客户" label-width="220rpx" prop="customerId" source="customer" placeholder="请选择客户" />
          <ErpPicker v-model="formData.financeUserId" label="财务人员" label-width="220rpx" source="user" placeholder="请选择财务人员" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrl">
            <yd-upload-file v-model="formData.fileUrl" :limit="1" />
          </wd-form-item>
        </wd-cell-group>

        <view class="flex items-center justify-between px-24rpx py-16rpx">
          <text class="text-28rpx text-[#333] font-semibold">销售出库、退货单</text>
          <view class="flex gap-12rpx">
            <wd-button size="small" type="primary" plain @click="itemEditorRef?.openSaleOutPicker()">
              销售出库
            </wd-button>
            <wd-button size="small" type="primary" plain @click="itemEditorRef?.openSaleReturnPicker()">
              销售退货
            </wd-button>
          </view>
        </view>
        <wd-cell-group border>
          <wd-form-item title="收款明细" title-width="220rpx">
            <ReceiptItemForm ref="itemEditorRef" v-model="formData.items" :customer-id="formData.customerId" />
          </wd-form-item>
        </wd-cell-group>

        <view class="px-24rpx py-16rpx text-28rpx text-[#666]">
          收款信息
        </view>
        <wd-cell-group border>
          <ErpPicker v-model="formData.accountId" label="收款账户" label-width="220rpx" source="account" placeholder="请选择收款账户" />
          <wd-cell title="合计收款" :value="formatMoney(formData.totalPrice)" />
          <wd-form-item title="优惠金额" title-width="220rpx" prop="discountPrice" center>
            <wd-input-number v-model="formData.discountPrice" :min="0" :precision="2" />
          </wd-form-item>
          <wd-cell title="实际收款" :value="formatMoney(formData.receiptPrice)" />
        </wd-cell-group>
      </wd-form>

      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { FinanceReceipt } from '@/api/erp/finance/receipt'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { createFinanceReceipt, getFinanceReceipt, updateFinanceReceipt } from '@/api/erp/finance/receipt'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ErpPicker from '@/pages-erp/components/erp-picker.vue'
import { applyDefaultAccount } from '@/pages-erp/finance/account/components/use-default-account'
import ReceiptItemForm from '../components/receipt-item-form.vue'
import { formatMoney, roundPrice, toNumber } from '@/pages-erp/utils/erp'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑收款单' : '新增收款单')
const formLoading = ref(false) // 表单提交状态
const formData = ref<FinanceReceipt>({
  id: undefined,
  no: undefined,
  customerId: undefined,
  accountId: undefined,
  financeUserId: undefined,
  receiptTime: Date.now(),
  remark: undefined,
  fileUrl: '',
  totalPrice: 0,
  discountPrice: 0,
  receiptPrice: 0,
  items: [],
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const itemEditorRef = ref<InstanceType<typeof ReceiptItemForm>>() // 明细组件引用
const dateVisible = reactive({
  receiptTime: false,
}) // 日期选择器状态
const formSchema = createFormSchema({
  customerId: [{ required: true, message: '客户不能为空' }],
  receiptTime: [{ required: true, message: '收款时间不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/finance/receipt/index')
}

/** 刷新收款金额 */
function refreshAmount() {
  const items = Array.isArray(formData.value.items) ? formData.value.items : []
  const totalPrice = items.reduce((sum, item) => sum + toNumber(item.receiptPrice), 0)
  formData.value.totalPrice = roundPrice(totalPrice)
  formData.value.receiptPrice = roundPrice(totalPrice - toNumber(formData.value.discountPrice))
}

/** 加载基础选项 */
async function loadOptions() {
  await applyDefaultAccount(formData.value)
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = {
      ...formData.value,
      ...await getFinanceReceipt(props.id),
    }
  } finally {
    toast.close()
  }
  refreshAmount()
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !itemEditorRef.value?.validate()) {
    return
  }
  refreshAmount()
  formLoading.value = true
  try {
    if (props.id) {
      await updateFinanceReceipt(formData.value)
      toast.success('修改成功')
    } else {
      await createFinanceReceipt(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:finance-receipt:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

watch(() => [formData.value.items, formData.value.discountPrice], refreshAmount, { deep: true })

onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
