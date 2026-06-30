<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="库区编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="库区名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入库区名称" clearable />
          </wd-form-item>
          <wd-form-item title="所属仓库" title-width="220rpx" prop="warehouseId" is-link :value="warehouseDisplayValue" placeholder="请选择仓库" @click="warehousePickerVisible = true" />
          <wd-picker v-model:visible="warehousePickerVisible" :model-value="warehousePickerValue" :columns="warehouseOptions" label-key="name" value-key="id" @confirm="handleWarehouseConfirm" />
          <wd-form-item title="面积(㎡)" title-width="220rpx" prop="area" center>
            <wd-input-number v-model="formData.area" :min="0" :precision="2" />
          </wd-form-item>
          <wd-cell title="是否冻结" center>
            <view class="flex justify-end">
              <wd-switch v-model="formData.frozen" />
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
import type { WmWarehouseLocationCreateReqVO } from '@/api/mes/wm/warehouse/location'
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createWarehouseLocation, getWarehouseLocation, updateWarehouseLocation } from '@/api/mes/wm/warehouse/location'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()
definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/warehouse/location/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑库区' : '新增库区')
const formLoading = ref(false)
interface WmWarehouseLocationFormData extends Omit<WmWarehouseLocationCreateReqVO, 'warehouseId'> {
  id?: number
  warehouseId?: number
  area: number
  remark: string
}
const formData = ref<WmWarehouseLocationFormData>(getDefaultFormData())

function getDefaultFormData(): WmWarehouseLocationFormData {
  return { code: '', name: '', warehouseId: undefined, area: 0, frozen: false, remark: '' }
}
const formSchema = createFormSchema({
  code: [{ required: true, message: '库区编码不能为空' }],
  name: [{ required: true, message: '库区名称不能为空' }],
  warehouseId: [{ required: true, message: '所属仓库不能为空' }],
})
const formRef = ref<FormInstance>()
const warehouseOptions = ref<WmWarehouseVO[]>([])
const warehousePickerVisible = ref(false)
const warehousePickerValue = computed(() => formData.value.warehouseId === undefined ? [] : [formData.value.warehouseId])
const warehouseDisplayValue = computed(() => {
  if (formData.value.warehouseId === undefined)
    return ''
  const w = warehouseOptions.value.find(o => o.id === formData.value.warehouseId)
  return w?.name || String(formData.value.warehouseId)
})

function handleBack() {
  navigateBackPlus('/pages-mes/wm/warehouse/location/index')
}

async function loadOptions() {
  warehouseOptions.value = await getWarehouseSimpleList() || []
}

function handleWarehouseConfirm({ value }: { value: Array<number | string> }) {
  formData.value.warehouseId = Number(value[0])
}

async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getWarehouseLocation(currentId.value)
  formData.value = { id: data.id, code: data.code, name: data.name, warehouseId: data.warehouseId, area: Number(data.area ?? 0), frozen: data.frozen, remark: data.remark || '' }
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
    formData.value.code = await generateAutoCode('MD_WAREHOUSE_LOCATION_CODE')
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
  if (!result.valid || formData.value.warehouseId === undefined) {
    return
  }
  formLoading.value = true
  try {
    const data: WmWarehouseLocationCreateReqVO = { code: formData.value.code, name: formData.value.name, warehouseId: formData.value.warehouseId, area: formData.value.area, frozen: formData.value.frozen, remark: formData.value.remark || undefined }
    if (currentId.value) {
      await updateWarehouseLocation({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      await createWarehouseLocation(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:warehouse-location:reload')
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
