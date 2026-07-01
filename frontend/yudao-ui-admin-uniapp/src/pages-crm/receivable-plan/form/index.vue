<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <CrmPicker
            v-model="formData.customerId"
            source="customer"
            label="客户名称"
            prop="customerId"
            placeholder="请选择客户名称"
            @confirm="handleCustomerConfirm"
          />
          <CrmPicker
            v-model="formData.contractId"
            source="contract"
            label="合同名称"
            prop="contractId"
            :params="{ customerId: formData.customerId }"
            placeholder="请选择合同名称"
          />
          <wd-form-item v-if="props.id" title="期数" title-width="200rpx" :value="formData.period !== undefined && formData.period !== null ? String(formData.period) : '-'" />
          <wd-form-item title="计划回款金额" title-width="200rpx" prop="price">
            <wd-input-number v-model="formData.price" :min="0.01" :precision="2" input-type="number" allow-null placeholder="请输入计划回款金额" />
          </wd-form-item>
          <wd-form-item title="计划回款日期" title-width="200rpx" prop="returnTime" is-link placeholder="请选择计划回款日期" :value="formatDate(formData.returnTime)" @click="pickerVisible.returnTime = true" />
          <wd-datetime-picker v-model="formData.returnTime" v-model:visible="pickerVisible.returnTime" title="请选择计划回款日期" type="date" />
          <wd-form-item title="提前提醒天数" title-width="200rpx" prop="remindDays">
            <wd-input v-model.number="formData.remindDays" type="number" placeholder="请输入提前提醒天数" clearable />
          </wd-form-item>
          <yd-form-picker v-model="formData.returnType" label="回款方式" prop="returnType" :dict-type="DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE" placeholder="请选择回款方式" />
          <UserPicker v-model="formData.ownerUserId" type="radio" label="负责人" prop="ownerUserId" :disabled="!!props.id" placeholder="请选择负责人" />
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

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
import type { ReceivablePlan } from '@/api/crm/receivable/plan'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createReceivablePlan, getReceivablePlan, updateReceivablePlan } from '@/api/crm/receivable/plan'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useUserStore } from '@/store/user'
import { currRoute, delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import CrmPicker from '@/pages-crm/components/crm-picker.vue'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const userStore = useUserStore()
const getTitle = computed(() => props.id ? '编辑回款计划' : '新增回款计划')
const formLoading = ref(false) // 表单提交状态
const formData = ref<ReceivablePlan>({
  id: undefined,
  customerId: undefined,
  contractId: undefined,
  period: undefined,
  price: undefined,
  returnTime: undefined,
  remindDays: undefined,
  returnType: undefined,
  ownerUserId: undefined,
  remark: '',
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const formSchema = createFormSchema({
  customerId: [{ required: true, message: '客户名称不能为空' }],
  contractId: [{ required: true, message: '合同名称不能为空' }],
  price: [{ required: true, message: '计划回款金额不能为空' }],
  returnTime: [{ required: true, message: '计划回款日期不能为空' }],
  ownerUserId: [{ required: true, message: '负责人不能为空' }],
})

/** 选择客户后清空合同 */
function handleCustomerConfirm() {
  formData.value.contractId = undefined
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/receivable-plan/index')
}

/** 应用页面预填参数 */
function applyQueryDefaults() {
  if (props.id) {
    return
  }
  const query = currRoute().query
  const numericKeys = ['customerId', 'contractId', 'ownerUserId']
  numericKeys.forEach((key) => {
    const value = query[key]
    if (value !== undefined && value !== '') {
      (formData.value as Record<string, any>)[key] = Number(value)
    }
  })
}

/** 加载回款计划详情 */
async function getDetail() {
  if (!props.id) {
    // 新增时默认负责人为当前登录用户
    if (!formData.value.ownerUserId) {
      const userId = userStore.userInfo?.userId
      if (userId && userId !== -1) {
        formData.value.ownerUserId = userId
      }
    }
    return
  }
  formData.value = await getReceivablePlan(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateReceivablePlan(formData.value)
      toast.success('修改成功')
    } else {
      await createReceivablePlan(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('crm:receivablePlan:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  applyQueryDefaults()
  await getDetail()
})
</script>
