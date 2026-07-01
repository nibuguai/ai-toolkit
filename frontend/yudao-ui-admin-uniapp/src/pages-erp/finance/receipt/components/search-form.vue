<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

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
          收款单号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入收款单号" clearable />
      </view>
      <yd-search-date-range v-model="formData.receiptTime" label="收款时间" />
      <yd-search-picker v-model="formData.customerId" label="客户" :columns="customerOptions" label-key="name" value-key="id" placeholder="请选择客户" />
      <yd-search-picker v-model="formData.creator" label="创建人" :columns="userOptions" label-key="name" value-key="id" placeholder="请选择创建人" />
      <yd-search-picker v-model="formData.financeUserId" label="财务人员" :columns="userOptions" label-key="name" value-key="id" placeholder="请选择财务人员" />
      <yd-search-picker v-model="formData.accountId" label="收款账户" :columns="accountOptions" label-key="name" value-key="id" placeholder="请选择收款账户" />
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.ERP_AUDIT_STATUS" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          销售单号
        </view>
        <wd-input v-model="formData.bizNo" placeholder="请输入销售单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          备注
        </view>
        <wd-input v-model="formData.remark" placeholder="请输入备注" clearable />
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
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { erpOptionLoaders } from '@/pages-erp/config/options'
import { normalizeOptions } from '@/pages-erp/utils/erp'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false)
const customerOptions = ref<Record<string, any>[]>([]) // 客户选项
const userOptions = ref<Record<string, any>[]>([]) // 用户选项
const accountOptions = ref<Record<string, any>[]>([]) // 账户选项
const formData = reactive({
  no: undefined as string | undefined,
  receiptTime: ['', ''] as [any, any],
  customerId: undefined as number | undefined,
  creator: undefined as number | undefined,
  financeUserId: undefined as number | undefined,
  accountId: undefined as number | undefined,
  status: -1,
  remark: undefined as string | undefined,
  bizNo: undefined as string | undefined,
})

/** 获取选项名称 */
function getOptionLabel(options: Record<string, any>[], id?: number) {
  if (!id) {
    return ''
  }
  return options.find(item => String(item.id) === String(id))?.name || String(id)
}

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.no) {
    conditions.push(`单号:${formData.no}`)
  }
  if (formData.receiptTime[0] && formData.receiptTime[1]) {
    conditions.push(`收款时间:${formatDate(formData.receiptTime[0])}~${formatDate(formData.receiptTime[1])}`)
  }
  if (formData.customerId) {
    conditions.push(`客户:${getOptionLabel(customerOptions.value, formData.customerId)}`)
  }
  if (formData.accountId) {
    conditions.push(`账户:${getOptionLabel(accountOptions.value, formData.accountId)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.ERP_AUDIT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索收款单'
})

function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    receiptTime: formatDateRange(formData.receiptTime),
    customerId: formData.customerId,
    creator: formData.creator,
    financeUserId: formData.financeUserId,
    accountId: formData.accountId,
    status: formData.status === -1 ? undefined : formData.status,
    remark: formData.remark || undefined,
    bizNo: formData.bizNo || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.receiptTime = ['', '']
  formData.customerId = undefined
  formData.creator = undefined
  formData.financeUserId = undefined
  formData.accountId = undefined
  formData.status = -1
  formData.remark = undefined
  formData.bizNo = undefined
  visible.value = false
  emit('reset')
}

/** 加载搜索下拉选项 */
onMounted(async () => {
  const [customers, users, accounts] = await Promise.all([
    erpOptionLoaders.customer(),
    erpOptionLoaders.user(),
    erpOptionLoaders.account(),
  ])
  customerOptions.value = normalizeOptions(customers)
  userOptions.value = normalizeOptions(users)
  accountOptions.value = normalizeOptions(accounts)
})
</script>
