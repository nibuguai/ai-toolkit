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
          <wd-form-item title="企业编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-12rpx">
              <wd-input v-model="formData.code" class="flex-1" clearable placeholder="请输入企业编号" />
              <wd-button size="small" @click="formData.code = generateWmsCode('M')">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="企业名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入企业名称" />
          </wd-form-item>
          <wd-form-item
            title="企业类型"
            title-width="200rpx"
            prop="type"
            is-link
            :value="getWotPickerFormValue(getIntDictOptions(DICT_TYPE.WMS_MERCHANT_TYPE), formData.type)"
            placeholder="请选择企业类型"
            @click="pickerVisible.type = true"
          />
          <wd-picker
            v-model:visible="pickerVisible.type"
            :model-value="formData.type"
            :columns="getIntDictOptions(DICT_TYPE.WMS_MERCHANT_TYPE)"
            @confirm="handleTypeConfirm"
          />
          <wd-form-item title="级别" title-width="200rpx">
            <wd-input v-model="formData.level" clearable placeholder="请输入级别" />
          </wd-form-item>
          <wd-form-item title="联系人" title-width="200rpx">
            <wd-input v-model="formData.contact" clearable placeholder="请输入联系人" />
          </wd-form-item>
          <wd-form-item title="手机号" title-width="200rpx" prop="mobile">
            <wd-input v-model="formData.mobile" clearable placeholder="请输入手机号" />
          </wd-form-item>
          <wd-form-item title="座机号" title-width="200rpx">
            <wd-input v-model="formData.telephone" clearable placeholder="请输入座机号" />
          </wd-form-item>
          <wd-form-item title="Email" title-width="200rpx" prop="email">
            <wd-input v-model="formData.email" clearable placeholder="请输入 Email" />
          </wd-form-item>
          <wd-form-item title="开户行" title-width="200rpx">
            <wd-input v-model="formData.bankName" clearable placeholder="请输入开户行" />
          </wd-form-item>
          <wd-form-item title="银行账户" title-width="200rpx">
            <wd-input v-model="formData.bankAccount" clearable placeholder="请输入银行账户" />
          </wd-form-item>
          <wd-form-item title="地址" title-width="200rpx">
            <wd-textarea v-model="formData.address" placeholder="请输入地址" :maxlength="200" clearable />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="255"
              show-word-limit
              clearable
            />
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
import type { Merchant } from '@/api/wms/md/merchant'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import { createMerchant, getMerchant, updateMerchant } from '@/api/wms/md/merchant'
import { getIntDictOptions } from '@/hooks/useDict'
import { generateWmsCode } from '@/pages-wms/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑往来企业' : '新增往来企业')
const formLoading = ref(false) // 表单提交状态
const pickerVisible = reactive({
  type: false,
}) // 选择器显示状态
const formData = ref<Merchant>({
  id: undefined,
  code: '',
  name: '',
  type: undefined,
  level: '',
  bankName: '',
  bankAccount: '',
  address: '',
  mobile: '',
  telephone: '',
  contact: '',
  email: '',
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '企业编号不能为空' }],
  name: [{ required: true, message: '企业名称不能为空' }],
  type: [{ required: true, message: '企业类型不能为空' }],
  mobile: [{ type: 'mobile', message: '请输入正确的手机号码' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-wms/md/merchant/index')
}

/** 选择企业类型 */
function handleTypeConfirm({ value }: { value: any[] }) {
  formData.value.type = value[0]
  pickerVisible.type = false
}

/** 加载往来企业详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMerchant(Number(props.id))
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
      await updateMerchant(formData.value)
      toast.success('修改成功')
    } else {
      await createMerchant(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('wms:merchant:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
