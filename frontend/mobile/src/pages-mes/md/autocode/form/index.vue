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
          <wd-form-item title="规则编码" title-width="200rpx" prop="code">
            <wd-input
              v-model="formData.code"
              clearable
              placeholder="请输入规则编码"
            />
          </wd-form-item>
          <wd-form-item title="规则名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入规则名称"
            />
          </wd-form-item>
          <wd-form-item title="规则描述" title-width="200rpx" prop="description">
            <wd-textarea
              v-model="formData.description"
              placeholder="请输入规则描述"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
          <wd-form-item title="最大长度" title-width="200rpx" prop="maxLength" center>
            <wd-input-number v-model="formData.maxLength" :min="1" :max="100" :precision="0" />
          </wd-form-item>
          <wd-form-item title="是否补齐" title-width="200rpx" prop="padded" center>
            <wd-radio-group v-model="formData.padded" type="button">
              <wd-radio
                v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
                :key="String(dict.value)"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item v-if="formData.padded" title="补齐字符" title-width="200rpx" prop="paddedChar">
            <wd-input
              v-model="formData.paddedChar"
              clearable
              placeholder="请输入补齐字符"
              :maxlength="1"
            />
          </wd-form-item>
          <wd-form-item v-if="formData.padded" title="补齐方式" title-width="200rpx" prop="paddedMethod" center>
            <wd-radio-group v-model="formData.paddedMethod" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_MD_AUTO_CODE_PADDED_METHOD)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <AutoCodePartSection v-if="isEdit && numericRouteId" :rule-id="numericRouteId" />
      <view class="h-160rpx" />
    </view>

    <!-- 底部保存按钮 -->
    <MesFooterActions>
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AutoCodeRuleCreateReqVO } from '@/api/mes/md/autocode/rule'
import { onShow } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createAutoCodeRule, getAutoCodeRule, updateAutoCodeRule } from '@/api/mes/md/autocode/rule'
import { getBoolDictOptions, getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import AutoCodePartSection from '../components/auto-code-part-section.vue'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/md/autocode/form/index')
const numericRouteId = computed(() => getRouteQueryNumber('id')) // 当前路由编号
const isEdit = computed(() => numericRouteId.value !== undefined)
const getTitle = computed(() => isEdit.value ? '编辑编码规则' : '新增编码规则')
const formLoading = ref(false) // 表单提交状态
const formData = ref<AutoCodeRuleCreateReqVO & { id?: number }>(createDefaultFormData()) // 表单数据

/** 创建默认表单数据 */
function createDefaultFormData(): AutoCodeRuleCreateReqVO & { id?: number } {
  return {
    id: undefined,
    code: '',
    name: '',
    description: '',
    maxLength: undefined,
    padded: false,
    paddedChar: '',
    paddedMethod: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: '',
  }
}

const formSchema = createFormSchema({
  code: [{ required: true, message: '规则编码不能为空' }],
  name: [{ required: true, message: '规则名称不能为空' }],
  maxLength: [
    { required: true, message: '最大长度不能为空' },
    { validator: value => (Number(value) >= 1 && Number(value) <= 100) || '最大长度必须在 1 到 100 之间' },
  ],
  padded: [{ required: true, message: '是否补齐不能为空' }],
  paddedChar: [{ required: () => formData.value.padded === true, message: '补齐字符不能为空' }],
  paddedMethod: [{ required: () => formData.value.padded === true, message: '补齐方式不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/autocode/index')
}

/** 重置表单 */
function resetForm() {
  formData.value = createDefaultFormData()
}

/** 加载详情 */
async function getDetail() {
  if (!numericRouteId.value) {
    resetForm()
    return
  }
  const detail = await getAutoCodeRule(numericRouteId.value)
  formData.value = {
    ...createDefaultFormData(),
    ...detail,
  }
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }

  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      paddedChar: formData.value.padded ? formData.value.paddedChar : undefined,
      paddedMethod: formData.value.padded ? formData.value.paddedMethod : undefined,
    }
    if (isEdit.value) {
      await updateAutoCodeRule({ ...data, id: numericRouteId.value })
      toast.success('修改成功')
    } else {
      await createAutoCodeRule(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:md:autocode:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})

onShow(() => {
  getDetail()
})

watch(numericRouteId, () => {
  getDetail()
})

watch(
  () => formData.value.padded,
  (padded) => {
    if (!padded) {
      formData.value.paddedChar = ''
      formData.value.paddedMethod = undefined
    }
  },
)
</script>
