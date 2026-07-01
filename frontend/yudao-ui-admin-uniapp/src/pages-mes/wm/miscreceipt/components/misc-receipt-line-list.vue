<template>
  <MesLineListShell
    title="入库物料"
    :loading="loading"
    :empty="list.length === 0"
    empty-text="暂无入库物料"
    :readonly="readonly"
    add-text="添加物料"
    @add="openCreateForm"
  >
    <view
      v-for="item in list"
      :key="item.id"
      class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
    >
      <view class="mb-12rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1">
          <view class="truncate text-28rpx text-[#333] font-medium">
            {{ item.itemCode || `物料 #${item.itemId}` }}
          </view>
          <view class="mt-4rpx truncate text-26rpx text-[#666]">
            {{ item.itemName || '-' }}
          </view>
        </view>
        <view class="shrink-0 text-right">
          <view class="text-24rpx text-[#999]">
            {{ item.unitMeasureName || '-' }}
          </view>
          <view v-if="!readonly" class="mt-8rpx flex gap-16rpx text-24rpx">
            <text class="text-[#1677ff]" @click.stop="openUpdateForm(item)">
              编辑
            </text>
            <text class="text-[#f56c6c]" @click.stop="handleDelete(item)">
              删除
            </text>
          </view>
        </view>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">入库数量：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">批次号：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">仓储位置：</text>
        <text class="min-w-0 flex-1 truncate">
          {{ item.warehouseName || '-' }} / {{ item.locationName || '-' }} / {{ item.areaName || '-' }}
        </text>
      </view>
      <view class="flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
      </view>
    </view>
  </MesLineListShell>

  <!-- 入库物料表单弹窗 -->
  <!-- TODO @YunaiV：本 wd-popup 去掉 transition="fade" :duration="0"，对齐 system/infra（基线不带这俩属性） -->
  <wd-popup
    v-model="formVisible"
    position="top"
    transition="fade"
    :duration="0"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="formVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ formTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="物料" title-width="220rpx" prop="itemId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openItemSelector">
                <text :class="selectedItemText ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedItemText || '请选择物料' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="入库数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" :min="0.01" :precision="2" />
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
              <wd-input v-model="formData.batchCode" clearable placeholder="请输入批次号" />
            </wd-form-item>
            <wd-form-item title="仓库" title-width="220rpx" prop="warehouseId" is-link :value="warehouseDisplayValue" placeholder="请选择仓库" @click="openWarehousePicker" />
            <wd-picker v-model:visible="warehousePickerVisible" :model-value="warehousePickerValue" :columns="warehouseOptions" label-key="name" value-key="id" @confirm="handleWarehouseConfirm" />
            <wd-form-item title="库区" title-width="220rpx" prop="locationId" is-link :value="locationDisplayValue" placeholder="请选择库区" @click="openLocationPicker" />
            <wd-picker v-model:visible="locationPickerVisible" :model-value="locationPickerValue" :columns="locationOptions" label-key="name" value-key="id" @confirm="handleLocationConfirm" />
            <wd-form-item title="库位" title-width="220rpx" prop="areaId" is-link :value="areaDisplayValue" placeholder="请选择库位" @click="openAreaPicker" />
            <wd-picker v-model:visible="areaPickerVisible" :model-value="areaPickerValue" :columns="areaOptions" label-key="name" value-key="id" @confirm="handleAreaConfirm" />
            <wd-form-item title="物料编码" title-width="220rpx">
              <text>{{ formData.itemCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="物料名称" title-width="220rpx">
              <text>{{ formData.itemName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="规格型号" title-width="220rpx">
              <text>{{ formData.specification || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="单位" title-width="220rpx">
              <text>{{ formData.unitMeasureName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <item-selector ref="itemSelectorRef" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItemVO } from '@/api/mes/md/item'
import type {
  WmMiscReceiptLineCreateReqVO,
  WmMiscReceiptLineVO,
} from '@/api/mes/wm/miscreceipt/line'
import type { WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'
import type { WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import type { WotPickerValue } from '@/utils/wot'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import {
  createMiscReceiptLine,
  deleteMiscReceiptLine,
  getMiscReceiptLinePage,
  updateMiscReceiptLine,
} from '@/api/mes/wm/miscreceipt/line'
import { getWarehouseAreaSimpleList } from '@/api/mes/wm/warehouse/area'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import MesLineListShell from '@/pages-mes/components/mes-line-list-shell.vue'

interface WmMiscReceiptLineFormData extends Partial<WmMiscReceiptLineCreateReqVO> {
  id?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
}

interface ItemSelectorExpose {
  open: () => void
}

const props = defineProps<{
  receiptId?: number
  readonly?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<WmMiscReceiptLineVO[]>([]) // 入库物料列表
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 行表单提交状态
const formRef = ref<FormInstance>() // 行表单引用
const formData = ref<WmMiscReceiptLineFormData>(getDefaultFormData()) // 行表单数据
const itemSelectorRef = ref<ItemSelectorExpose>() // 物料选择器引用
const warehouseOptions = ref<WmWarehouseVO[]>([]) // 仓库选项
const locationOptions = ref<WmWarehouseLocationVO[]>([]) // 库区选项
const areaOptions = ref<WmWarehouseAreaVO[]>([]) // 库位选项
const warehousePickerVisible = ref(false) // 仓库选择器显示
const locationPickerVisible = ref(false) // 库区选择器显示
const areaPickerVisible = ref(false) // 库位选择器显示
const formTitle = computed(() => formData.value.id ? '编辑入库物料' : '添加入库物料')
const selectedItemText = computed(() => {
  if (formData.value.itemCode || formData.value.itemName) {
    return `${formData.value.itemCode || '-'} ${formData.value.itemName || ''}`.trim()
  }
  return formData.value.itemId ? `物料 #${formData.value.itemId}` : ''
})
const warehousePickerValue = computed(() => formData.value.warehouseId !== undefined ? [formData.value.warehouseId] : [])
const locationPickerValue = computed(() => formData.value.locationId !== undefined ? [formData.value.locationId] : [])
const areaPickerValue = computed(() => formData.value.areaId !== undefined ? [formData.value.areaId] : [])
const warehouseDisplayValue = computed(() => getWotPickerFormValue(warehouseOptions.value, formData.value.warehouseId, { labelKey: 'name', valueKey: 'id', placeholder: '' }))
const locationDisplayValue = computed(() => getWotPickerFormValue(locationOptions.value, formData.value.locationId, { labelKey: 'name', valueKey: 'id', placeholder: '' }))
const areaDisplayValue = computed(() => getWotPickerFormValue(areaOptions.value, formData.value.areaId, { labelKey: 'name', valueKey: 'id', placeholder: '' }))
const formSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '入库数量不能为空' },
    { validator: value => Number(value) > 0 || '入库数量必须大于 0' },
  ],
  batchCode: [{ required: true, message: '批次号不能为空' }],
  warehouseId: [{ required: true, message: '仓库不能为空' }],
  locationId: [{ required: true, message: '库区不能为空' }],
  areaId: [{ required: true, message: '库位不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData(): WmMiscReceiptLineFormData {
  return {
    receiptId: props.receiptId,
    itemId: undefined,
    quantity: undefined,
    batchCode: '',
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    remark: '',
    itemCode: '',
    itemName: '',
    specification: '',
    unitMeasureName: '',
  }
}

/** 查询入库物料列表 */
async function getList() {
  if (!props.receiptId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getMiscReceiptLinePage({
      pageNo: 1,
      pageSize: 100,
      receiptId: props.receiptId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 加载仓库选项 */
async function loadWarehouseOptions() {
  if (warehouseOptions.value.length > 0) {
    return
  }
  warehouseOptions.value = await getWarehouseSimpleList() || []
}

/** 打开新增表单 */
async function openCreateForm() {
  if (props.readonly) {
    return
  }
  formData.value = getDefaultFormData()
  locationOptions.value = []
  areaOptions.value = []
  await loadWarehouseOptions()
  formVisible.value = true
}

/** 打开编辑表单 */
async function openUpdateForm(item: WmMiscReceiptLineVO) {
  if (props.readonly) {
    return
  }
  formData.value = {
    id: item.id,
    receiptId: item.receiptId,
    sourceDocLineId: item.sourceDocLineId,
    materialStockId: item.materialStockId,
    itemId: item.itemId,
    itemCode: item.itemCode || '',
    itemName: item.itemName || '',
    specification: item.specification || '',
    unitMeasureName: item.unitMeasureName || '',
    quantity: item.quantity,
    batchId: item.batchId,
    batchCode: item.batchCode || '',
    warehouseId: item.warehouseId,
    locationId: item.locationId,
    areaId: item.areaId,
    remark: item.remark || '',
  }
  await loadWarehouseOptions()
  locationOptions.value = item.warehouseId ? await getWarehouseLocationSimpleList(item.warehouseId) || [] : []
  areaOptions.value = item.locationId ? await getWarehouseAreaSimpleList(item.locationId) || [] : []
  formVisible.value = true
}

/** 打开物料选择器 */
function openItemSelector() {
  if (props.readonly) {
    return
  }
  itemSelectorRef.value?.open()
}

/** 确认选择物料 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  formData.value.itemId = item.id
  formData.value.itemCode = item.code || ''
  formData.value.itemName = item.name || ''
  formData.value.specification = item.specification || ''
  formData.value.unitMeasureName = item.unitMeasureName || ''
}

/** 打开仓库选择 */
async function openWarehousePicker() {
  if (props.readonly) {
    return
  }
  await loadWarehouseOptions()
  warehousePickerVisible.value = true
}

/** 选择仓库 */
async function handleWarehouseConfirm({ value }: { value: WotPickerValue[] }) {
  const warehouseId = Number(value[0])
  formData.value.warehouseId = warehouseId
  formData.value.locationId = undefined
  formData.value.areaId = undefined
  locationOptions.value = await getWarehouseLocationSimpleList(warehouseId) || []
  areaOptions.value = []
}

/** 打开库区选择 */
function openLocationPicker() {
  if (props.readonly) {
    return
  }
  if (!formData.value.warehouseId) {
    toast.warning('请先选择仓库')
    return
  }
  locationPickerVisible.value = true
}

/** 选择库区 */
async function handleLocationConfirm({ value }: { value: WotPickerValue[] }) {
  const locationId = Number(value[0])
  formData.value.locationId = locationId
  formData.value.areaId = undefined
  areaOptions.value = await getWarehouseAreaSimpleList(locationId) || []
}

/** 打开库位选择 */
function openAreaPicker() {
  if (props.readonly) {
    return
  }
  if (!formData.value.locationId) {
    toast.warning('请先选择库区')
    return
  }
  areaPickerVisible.value = true
}

/** 选择库位 */
function handleAreaConfirm({ value }: { value: WotPickerValue[] }) {
  formData.value.areaId = Number(value[0])
}

/** 构造提交数据 */
function buildSubmitData(): WmMiscReceiptLineCreateReqVO {
  if (
    !props.receiptId
    || !formData.value.itemId
    || !formData.value.quantity
    || !formData.value.batchCode
    || !formData.value.warehouseId
    || !formData.value.locationId
    || !formData.value.areaId
  ) {
    throw new Error('入库物料必填项不能为空')
  }
  return {
    receiptId: props.receiptId,
    sourceDocLineId: formData.value.sourceDocLineId,
    materialStockId: formData.value.materialStockId,
    itemId: formData.value.itemId,
    quantity: formData.value.quantity,
    batchId: formData.value.batchId,
    batchCode: formData.value.batchCode,
    warehouseId: formData.value.warehouseId,
    locationId: formData.value.locationId,
    areaId: formData.value.areaId,
    remark: formData.value.remark || undefined,
  }
}

/** 提交入库物料 */
async function handleSubmit() {
  if (props.readonly) {
    return
  }
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (formData.value.id) {
      await updateMiscReceiptLine({ ...data, id: formData.value.id })
      toast.success('修改成功')
    } else {
      await createMiscReceiptLine(data)
      toast.success('添加成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除入库物料 */
async function handleDelete(item: WmMiscReceiptLineVO) {
  if (props.readonly) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteMiscReceiptLine(item.id)
  toast.success('删除成功')
  await getList()
}

watch(
  () => props.receiptId,
  () => {
    getList()
  },
  { immediate: true },
)
</script>
