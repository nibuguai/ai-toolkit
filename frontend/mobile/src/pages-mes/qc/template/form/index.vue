<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="方案编号" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="方案名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入方案名称" clearable />
          </wd-form-item>
          <wd-form-item title="检测种类" title-width="220rpx" prop="types">
            <wd-checkbox-group v-model="formData.types" type="button">
              <wd-checkbox v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_TYPE)" :key="dict.value" :name="dict.value">
                {{ dict.label }}
              </wd-checkbox>
            </wd-checkbox-group>
          </wd-form-item>
          <wd-form-item title="状态" title-width="220rpx" prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <template v-if="currentId">
        <TemplateIndicatorSection :template-id="currentId" />
        <TemplateItemSection :template-id="currentId" />
      </template>
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-20rpx text-24rpx text-[#389e0d]">
        请先保存质检方案主表；保存后可维护检测指标项和产品关联。
      </view>
      <view class="h-160rpx" />
    </scroll-view>

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
import type { QcTemplateCreateReqVO, QcTemplateUpdateReqVO, QcTemplateVO } from '@/api/mes/qc/template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createTemplate, getTemplate, updateTemplate } from '@/api/mes/qc/template'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import TemplateIndicatorSection from '../components/template-indicator-section.vue'
import TemplateItemSection from '../components/template-item-section.vue'

const props = defineProps<{ id?: number | string }>()
const MesAutoCodeRuleCode = {
  QC_TEMPLATE_CODE: 'QC_TEMPLATE_CODE',
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/qc/template/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑质检方案' : '新增质检方案')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<QcTemplateVO>>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '方案编号不能为空' }],
  name: [{ required: true, message: '方案名称不能为空' }],
  types: [{ required: true, message: '检测种类不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 默认表单数据 */
function getDefaultFormData(): Partial<QcTemplateVO> {
  return {
    code: '',
    name: '',
    types: [],
    status: CommonStatusEnum.ENABLE,
    remark: '',
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getTemplate(currentId.value)
  formData.value = {
    ...getDefaultFormData(),
    ...data,
    types: data.types || [],
  }
}

/** 加载页面数据 */
async function loadPageData() {
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
}

/** 生成方案编号 */
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.QC_TEMPLATE_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

/** 构造提交数据 */
function buildSubmitData(): QcTemplateCreateReqVO | QcTemplateUpdateReqVO {
  const data = {
    code: formData.value.code || '',
    name: formData.value.name || '',
    types: formData.value.types || [],
    status: Number(formData.value.status),
    remark: formData.value.remark || undefined,
  }
  if (currentId.value) {
    return { ...data, id: currentId.value }
  }
  return data
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }

  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (currentId.value) {
      await updateTemplate(data)
      toast.success('修改成功')
    } else {
      await createTemplate(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:qc:template:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
