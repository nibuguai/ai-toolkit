<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        盘点结果
      </view>
      <view
        v-if="editable"
        class="border border-[#1677ff] rounded-8rpx px-20rpx py-8rpx text-24rpx text-[#1677ff]"
        @click.stop="openCreateForm"
      >
        新增
      </view>
      <view v-else class="text-24rpx text-[#999]">
        只读
      </view>
    </view>
    <view v-if="loading" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      暂无盘点结果
    </view>
    <view v-else class="px-24rpx py-8rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
      >
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333] font-medium">
              {{ item.itemCode || '-' }}
            </view>
            <view class="mt-4rpx truncate text-26rpx text-[#666]">
              {{ item.itemName || '-' }}
            </view>
          </view>
          <view class="shrink-0 text-28rpx text-[#1677ff] font-semibold">
            {{ item.quantity ?? '-' }}
          </view>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">单位：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.unitMeasureName || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">批次：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
        </view>
        <view class="flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">库存位置：</text>
          <text class="min-w-0 flex-1 truncate">
            {{ item.warehouseName || '-' }} / {{ item.locationName || '-' }} / {{ item.areaName || '-' }}
          </text>
        </view>
        <view v-if="editable" class="mt-16rpx flex border-t border-t-[#f0f0f0] pt-16rpx text-center text-26rpx">
          <view class="flex-1 text-[#1677ff]" @click.stop="openUpdateForm(item)">
            编辑
          </view>
          <view class="flex-1 text-[#f56c6c]" @click.stop="handleDeleteResult(item)">
            删除
          </view>
        </view>
      </view>
    </view>
  </view>

  <!-- 盘点结果表单 -->
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
        <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmitForm">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item
              v-if="isCreateMode"
              title="盘点清单"
              title-width="220rpx"
              :is-link="true"
              :value="lineDisplayValue"
              placeholder="请选择盘点清单（可选）"
              @click="openLinePicker"
            />
            <wd-form-item title="物料" title-width="220rpx" prop="itemId">
              <view
                class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx"
                @click.stop="openItemSelector"
              >
                <text :class="itemDisplayValue ? 'text-[#333]' : 'text-[#999]'">
                  {{ itemDisplayValue || '请选择物料' }}
                </text>
                <wd-icon v-if="!isLineSelected" name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="批次编码" title-width="220rpx" prop="batchCode">
              <wd-input v-model="formData.batchCode" clearable :disabled="isLineSelected" placeholder="请输入批次编码" />
            </wd-form-item>
            <wd-form-item title="盘点数量" title-width="220rpx" prop="takingQuantity" center>
              <wd-input-number v-model="formData.takingQuantity" :min="0" :precision="2" />
            </wd-form-item>
            <wd-form-item
              title="仓库"
              title-width="220rpx"
              prop="warehouseId"
              :is-link="!isLineSelected"
              :value="warehouseDisplayValue"
              placeholder="请选择仓库"
              @click="openWarehousePicker"
            />
            <wd-form-item
              title="库区"
              title-width="220rpx"
              prop="locationId"
              :is-link="!isLineSelected"
              :value="locationDisplayValue"
              placeholder="请选择库区"
              @click="openLocationPicker"
            />
            <wd-form-item
              title="库位"
              title-width="220rpx"
              prop="areaId"
              :is-link="!isLineSelected"
              :value="areaDisplayValue"
              placeholder="请选择库位"
              @click="openAreaPicker"
            />
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <!-- 选择器 -->
  <wd-picker
    v-model:visible="linePickerVisible"
    :model-value="linePickerValue"
    :columns="taskLineOptions"
    label-key="label"
    value-key="id"
    @confirm="handleLineConfirm"
  />
  <wd-picker
    v-model:visible="warehousePickerVisible"
    :model-value="warehousePickerValue"
    :columns="warehouseOptions"
    label-key="name"
    value-key="id"
    @confirm="handleWarehouseConfirm"
  />
  <wd-picker
    v-model:visible="locationPickerVisible"
    :model-value="locationPickerValue"
    :columns="locationOptions"
    label-key="name"
    value-key="id"
    @confirm="handleLocationConfirm"
  />
  <wd-picker
    v-model:visible="areaPickerVisible"
    :model-value="areaPickerValue"
    :columns="areaOptions"
    label-key="name"
    value-key="id"
    @confirm="handleAreaConfirm"
  />
  <ItemSelector ref="itemSelectorRef" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
import type { MdItemVO } from '@/api/mes/md/item'
import type {
  StockTakingResultCreateReqVO,
  StockTakingResultVO,
} from '@/api/mes/wm/stocktaking/task/result'
import type { StockTakingTaskLineVO } from '@/api/mes/wm/stocktaking/task/line'
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import type { WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'
import type { WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import type { WotPickerValue } from '@/utils/wot'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { getWarehouseAreaSimpleList } from '@/api/mes/wm/warehouse/area'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import { getStockTakingTaskLineSimpleList } from '@/api/mes/wm/stocktaking/task/line'
import {
  createStockTakingResult,
  deleteStockTakingResult,
  getStockTakingResult,
  getStockTakingResultPage,
  updateStockTakingResult,
} from '@/api/mes/wm/stocktaking/task/result'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'

interface TaskLineOption extends StockTakingTaskLineVO {
  label: string
}

interface ResultFormData {
  id?: number
  taskId?: number
  lineId?: number
  materialStockId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  batchId?: number
  batchCode?: string
  warehouseId?: number
  locationId?: number
  areaId?: number
  takingQuantity?: number
  remark?: string
}

const props = defineProps<{
  editable?: boolean
  taskId?: number
}>()

const toast = useToast()
const list = ref<StockTakingResultVO[]>([]) // 结果数据
const loading = ref(false) // 加载状态
const formVisible = ref(false) // 表单弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const formType = ref<'create' | 'update'>('create') // 表单类型
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<ResultFormData>(getDefaultFormData()) // 表单数据
const taskLineOptions = ref<TaskLineOption[]>([]) // 盘点清单选项
const warehouseOptions = ref<WmWarehouseVO[]>([]) // 仓库选项
const locationOptions = ref<WmWarehouseLocationVO[]>([]) // 库区选项
const areaOptions = ref<WmWarehouseAreaVO[]>([]) // 库位选项
const linePickerVisible = ref(false) // 清单选择器显示状态
const warehousePickerVisible = ref(false) // 仓库选择器显示状态
const locationPickerVisible = ref(false) // 库区选择器显示状态
const areaPickerVisible = ref(false) // 库位选择器显示状态
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器
const selectedItem = ref<MdItemVO>() // 已选物料
const isCreateMode = computed(() => formType.value === 'create')
const isLineSelected = computed(() => isCreateMode.value && formData.value.lineId !== undefined)
const formTitle = computed(() => isCreateMode.value ? '新增盘点结果' : '编辑盘点结果')
const linePickerValue = computed(() => formData.value.lineId === undefined ? [] : [formData.value.lineId])
const warehousePickerValue = computed(() => formData.value.warehouseId === undefined ? [] : [formData.value.warehouseId])
const locationPickerValue = computed(() => formData.value.locationId === undefined ? [] : [formData.value.locationId])
const areaPickerValue = computed(() => formData.value.areaId === undefined ? [] : [formData.value.areaId])
const lineDisplayValue = computed(() => {
  const line = taskLineOptions.value.find(item => item.id === formData.value.lineId)
  return line?.label || ''
})
const itemDisplayValue = computed(() => {
  if (selectedItem.value) {
    return `${selectedItem.value.code || '-'} ${selectedItem.value.name || ''}`.trim()
  }
  if (formData.value.itemCode || formData.value.itemName) {
    return `${formData.value.itemCode || '-'} ${formData.value.itemName || ''}`.trim()
  }
  return ''
})
const warehouseDisplayValue = computed(() => getWotPickerFormValue(warehouseOptions.value, formData.value.warehouseId, {
  labelKey: 'name',
  placeholder: '',
  valueKey: 'id',
}))
const locationDisplayValue = computed(() => getWotPickerFormValue(locationOptions.value, formData.value.locationId, {
  labelKey: 'name',
  placeholder: '',
  valueKey: 'id',
}))
const areaDisplayValue = computed(() => getWotPickerFormValue(areaOptions.value, formData.value.areaId, {
  labelKey: 'name',
  placeholder: '',
  valueKey: 'id',
}))
const formSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  warehouseId: [{ required: true, message: '仓库不能为空' }],
  locationId: [{ required: true, message: '库区不能为空' }],
  areaId: [{ required: true, message: '库位不能为空' }],
  takingQuantity: [{ required: true, message: '盘点数量不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData(): ResultFormData {
  return {
    id: undefined,
    taskId: props.taskId,
    lineId: undefined,
    materialStockId: undefined,
    itemId: undefined,
    itemCode: '',
    itemName: '',
    batchId: undefined,
    batchCode: '',
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    takingQuantity: undefined,
    remark: '',
  }
}

/** 加载盘点结果 */
async function loadList() {
  if (!props.taskId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getStockTakingResultPage({
      pageNo: 1,
      pageSize: 100,
      taskId: props.taskId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 加载基础选项 */
async function loadBaseOptions() {
  warehouseOptions.value = await getWarehouseSimpleList() || []
}

/** 加载任务行选项 */
async function loadTaskLineOptions() {
  if (!props.taskId) {
    taskLineOptions.value = []
    return
  }
  const rows = await getStockTakingTaskLineSimpleList(props.taskId)
  taskLineOptions.value = rows.map(row => ({
    ...row,
    label: `${row.itemCode || '-'} - ${row.itemName || '-'} (${[
      row.warehouseName,
      row.locationName,
      row.areaName,
    ].filter(Boolean).join(' / ') || '-'})`,
  }))
}

/** 打开新增表单 */
async function openCreateForm() {
  formType.value = 'create'
  formData.value = getDefaultFormData()
  selectedItem.value = undefined
  await loadTaskLineOptions()
  formVisible.value = true
}

/** 打开编辑表单 */
async function openUpdateForm(item: StockTakingResultVO) {
  if (!item.id) {
    return
  }
  formType.value = 'update'
  selectedItem.value = undefined
  formVisible.value = true
  formLoading.value = true
  try {
    const data = await getStockTakingResult(item.id)
    formData.value = {
      id: data.id,
      taskId: data.taskId,
      lineId: data.lineId,
      materialStockId: data.materialStockId,
      itemId: data.itemId,
      itemCode: data.itemCode || '',
      itemName: data.itemName || '',
      batchId: data.batchId,
      batchCode: data.batchCode || '',
      warehouseId: data.warehouseId,
      locationId: data.locationId,
      areaId: data.areaId,
      takingQuantity: data.quantity,
      remark: data.remark || '',
    }
    await loadLocationAndAreaOptions()
  } finally {
    formLoading.value = false
  }
}

/** 打开清单选择器 */
function openLinePicker() {
  linePickerVisible.value = true
}

/** 选择盘点清单 */
async function handleLineConfirm({ value }: { value: WotPickerValue[] }) {
  const lineId = Number(value[0])
  const line = taskLineOptions.value.find(item => item.id === lineId)
  if (!line) {
    return
  }
  formData.value.lineId = line.id
  formData.value.materialStockId = line.materialStockId
  formData.value.itemId = line.itemId
  formData.value.itemCode = line.itemCode
  formData.value.itemName = line.itemName
  formData.value.batchId = line.batchId
  formData.value.batchCode = line.batchCode
  formData.value.warehouseId = line.warehouseId
  formData.value.locationId = line.locationId
  formData.value.areaId = line.areaId
  selectedItem.value = undefined
  await loadLocationAndAreaOptions()
}

/** 打开物料选择 */
function openItemSelector() {
  if (isLineSelected.value) {
    return
  }
  itemSelectorRef.value?.open()
}

/** 确认物料选择 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  selectedItem.value = item
  formData.value.itemId = item.id
  formData.value.itemCode = item.code
  formData.value.itemName = item.name
}

/** 打开仓库选择 */
function openWarehousePicker() {
  if (isLineSelected.value) {
    return
  }
  warehousePickerVisible.value = true
}

/** 选择仓库 */
async function handleWarehouseConfirm({ value }: { value: WotPickerValue[] }) {
  formData.value.warehouseId = Number(value[0])
  formData.value.locationId = undefined
  formData.value.areaId = undefined
  locationOptions.value = await getWarehouseLocationSimpleList(formData.value.warehouseId) || []
  areaOptions.value = []
}

/** 打开库区选择 */
async function openLocationPicker() {
  if (isLineSelected.value) {
    return
  }
  if (!formData.value.warehouseId) {
    uni.showToast({ title: '请先选择仓库', icon: 'none' })
    return
  }
  if (locationOptions.value.length === 0) {
    locationOptions.value = await getWarehouseLocationSimpleList(formData.value.warehouseId) || []
  }
  locationPickerVisible.value = true
}

/** 选择库区 */
async function handleLocationConfirm({ value }: { value: WotPickerValue[] }) {
  formData.value.locationId = Number(value[0])
  formData.value.areaId = undefined
  areaOptions.value = await getWarehouseAreaSimpleList(formData.value.locationId) || []
}

/** 打开库位选择 */
async function openAreaPicker() {
  if (isLineSelected.value) {
    return
  }
  if (!formData.value.locationId) {
    uni.showToast({ title: '请先选择库区', icon: 'none' })
    return
  }
  if (areaOptions.value.length === 0) {
    areaOptions.value = await getWarehouseAreaSimpleList(formData.value.locationId) || []
  }
  areaPickerVisible.value = true
}

/** 选择库位 */
function handleAreaConfirm({ value }: { value: WotPickerValue[] }) {
  formData.value.areaId = Number(value[0])
}

/** 加载库区和库位选项 */
async function loadLocationAndAreaOptions() {
  if (formData.value.warehouseId) {
    locationOptions.value = await getWarehouseLocationSimpleList(formData.value.warehouseId) || []
  }
  if (formData.value.locationId) {
    areaOptions.value = await getWarehouseAreaSimpleList(formData.value.locationId) || []
  }
}

/** 构造提交数据 */
function buildSubmitData(): StockTakingResultCreateReqVO {
  if (!props.taskId || !formData.value.itemId || !formData.value.warehouseId || !formData.value.locationId || !formData.value.areaId || formData.value.takingQuantity === undefined) {
    throw new Error('盘点结果必填字段不完整')
  }
  return {
    taskId: props.taskId,
    lineId: formData.value.lineId,
    materialStockId: formData.value.materialStockId,
    itemId: formData.value.itemId,
    batchId: formData.value.batchId,
    batchCode: formData.value.batchCode || undefined,
    warehouseId: formData.value.warehouseId,
    locationId: formData.value.locationId,
    areaId: formData.value.areaId,
    takingQuantity: formData.value.takingQuantity,
    remark: formData.value.remark || undefined,
  }
}

/** 提交表单 */
async function handleSubmitForm() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (formType.value === 'create') {
      await createStockTakingResult(data)
      toast.success('新增成功')
    } else if (formData.value.id) {
      await updateStockTakingResult({ ...data, id: formData.value.id })
      toast.success('修改成功')
    }
    formVisible.value = false
    await loadList()
  } finally {
    formLoading.value = false
  }
}

/** 删除盘点结果 */
async function handleDeleteResult(item: StockTakingResultVO) {
  if (!item.id) {
    return
  }
  const { confirm } = await uni.showModal({
    title: '删除确认',
    content: `确定要删除盘点结果「${item.itemCode || item.itemName || item.id}」吗？`,
  })
  if (!confirm) {
    return
  }
  await deleteStockTakingResult(item.id)
  toast.success('删除成功')
  await loadList()
}

watch(() => props.taskId, loadList)

/** 初始化 */
onMounted(() => {
  loadBaseOptions()
  loadList()
})

defineExpose({
  loadList,
})
</script>
