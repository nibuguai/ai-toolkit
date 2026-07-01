<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="缺陷编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="缺陷描述" title-width="220rpx" prop="name">
            <wd-textarea v-model="formData.name" placeholder="请输入缺陷描述" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="检测项类型" title-width="220rpx" prop="type">
            <wd-radio-group v-model="formData.type" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_INDICATOR_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="缺陷等级" title-width="220rpx" prop="level">
            <wd-radio-group v-model="formData.level" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_DEFECT_LEVEL)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
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
import type { QcDefectCreateReqVO, QcDefectUpdateReqVO, QcDefectVO } from '@/api/mes/qc/defect'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createDefect, getDefect, updateDefect } from '@/api/mes/qc/defect'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()
const MesAutoCodeRuleCode = {
  QC_DEFECT_CODE: 'QC_DEFECT_CODE',
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/qc/defect/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑缺陷类型' : '新增缺陷类型')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<QcDefectVO>>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '缺陷编码不能为空' }],
  name: [{ required: true, message: '缺陷描述不能为空' }],
  type: [{ required: true, message: '检测项类型不能为空' }],
  level: [{ required: true, message: '缺陷等级不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 默认表单数据 */
function getDefaultFormData(): Partial<QcDefectVO> {
  return {
    code: '',
    name: '',
    type: undefined,
    level: undefined,
    remark: '',
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/defect/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = {
    ...getDefaultFormData(),
    ...await getDefect(currentId.value),
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

/** 生成缺陷编码 */
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.QC_DEFECT_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

/** 构造提交数据 */
function buildSubmitData(): QcDefectCreateReqVO | QcDefectUpdateReqVO {
  const data = {
    code: formData.value.code || '',
    name: formData.value.name || '',
    type: Number(formData.value.type),
    level: Number(formData.value.level),
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
      await updateDefect(data)
      toast.success('修改成功')
    } else {
      await createDefect(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:qc:defect:reload')
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

/** 路由变化 */
watch(currentId, () => {
  loadPageData()
})
</script>
