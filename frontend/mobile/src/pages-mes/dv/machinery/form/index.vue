<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="设备编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="设备名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入设备名称" clearable />
          </wd-form-item>
          <wd-form-item title="品牌" title-width="220rpx" prop="brand">
            <wd-input v-model="formData.brand" placeholder="请输入品牌" clearable />
          </wd-form-item>
          <wd-form-item title="规格型号" title-width="220rpx" prop="specification">
            <wd-input v-model="formData.specification" placeholder="请输入规格型号" clearable />
          </wd-form-item>
          <wd-form-item title="设备类型" title-width="220rpx" prop="machineryTypeId" is-link :value="typeDisplayValue" placeholder="请选择设备类型" @click="typePickerVisible = true" />
          <wd-picker v-model:visible="typePickerVisible" :model-value="formData.machineryTypeId !== undefined ? [formData.machineryTypeId] : []" :columns="typeOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.machineryTypeId = value[0]" />
          <wd-form-item title="所属车间" title-width="220rpx" prop="workshopId" is-link :value="workshopDisplayValue" placeholder="请选择车间" @click="workshopPickerVisible = true" />
          <wd-picker v-model:visible="workshopPickerVisible" :model-value="formData.workshopId !== undefined ? [formData.workshopId] : []" :columns="workshopOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.workshopId = value[0]" />
          <wd-form-item title="设备状态" title-width="220rpx" prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_MACHINERY_STATUS)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <MachineryRecordList v-if="currentId" :machinery-id="currentId" />
      <view v-if="currentId" class="mx-24rpx mb-24rpx rounded-12rpx bg-[#f6ffed] p-20rpx text-24rpx text-[#389e0d]">
        当前已对齐 PC 端设备详情中的点检、保养和维修记录只读展示；记录维护请进入对应业务模块。
      </view>
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
import type { DvMachineryCreateReqVO, DvMachineryUpdateReqVO, DvMachineryVO } from '@/api/mes/dv/machinery'
import type { DvMachineryTypeVO } from '@/api/mes/dv/machinery/type'
import type { MdWorkshopVO } from '@/api/mes/md/workstation/workshop'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createMachinery, getMachinery, updateMachinery } from '@/api/mes/dv/machinery'
import { getMachineryTypeList } from '@/api/mes/dv/machinery/type'
import { getWorkshopSimpleList } from '@/api/mes/md/workstation/workshop'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import MachineryRecordList from '../components/machinery-record-list.vue'

const props = defineProps<{ id?: number | string }>()
const MesAutoCodeRuleCode = {
  DV_MACHINERY_CODE: 'DV_MACHINERY_CODE',
} as const
const MesDvMachineryStatusEnum = {
  STOP: 1,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/dv/machinery/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前设备编号
const getTitle = computed(() => currentId.value ? '编辑设备' : '新增设备')
const formLoading = ref(false)
const formData = ref<Partial<DvMachineryVO>>(getDefaultFormData())
const formSchema = createFormSchema({
  code: [{ required: true, message: '设备编码不能为空' }],
  name: [{ required: true, message: '设备名称不能为空' }],
  machineryTypeId: [{ required: true, message: '设备类型不能为空' }],
  workshopId: [{ required: true, message: '所属车间不能为空' }],
  status: [{ required: true, message: '设备状态不能为空' }],
})
const formRef = ref<FormInstance>()
const typeOptions = ref<DvMachineryTypeVO[]>([])
const workshopOptions = ref<MdWorkshopVO[]>([])
const typePickerVisible = ref(false)
const workshopPickerVisible = ref(false)
const typeDisplayValue = computed(() => {
  const t = typeOptions.value.find(o => o.id === formData.value.machineryTypeId)
  return t?.name || ''
})
const workshopDisplayValue = computed(() => {
  const w = workshopOptions.value.find(o => o.id === formData.value.workshopId)
  return w?.name || ''
})

function handleBack() {
  navigateBackPlus('/pages-mes/dv/machinery/index')
}

function getDefaultFormData(): Partial<DvMachineryVO> {
  return {
    code: '',
    name: '',
    brand: '',
    specification: '',
    machineryTypeId: undefined,
    workshopId: undefined,
    status: MesDvMachineryStatusEnum.STOP,
    remark: '',
  }
}

async function loadOptions() {
  const [types, workshops] = await Promise.all([
    getMachineryTypeList(),
    getWorkshopSimpleList(),
  ])
  typeOptions.value = types || []
  workshopOptions.value = workshops || []
}

async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getMachinery(currentId.value)
  formData.value = { ...getDefaultFormData(), ...data }
}

async function loadPageData() {
  await loadOptions()
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
}

async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.DV_MACHINERY_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

function buildSubmitData(): DvMachineryCreateReqVO | DvMachineryUpdateReqVO {
  const data = {
    code: formData.value.code || '',
    name: formData.value.name || '',
    brand: formData.value.brand || undefined,
    specification: formData.value.specification || undefined,
    machineryTypeId: Number(formData.value.machineryTypeId),
    workshopId: Number(formData.value.workshopId),
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
      await updateMachinery(data)
      toast.success('修改成功')
    } else {
      await createMachinery(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:dv:machinery:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

onMounted(async () => {
  await loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
