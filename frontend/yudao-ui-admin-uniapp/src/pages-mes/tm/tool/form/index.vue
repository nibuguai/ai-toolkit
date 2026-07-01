<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="工具编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="工具名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入工具名称" clearable />
          </wd-form-item>
          <wd-form-item title="品牌" title-width="220rpx" prop="brand">
            <wd-input v-model="formData.brand" placeholder="请输入品牌" clearable />
          </wd-form-item>
          <wd-form-item title="型号规格" title-width="220rpx" prop="specification">
            <wd-input v-model="formData.specification" placeholder="请输入型号规格" clearable />
          </wd-form-item>
          <wd-form-item title="工具类型" title-width="220rpx" prop="toolTypeId" is-link :value="typeDisplayValue" placeholder="请选择工具类型" @click="typePickerVisible = true" />
          <wd-picker v-model:visible="typePickerVisible" :model-value="formData.toolTypeId !== undefined ? [formData.toolTypeId] : []" :columns="typeOptions" label-key="name" value-key="id" @confirm="handleToolTypeConfirm" />
          <wd-form-item title="库存数量" title-width="220rpx" prop="quantity" center>
            <wd-input-number v-model="formData.quantity" :min="1" :precision="0" :disabled="selectedToolType?.codeFlag === true" @change="handleQuantityChange" />
          </wd-form-item>
          <wd-form-item title="可用数量" title-width="220rpx" prop="availableQuantity" center>
            <wd-input-number v-model="formData.availableQuantity" :min="0" :precision="0" disabled />
          </wd-form-item>
          <wd-form-item title="状态" title-width="220rpx" prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_TM_TOOL_STATUS)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="保养维护类型" title-width="220rpx" prop="maintenType">
            <wd-radio-group v-model="formData.maintenType" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_TM_MAINTEN_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item v-if="formData.maintenType === MesMaintenTypeEnum.REGULAR" title="下次保养日期" title-width="220rpx" prop="nextMaintenDate" is-link :value="formatDateTime(formData.nextMaintenDate) || ''" placeholder="请选择下次保养日期" @click="dateVisible.nextMaintenDate = true" />
          <wd-datetime-picker v-model="formData.nextMaintenDate" v-model:visible="dateVisible.nextMaintenDate" title="请选择下次保养日期" type="datetime" />
          <wd-form-item v-if="formData.maintenType === MesMaintenTypeEnum.USAGE" title="下次保养周期" title-width="220rpx" prop="nextMaintenPeriod" center>
            <wd-input-number v-model="formData.nextMaintenPeriod" :min="1" :precision="0" />
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
import type { TmToolCreateReqVO, TmToolUpdateReqVO, TmToolVO } from '@/api/mes/tm/tool'
import type { TmToolTypeVO } from '@/api/mes/tm/tool/type'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { createTool, getTool, updateTool } from '@/api/mes/tm/tool'
import { getToolTypeSimpleList } from '@/api/mes/tm/tool/type'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()
const MesAutoCodeRuleCode = {
  TM_TOOL_CODE: 'TM_TOOL_CODE',
} as const
const MesToolStatusEnum = {
  STORE: 1,
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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/tm/tool/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑工具' : '新增工具')
const formLoading = ref(false)
const formData = ref<Partial<TmToolVO>>(getDefaultFormData())
const formSchema = createFormSchema({
  code: [{ required: true, message: '工具编码不能为空' }],
  name: [{ required: true, message: '工具名称不能为空' }],
  toolTypeId: [{ required: true, message: '工具类型不能为空' }],
  quantity: [{ required: true, message: '数量不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>()
const typeOptions = ref<TmToolTypeVO[]>([])
const typePickerVisible = ref(false)
const selectedToolType = ref<TmToolTypeVO>() // 当前选中的工具类型
const dateVisible = reactive({
  nextMaintenDate: false,
}) // 日期选择器状态
const typeDisplayValue = computed(() => {
  const t = typeOptions.value.find(o => o.id === formData.value.toolTypeId)
  return t?.name || ''
})

function getDefaultFormData(): Partial<TmToolVO> {
  return {
    code: '',
    name: '',
    brand: '',
    specification: '',
    toolTypeId: undefined,
    quantity: 1,
    availableQuantity: 1,
    status: MesToolStatusEnum.STORE,
    maintenType: undefined,
    nextMaintenPeriod: undefined,
    nextMaintenDate: '',
    remark: '',
  }
}

function normalizeDateValue(value?: string | number | null) {
  return value ?? ''
}

function handleBack() {
  navigateBackPlus('/pages-mes/tm/tool/index')
}

async function loadOptions() {
  typeOptions.value = await getToolTypeSimpleList() || []
}

async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getTool(currentId.value)
  formData.value = {
    ...getDefaultFormData(),
    ...data,
    nextMaintenDate: normalizeDateValue(data.nextMaintenDate),
  }
  selectedToolType.value = typeOptions.value.find(item => item.id === data.toolTypeId)
}

async function loadPageData() {
  await loadOptions()
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
  selectedToolType.value = undefined
}

async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.TM_TOOL_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

function handleToolTypeConfirm({ value }: { value: number[] }) {
  const toolTypeId = value[0]
  formData.value.toolTypeId = toolTypeId
  selectedToolType.value = typeOptions.value.find(item => item.id === toolTypeId)
  if (selectedToolType.value?.codeFlag === true) {
    formData.value.quantity = 1
    formData.value.availableQuantity = 1
  }
}

function handleQuantityChange(value: number) {
  if (!currentId.value) {
    formData.value.availableQuantity = value
  }
}

function buildSubmitData(): TmToolCreateReqVO | TmToolUpdateReqVO {
  const data = {
    code: formData.value.code || '',
    name: formData.value.name || '',
    brand: formData.value.brand || undefined,
    specification: formData.value.specification || undefined,
    toolTypeId: Number(formData.value.toolTypeId),
    quantity: Number(formData.value.quantity),
    availableQuantity: Number(formData.value.availableQuantity),
    maintenType: formData.value.maintenType || undefined,
    nextMaintenPeriod: formData.value.maintenType === MesMaintenTypeEnum.USAGE ? formData.value.nextMaintenPeriod || undefined : undefined,
    nextMaintenDate: formData.value.maintenType === MesMaintenTypeEnum.REGULAR ? formData.value.nextMaintenDate || undefined : undefined,
    status: Number(formData.value.status),
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
      await updateTool(data)
      toast.success('修改成功')
    } else {
      await createTool(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:tm:tool:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

watch(() => formData.value.maintenType, (maintenType) => {
  if (maintenType !== MesMaintenTypeEnum.REGULAR) {
    formData.value.nextMaintenDate = ''
  }
  if (maintenType !== MesMaintenTypeEnum.USAGE) {
    formData.value.nextMaintenPeriod = undefined
  }
})

onMounted(() => {
  loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
