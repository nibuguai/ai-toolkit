<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="工作站编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="工作站名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入工作站名称" clearable />
          </wd-form-item>
          <wd-form-item title="所在车间" title-width="220rpx" prop="workshopId" is-link :value="workshopDisplayValue" placeholder="请选择车间" @click="workshopPickerVisible = true" />
          <wd-picker v-model:visible="workshopPickerVisible" :model-value="workshopPickerValue" :columns="workshopOptions" label-key="name" value-key="id" @confirm="handleWorkshopConfirm" />
          <wd-form-item title="工作站地点" title-width="220rpx" prop="address">
            <wd-input v-model="formData.address" placeholder="请输入工作站地点" clearable />
          </wd-form-item>
          <wd-form-item title="所属工序" title-width="220rpx" prop="processId" is-link :value="processDisplayValue" placeholder="请选择工序" @click="processPickerVisible = true" />
          <wd-picker v-model:visible="processPickerVisible" :model-value="processPickerValue" :columns="processOptions" label-key="label" value-key="id" @confirm="handleProcessConfirm" />
          <wd-form-item title="线边仓库" title-width="220rpx">
            <view class="min-w-0 flex flex-1 items-center justify-end gap-12rpx">
              <view class="min-w-0 flex-1 truncate text-right text-28rpx" :class="warehouseDisplayValue ? 'text-[#333]' : 'text-[#999]'" @click="warehousePickerVisible = true">
                {{ warehouseDisplayValue || '请选择仓库' }}
              </view>
              <wd-button v-if="formData.warehouseId !== undefined" size="small" variant="plain" @click.stop="clearWarehouse">
                清空
              </wd-button>
            </view>
          </wd-form-item>
          <wd-picker v-model:visible="warehousePickerVisible" :model-value="warehousePickerValue" :columns="warehouseOptions" label-key="name" value-key="id" @confirm="handleWarehouseConfirm" />
          <wd-form-item title="库区" title-width="220rpx">
            <view class="min-w-0 flex flex-1 items-center justify-end gap-12rpx">
              <view class="min-w-0 flex-1 truncate text-right text-28rpx" :class="locationDisplayValue ? 'text-[#333]' : 'text-[#999]'" @click="openLocationPicker">
                {{ locationDisplayValue || '请选择库区' }}
              </view>
              <wd-button v-if="formData.locationId !== undefined" size="small" variant="plain" @click.stop="clearLocation">
                清空
              </wd-button>
            </view>
          </wd-form-item>
          <wd-picker v-model:visible="locationPickerVisible" :model-value="locationPickerValue" :columns="locationOptions" label-key="name" value-key="id" @confirm="handleLocationConfirm" />
          <wd-form-item title="库位" title-width="220rpx">
            <view class="min-w-0 flex flex-1 items-center justify-end gap-12rpx">
              <view class="min-w-0 flex-1 truncate text-right text-28rpx" :class="areaDisplayValue ? 'text-[#333]' : 'text-[#999]'" @click="openAreaPicker">
                {{ areaDisplayValue || '请选择库位' }}
              </view>
              <wd-button v-if="formData.areaId !== undefined" size="small" variant="plain" @click.stop="formData.areaId = undefined">
                清空
              </wd-button>
            </view>
          </wd-form-item>
          <wd-picker v-model:visible="areaPickerVisible" :model-value="areaPickerValue" :columns="areaOptions" label-key="name" value-key="id" @confirm="handleAreaConfirm" />
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
      <WorkstationResourceList v-if="currentId" :workstation-id="currentId" mode="edit" />
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
import type { MdWorkstationCreateReqVO } from '@/api/mes/md/workstation'
import type { MdWorkshopVO } from '@/api/mes/md/workstation/workshop'
import type { ProProcessVO } from '@/api/mes/pro/process'
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import type { WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import type { WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createWorkstation, getWorkstation, updateWorkstation } from '@/api/mes/md/workstation'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getWorkshopSimpleList } from '@/api/mes/md/workstation/workshop'
import { getProcessSimpleList } from '@/api/mes/pro/process'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import { getWarehouseAreaSimpleList } from '@/api/mes/wm/warehouse/area'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import WorkstationResourceList from '../components/workstation-resource-list.vue'

const props = defineProps<{ id?: number | string }>()
definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/md/workstation/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑工作站' : '新增工作站')
const formLoading = ref(false)
interface MdWorkstationFormData extends Omit<MdWorkstationCreateReqVO, 'workshopId' | 'processId'> {
  id?: number
  workshopId?: number
  processId?: number
  address: string
  remark: string
}
const formData = ref<MdWorkstationFormData>(getDefaultFormData())
const formSchema = createFormSchema({
  code: [{ required: true, message: '工作站编码不能为空' }],
  name: [{ required: true, message: '工作站名称不能为空' }],
  workshopId: [{ required: true, message: '所在车间不能为空' }],
  processId: [{ required: true, message: '所属工序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>()
const workshopOptions = ref<MdWorkshopVO[]>([])
const workshopPickerVisible = ref(false)
const processOptions = ref<Array<{ id: number, label: string }>>([])
const processPickerVisible = ref(false)
const warehouseOptions = ref<WmWarehouseVO[]>([])
const warehousePickerVisible = ref(false)
const locationOptions = ref<WmWarehouseLocationVO[]>([])
const locationPickerVisible = ref(false)
const areaOptions = ref<WmWarehouseAreaVO[]>([])
const areaPickerVisible = ref(false)
const workshopPickerValue = computed(() => formData.value.workshopId === undefined ? [] : [formData.value.workshopId])
const processPickerValue = computed(() => formData.value.processId === undefined ? [] : [formData.value.processId])
const warehousePickerValue = computed(() => formData.value.warehouseId === undefined ? [] : [formData.value.warehouseId])
const locationPickerValue = computed(() => formData.value.locationId === undefined ? [] : [formData.value.locationId])
const areaPickerValue = computed(() => formData.value.areaId === undefined ? [] : [formData.value.areaId])

const workshopDisplayValue = computed(() => {
  if (formData.value.workshopId === undefined)
    return ''
  const w = workshopOptions.value.find(o => o.id === formData.value.workshopId)
  return w?.name || String(formData.value.workshopId)
})
const processDisplayValue = computed(() => {
  if (formData.value.processId === undefined)
    return ''
  const p = processOptions.value.find(o => o.id === formData.value.processId)
  return p?.label || String(formData.value.processId)
})
const warehouseDisplayValue = computed(() => warehouseOptions.value.find(o => o.id === formData.value.warehouseId)?.name || '')
const locationDisplayValue = computed(() => locationOptions.value.find(o => o.id === formData.value.locationId)?.name || '')
const areaDisplayValue = computed(() => areaOptions.value.find(o => o.id === formData.value.areaId)?.name || '')

function handleBack() {
  navigateBackPlus('/pages-mes/md/workstation/index')
}

function getDefaultFormData(): MdWorkstationFormData {
  return {
    code: '',
    name: '',
    address: '',
    workshopId: undefined,
    processId: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: '',
  }
}

async function loadOptions() {
  const [workshops, processes, warehouses] = await Promise.all([getWorkshopSimpleList(), getProcessSimpleList(), getWarehouseSimpleList()])
  workshopOptions.value = workshops || []
  processOptions.value = (processes || []).filter((process): process is ProProcessVO & { id: number } => process.id !== undefined).map(process => ({ id: process.id, label: process.code ? `${process.name} (${process.code})` : process.name }))
  warehouseOptions.value = warehouses || []
}

function handleWorkshopConfirm({ value }: { value: Array<number | string> }) {
  formData.value.workshopId = Number(value[0])
}

function handleProcessConfirm({ value }: { value: Array<number | string> }) {
  formData.value.processId = Number(value[0])
}

async function handleWarehouseConfirm({ value }: { value: Array<number | string> }) {
  formData.value.warehouseId = Number(value[0])
  formData.value.locationId = undefined
  formData.value.areaId = undefined
  locationOptions.value = await getWarehouseLocationSimpleList(formData.value.warehouseId) || []
  areaOptions.value = []
}

async function handleLocationConfirm({ value }: { value: Array<number | string> }) {
  formData.value.locationId = Number(value[0])
  formData.value.areaId = undefined
  areaOptions.value = await getWarehouseAreaSimpleList(formData.value.locationId) || []
}

function handleAreaConfirm({ value }: { value: Array<number | string> }) {
  formData.value.areaId = Number(value[0])
}

function clearWarehouse() {
  formData.value.warehouseId = undefined
  formData.value.locationId = undefined
  formData.value.areaId = undefined
  locationOptions.value = []
  areaOptions.value = []
}

function clearLocation() {
  formData.value.locationId = undefined
  formData.value.areaId = undefined
  areaOptions.value = []
}

function openLocationPicker() {
  if (!formData.value.warehouseId) {
    uni.showToast({ icon: 'none', title: '请先选择仓库' })
    return
  }
  locationPickerVisible.value = true
}

function openAreaPicker() {
  if (!formData.value.locationId) {
    uni.showToast({ icon: 'none', title: '请先选择库区' })
    return
  }
  areaPickerVisible.value = true
}

async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getWorkstation(currentId.value)
  if (!data) {
    formData.value = getDefaultFormData()
    locationOptions.value = []
    areaOptions.value = []
    return
  }
  if (data.warehouseId)
    locationOptions.value = await getWarehouseLocationSimpleList(data.warehouseId) || []
  if (data.locationId)
    areaOptions.value = await getWarehouseAreaSimpleList(data.locationId) || []
  formData.value = { id: data.id, code: data.code, name: data.name, address: data.address || '', workshopId: data.workshopId, processId: data.processId ?? undefined, warehouseId: data.warehouseId ?? undefined, locationId: data.locationId ?? undefined, areaId: data.areaId ?? undefined, status: data.status, remark: data.remark || '' }
}

async function loadPageData() {
  await loadOptions()
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
  locationOptions.value = []
  areaOptions.value = []
}

async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode('MD_WORKSTATION_CODE')
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

async function handleSubmit() {
  if (!formRef.value)
    return
  const result = await formRef.value.validate()
  if (!result.valid || formData.value.workshopId === undefined || formData.value.processId === undefined) {
    return
  }
  formLoading.value = true
  try {
    const data: MdWorkstationCreateReqVO = { code: formData.value.code, name: formData.value.name, address: formData.value.address || undefined, workshopId: formData.value.workshopId, processId: formData.value.processId, warehouseId: formData.value.warehouseId, locationId: formData.value.locationId, areaId: formData.value.areaId, status: formData.value.status, remark: formData.value.remark || undefined }
    if (currentId.value) {
      await updateWorkstation({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      await createWorkstation(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:md:workstation:reload')
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
