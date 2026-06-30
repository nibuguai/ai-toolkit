<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="库位编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入库位编码" clearable />
          </wd-form-item>
          <wd-form-item title="库位名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入库位名称" clearable />
          </wd-form-item>
          <wd-form-item title="所属仓库" title-width="220rpx" prop="warehouseId" is-link :value="warehouseDisplayValue" placeholder="请选择仓库" @click="warehousePickerVisible = true" />
          <wd-picker v-model:visible="warehousePickerVisible" :model-value="warehousePickerValue" :columns="warehouseOptions" label-key="name" value-key="id" @confirm="handleWarehouseConfirm" />
          <wd-form-item title="所属库区" title-width="220rpx" prop="locationId" is-link :value="locationDisplayValue" placeholder="请选择库区" @click="openLocationPicker" />
          <wd-picker v-model:visible="locationPickerVisible" :model-value="locationPickerValue" :columns="locationOptions" label-key="name" value-key="id" @confirm="handleLocationConfirm" />
          <wd-form-item title="面积(㎡)" title-width="220rpx" prop="area" center>
            <wd-input-number v-model="formData.area" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="最大载重(kg)" title-width="220rpx" prop="maxLoad" center>
            <wd-input-number v-model="formData.maxLoad" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="位置X" title-width="220rpx" prop="positionX" center>
            <wd-input-number v-model="formData.positionX" :min="0" :precision="0" />
          </wd-form-item>
          <wd-form-item title="位置Y" title-width="220rpx" prop="positionY" center>
            <wd-input-number v-model="formData.positionY" :min="0" :precision="0" />
          </wd-form-item>
          <wd-form-item title="位置Z" title-width="220rpx" prop="positionZ" center>
            <wd-input-number v-model="formData.positionZ" :min="0" :precision="0" />
          </wd-form-item>
          <wd-form-item title="状态" title-width="220rpx" prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-cell title="是否冻结" center>
            <view class="flex justify-end">
              <wd-switch v-model="formData.frozen" />
            </view>
          </wd-cell>
          <wd-cell title="允许物料混放" center>
            <view class="flex justify-end">
              <wd-switch v-model="formData.allowItemMixing" />
            </view>
          </wd-cell>
          <wd-cell title="允许批次混放" center>
            <view class="flex justify-end">
              <wd-switch v-model="formData.allowBatchMixing" />
            </view>
          </wd-cell>
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
import type { WmWarehouseAreaCreateReqVO } from '@/api/mes/wm/warehouse/area'
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import type { WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createWarehouseArea, getWarehouseArea, updateWarehouseArea } from '@/api/mes/wm/warehouse/area'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()
definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/warehouse/area/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑库位' : '新增库位')
const formLoading = ref(false)
interface WmWarehouseAreaFormData extends Omit<WmWarehouseAreaCreateReqVO, 'locationId'> {
  id?: number
  warehouseId?: number
  locationId?: number
  area: number
  maxLoad: number
  positionX: number
  positionY: number
  positionZ: number
  remark: string
}
const formData = ref<WmWarehouseAreaFormData>(getDefaultFormData())

function getDefaultFormData(): WmWarehouseAreaFormData {
  return { code: '', name: '', warehouseId: undefined, locationId: undefined, area: 0, maxLoad: 0, positionX: 0, positionY: 0, positionZ: 0, status: CommonStatusEnum.ENABLE, frozen: false, allowItemMixing: false, allowBatchMixing: false, remark: '' }
}
const formSchema = createFormSchema({ code: [{ required: true, message: '库位编码不能为空' }], name: [{ required: true, message: '库位名称不能为空' }], warehouseId: [{ required: true, message: '所属仓库不能为空' }], locationId: [{ required: true, message: '所属库区不能为空' }], status: [{ required: true, message: '状态不能为空' }] })
const formRef = ref<FormInstance>()
const warehouseOptions = ref<WmWarehouseVO[]>([])
const locationOptions = ref<WmWarehouseLocationVO[]>([])
const warehousePickerVisible = ref(false)
const locationPickerVisible = ref(false)
const warehousePickerValue = computed(() => formData.value.warehouseId !== undefined ? [formData.value.warehouseId] : [])
const locationPickerValue = computed(() => formData.value.locationId !== undefined ? [formData.value.locationId] : [])
const warehouseDisplayValue = computed(() => {
  const w = warehouseOptions.value.find(o => o.id === formData.value.warehouseId)
  return w?.name || ''
})

const locationDisplayValue = computed(() => {
  const l = locationOptions.value.find(o => o.id === formData.value.locationId)
  return l?.name || ''
})

function handleBack() {
  navigateBackPlus('/pages-mes/wm/warehouse/area/index')
}

async function loadOptions() {
  warehouseOptions.value = await getWarehouseSimpleList() || []
}

async function handleWarehouseConfirm({ value }: { value: Array<number | string> }) {
  formData.value.warehouseId = Number(value[0])
  formData.value.locationId = undefined
  locationOptions.value = await getWarehouseLocationSimpleList(formData.value.warehouseId) || []
}

function handleLocationConfirm({ value }: { value: Array<number | string> }) {
  formData.value.locationId = Number(value[0])
}

function openLocationPicker() {
  if (!formData.value.warehouseId) {
    uni.showToast({ icon: 'none', title: '请先选择仓库' })
    return
  }
  locationPickerVisible.value = true
}

async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getWarehouseArea(currentId.value)
  if (data.warehouseId)
    locationOptions.value = await getWarehouseLocationSimpleList(data.warehouseId) || []
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name,
    warehouseId: data.warehouseId ?? undefined,
    locationId: data.locationId,
    area: Number(data.area ?? 0),
    maxLoad: Number(data.maxLoad ?? 0),
    positionX: data.positionX ?? 0,
    positionY: data.positionY ?? 0,
    positionZ: data.positionZ ?? 0,
    status: data.status,
    frozen: data.frozen,
    allowItemMixing: data.allowItemMixing,
    allowBatchMixing: data.allowBatchMixing,
    remark: data.remark || '',
  }
}

async function loadPageData() {
  if (currentId.value) {
    await getDetail()
    return
  }
  locationOptions.value = []
  formData.value = getDefaultFormData()
}

async function handleSubmit() {
  if (!formRef.value)
    return
  const result = await formRef.value.validate()
  if (!result.valid || formData.value.locationId === undefined) {
    return
  }
  formLoading.value = true
  try {
    const data: WmWarehouseAreaCreateReqVO = {
      code: formData.value.code,
      name: formData.value.name,
      locationId: formData.value.locationId,
      area: formData.value.area,
      maxLoad: formData.value.maxLoad,
      positionX: formData.value.positionX,
      positionY: formData.value.positionY,
      positionZ: formData.value.positionZ,
      status: formData.value.status,
      frozen: formData.value.frozen,
      allowItemMixing: formData.value.allowItemMixing,
      allowBatchMixing: formData.value.allowBatchMixing,
      remark: formData.value.remark || undefined,
    }
    if (currentId.value) {
      await updateWarehouseArea({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      await createWarehouseArea(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:warehouse-area:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

onMounted(async () => {
  await loadOptions()
  await loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
