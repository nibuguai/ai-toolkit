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
          <wd-form-item title="项目编码" title-width="200rpx" prop="code">
            <wd-input
              v-model="formData.code"
              clearable
              placeholder="请输入或点击生成"
            >
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="项目名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入项目名称"
            />
          </wd-form-item>
          <wd-form-item title="项目类型" title-width="200rpx" prop="type">
            <wd-radio-group v-model="formData.type" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_SUBJECT_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="项目内容" title-width="200rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              placeholder="请输入项目内容"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
          <wd-form-item title="标准" title-width="200rpx" prop="standard">
            <wd-textarea
              v-model="formData.standard"
              placeholder="请输入标准"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
          <wd-form-item title="状态" title-width="200rpx" prop="status">
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
import type { DvSubjectCreateReqVO } from '@/api/mes/dv/subject'
import { onShow } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createSubject, getSubject, updateSubject } from '@/api/mes/dv/subject'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/dv/subject/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前编辑编号
const getTitle = computed(() => currentId.value ? '编辑点检项目' : '新增点检项目')
const formLoading = ref(false) // 表单提交状态
interface DvSubjectFormData extends DvSubjectCreateReqVO {
  id?: number
}
const formData = ref<DvSubjectFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '项目编码不能为空' }],
  type: [{ required: true, message: '项目类型不能为空' }],
  content: [{ required: true, message: '项目内容不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const MesAutoCodeRuleCode = {
  DV_SUBJECT_CODE: 'DV_SUBJECT_CODE',
} as const

/** 默认表单数据 */
function getDefaultFormData() {
  return {
    code: '',
    name: '',
    type: undefined,
    content: '',
    standard: '',
    status: CommonStatusEnum.ENABLE,
    remark: '',
  } as DvSubjectFormData
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/subject/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getSubject(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name || '',
    type: data.type,
    content: data.content,
    standard: data.standard || '',
    status: data.status,
    remark: data.remark || '',
  }
}

/** 初始化页面数据 */
async function initPage() {
  if (!currentId.value) {
    formData.value = getDefaultFormData()
    return
  }
  if (!formData.value.id || formData.value.id !== currentId.value) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 生成项目编码 */
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.DV_SUBJECT_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
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
    const data: DvSubjectCreateReqVO = {
      code: formData.value.code,
      name: formData.value.name || undefined,
      type: formData.value.type,
      content: formData.value.content,
      standard: formData.value.standard || undefined,
      status: formData.value.status,
      remark: formData.value.remark || undefined,
    }
    if (currentId.value) {
      await updateSubject({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      await createSubject(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:dv:subject:reload')
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
  initPage()
})

onShow(() => {
  initPage()
})

watch(currentId, () => {
  initPage()
})
</script>
