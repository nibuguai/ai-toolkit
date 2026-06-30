<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="工序编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="工序名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入工序名称" clearable />
          </wd-form-item>
          <wd-form-item title="状态" title-width="220rpx" prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="工序说明" title-width="220rpx" prop="attention">
            <wd-textarea v-model="formData.attention" placeholder="请输入工序说明" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-160rpx" />
    </scroll-view>
    <MesFooterActions>
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProProcessCreateReqVO, ProProcessUpdateReqVO, ProProcessVO } from '@/api/mes/pro/process'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createProcess, getProcess, updateProcess } from '@/api/mes/pro/process'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()
const MesAutoCodeRuleCode = {
  PRO_PROCESS_CODE: 'PRO_PROCESS_CODE',
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/pro/process/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前工序编号
const getTitle = computed(() => currentId.value ? '编辑生产工序' : '新增生产工序')
const formLoading = ref(false)
const formData = ref<Partial<ProProcessVO>>(getDefaultFormData())
const formSchema = createFormSchema({
  code: [{ required: true, message: '工序编码不能为空' }],
  name: [{ required: true, message: '工序名称不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/process/index')
}

/** 默认表单数据 */
function getDefaultFormData(): Partial<ProProcessVO> {
  return {
    code: '',
    name: '',
    attention: '',
    status: CommonStatusEnum.ENABLE,
    remark: '',
  }
}

/** 加载生产工序详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = { ...getDefaultFormData(), ...await getProcess(currentId.value) }
}

/** 加载页面数据 */
async function loadPageData() {
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
}

/** 生成工序编码 */
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.PRO_PROCESS_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

/** 构造提交数据 */
function buildSubmitData(): ProProcessCreateReqVO | ProProcessUpdateReqVO {
  const data = {
    code: formData.value.code || '',
    name: formData.value.name || '',
    attention: formData.value.attention || undefined,
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
      await updateProcess(data)
      toast.success('修改成功')
    } else {
      await createProcess(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:pro:process:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

onMounted(() => {
  loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
