<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="类型编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="类型名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入类型名称" clearable />
          </wd-form-item>
          <wd-cell title="编码管理" center>
            <view class="flex justify-end">
              <wd-switch v-model="formData.codeFlag" />
            </view>
          </wd-cell>
          <wd-form-item v-if="formData.codeFlag" title="保养维护类型" title-width="220rpx" prop="maintenType">
            <wd-radio-group v-model="formData.maintenType" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_TM_MAINTEN_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item v-if="showMaintenPeriod" :title="maintenPeriodTitle" title-width="220rpx" prop="maintenPeriod" center>
            <wd-input-number v-model="formData.maintenPeriod" :min="1" :precision="0" />
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
import type { TmToolTypeCreateReqVO, TmToolTypeUpdateReqVO, TmToolTypeVO } from '@/api/mes/tm/tool/type'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createToolType, getToolType, updateToolType } from '@/api/mes/tm/tool/type'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()

const MesAutoCodeRuleCode = {
  TM_TOOL_TYPE_CODE: 'TM_TOOL_TYPE_CODE',
} as const
const MesMaintenTypeEnum = {
  REGULAR: 1,
  USAGE: 2,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/tm/tool/type/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑工具类型' : '新增工具类型')
const formLoading = ref(false)
const formData = ref<Partial<TmToolTypeVO>>(getDefaultFormData())
const showMaintenPeriod = computed(() => formData.value.codeFlag && formData.value.maintenType != null)
const maintenPeriodTitle = computed(() => formData.value.maintenType === MesMaintenTypeEnum.USAGE ? '保养周期(次)' : '保养周期(天)')
const formSchema = createFormSchema({
  code: [{ required: true, message: '类型编码不能为空' }],
  name: [{ required: true, message: '类型名称不能为空' }],
  codeFlag: [{ required: true, message: '编码管理不能为空' }],
  maintenType: [{ required: () => !!formData.value.codeFlag, message: '保养维护类型不能为空' }],
  maintenPeriod: [{ required: () => showMaintenPeriod.value, message: '保养周期不能为空' }],
})
const formRef = ref<FormInstance>()

function getDefaultFormData(): Partial<TmToolTypeVO> {
  return {
    code: '',
    name: '',
    codeFlag: true,
    maintenType: undefined,
    maintenPeriod: undefined,
    remark: '',
  }
}

function handleBack() {
  navigateBackPlus('/pages-mes/tm/tool/type/index')
}

async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getToolType(currentId.value)
  formData.value = {
    ...getDefaultFormData(),
    ...data,
  }
}

async function loadPageData() {
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
}

async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.TM_TOOL_TYPE_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

function buildSubmitData(): TmToolTypeCreateReqVO | TmToolTypeUpdateReqVO {
  const data = {
    code: formData.value.code || '',
    name: formData.value.name || '',
    codeFlag: !!formData.value.codeFlag,
    maintenType: formData.value.codeFlag ? formData.value.maintenType || undefined : undefined,
    maintenPeriod: showMaintenPeriod.value ? formData.value.maintenPeriod || undefined : undefined,
    remark: formData.value.remark || undefined,
  }
  if (currentId.value) {
    return { ...data, id: currentId.value }
  }
  return data
}

async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (currentId.value) {
      await updateToolType(data)
      toast.success('修改成功')
    } else {
      await createToolType(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:tm:tool-type:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

watch(() => formData.value.codeFlag, (codeFlag) => {
  if (!codeFlag) {
    formData.value.maintenType = undefined
    formData.value.maintenPeriod = undefined
  }
})

onMounted(() => {
  loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
