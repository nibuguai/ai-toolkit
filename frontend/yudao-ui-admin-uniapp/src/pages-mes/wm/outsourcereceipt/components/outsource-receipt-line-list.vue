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
          <view v-if="stockMode" class="mt-8rpx text-24rpx text-[#1677ff]" @click.stop="openCreateDetailForm(item)">
            添加上架
          </view>
        </view>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">批次号：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">入库数量：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">生产日期：</text>
        <text class="min-w-0 flex-1 truncate">{{ formatDate(item.productionDate) || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">有效期：</text>
        <text class="min-w-0 flex-1 truncate">{{ formatDate(item.expireDate) || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">生产批号：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.lotNumber || '-' }}</text>
      </view>
      <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">需要质检：</text>
        <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(item.iqcCheckFlag))" />
      </view>
      <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">质量状态：</text>
        <dict-tag v-if="item.qualityStatus != null" :type="DICT_TYPE.MES_WM_QUALITY_STATUS" :value="item.qualityStatus" />
        <text v-else>-</text>
      </view>
      <view class="flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
      </view>

      <view class="mt-16rpx rounded-12rpx bg-[#f8fafc] p-16rpx">
        <view class="mb-12rpx flex items-center justify-between">
          <view class="text-26rpx text-[#333] font-medium">
            上架明细
          </view>
          <view v-if="stockMode" class="text-24rpx text-[#1677ff]" @click.stop="openCreateDetailForm(item)">
            添加上架
          </view>
        </view>
        <view v-if="isDetailLoading(item.id)" class="py-12rpx text-24rpx text-[#999]">
          加载中...
        </view>
        <view v-else-if="getDetailList(item.id).length === 0" class="py-12rpx text-24rpx text-[#999]">
          暂无上架明细
        </view>
        <view
          v-for="detail in getDetailList(item.id)"
          v-else
          :key="detail.id"
          class="mb-12rpx rounded-8rpx bg-white p-16rpx last:mb-0"
        >
          <view class="mb-8rpx text-26rpx text-[#333]">
            {{ detail.warehouseName || '-' }} / {{ detail.locationName || '-' }} / {{ detail.areaName || '-' }}
          </view>
          <view class="mb-8rpx text-24rpx text-[#666]">
            上架数量：{{ detail.quantity ?? '-' }}
          </view>
          <view v-if="detail.remark" class="text-24rpx text-[#666]">
            备注：{{ detail.remark }}
          </view>
          <view v-if="stockMode" class="mt-12rpx flex rounded-8rpx bg-[#f7f8fa] text-24rpx">
            <view class="flex-1 py-12rpx text-center text-[#1677ff]" @click.stop="openUpdateDetailForm(item, detail)">
              编辑
            </view>
            <view class="flex-1 py-12rpx text-center text-[#f56c6c]" @click.stop="handleDeleteDetail(detail)">
              删除
            </view>
          </view>
        </view>
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
              <text>{{ formData.batchCode || '系统自动生成' }}</text>
            </wd-form-item>
            <wd-form-item
              title="生产日期"
              title-width="220rpx"
              prop="productionDate"
              is-link
              placeholder="请选择生产日期"
              :value="formatDate(formData.productionDate)"
              @click="pickerVisible.productionDate = true"
            />
            <wd-datetime-picker v-model="formData.productionDate" v-model:visible="pickerVisible.productionDate" title="请选择生产日期" type="date" />
            <wd-form-item
              title="有效期"
              title-width="220rpx"
              prop="expireDate"
              is-link
              placeholder="请选择有效期"
              :value="formatDate(formData.expireDate)"
              @click="pickerVisible.expireDate = true"
            />
            <wd-datetime-picker v-model="formData.expireDate" v-model:visible="pickerVisible.expireDate" title="请选择有效期" type="date" />
            <wd-form-item title="生产批号" title-width="220rpx" prop="lotNumber">
              <wd-input v-model="formData.lotNumber" placeholder="请输入生产批号" clearable />
            </wd-form-item>
            <wd-form-item title="需要质检" title-width="220rpx" prop="iqcCheckFlag">
              <wd-switch v-model="formData.iqcCheckFlag" />
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
  <ItemSelector ref="itemSelectorRef" :multiple="false" @confirm="handleItemConfirm" />

  <!-- 上架明细表单弹窗 -->
  <!-- TODO @YunaiV：本 wd-popup 去掉 transition="fade" :duration="0"，对齐 system/infra（基线不带这俩属性） -->
  <wd-popup
    v-model="detailFormVisible"
    position="top"
    transition="fade"
    :duration="0"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="detailFormVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ detailFormTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="detailFormLoading" @click="handleSubmitDetail">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="detailFormRef" :model="detailFormData" :schema="detailFormSchema">
          <wd-cell-group border>
            <wd-form-item title="物料" title-width="220rpx" prop="itemId">
              <text>{{ detailSelectedItemText || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx" prop="batchId">
              <text>{{ detailBatchCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="入库仓库" title-width="220rpx" prop="warehouseId" is-link :value="warehouseDisplayValue" placeholder="请选择仓库" @click="warehousePickerVisible = true" />
            <wd-picker v-model:visible="warehousePickerVisible" :model-value="warehousePickerValue" :columns="warehouseOptions" label-key="name" value-key="id" @confirm="handleWarehouseConfirm" />
            <wd-form-item title="库区" title-width="220rpx" prop="locationId" is-link :value="locationDisplayValue" placeholder="请选择库区" @click="openLocationPicker" />
            <wd-picker v-model:visible="locationPickerVisible" :model-value="locationPickerValue" :columns="locationOptions" label-key="name" value-key="id" @confirm="handleLocationConfirm" />
            <wd-form-item title="库位" title-width="220rpx" prop="areaId" is-link :value="areaDisplayValue" placeholder="请选择库位" @click="openAreaPicker" />
            <wd-picker v-model:visible="areaPickerVisible" :model-value="areaPickerValue" :columns="areaOptions" label-key="name" value-key="id" @confirm="handleAreaConfirm" />
            <wd-form-item title="上架数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="detailFormData.quantity" :min="0.01" :max="detailQuantityMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="detailFormData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItemVO } from '@/api/mes/md/item'
import type {
  WmOutsourceReceiptDetailCreateReqVO,
  WmOutsourceReceiptDetailVO,
} from '@/api/mes/wm/outsourcereceipt/detail'
import type {
  WmOutsourceReceiptLineCreateReqVO,
  WmOutsourceReceiptLineVO,
} from '@/api/mes/wm/outsourcereceipt/line'
import type { WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'
import type { WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import type { WotPickerValue } from '@/utils/wot'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import {
  createOutsourceReceiptDetail,
  deleteOutsourceReceiptDetail,
  getOutsourceReceiptDetailListByLineId,
  updateOutsourceReceiptDetail,
} from '@/api/mes/wm/outsourcereceipt/detail'
import {
  createOutsourceReceiptLine,
  deleteOutsourceReceiptLine,
  getOutsourceReceiptLinePage,
  updateOutsourceReceiptLine,
} from '@/api/mes/wm/outsourcereceipt/line'
import { getWarehouseAreaSimpleList } from '@/api/mes/wm/warehouse/area'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import MesLineListShell from '@/pages-mes/components/mes-line-list-shell.vue'
import ItemSelector from '../../../md/item/components/item-selector.vue'

interface WmOutsourceReceiptLineFormData extends WmOutsourceReceiptLineCreateReqVO {
  id?: number
  batchId?: number
  batchCode?: string
}

interface WmOutsourceReceiptDetailFormData extends WmOutsourceReceiptDetailCreateReqVO {
  id?: number
}

interface SelectedItemPreview {
  id: number
  code?: string
  name?: string
  specification?: string
  unitMeasureName?: string
}

const props = defineProps<{
  receiptId?: number
  readonly?: boolean
  stockMode?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<WmOutsourceReceiptLineVO[]>([]) // 入库物料列表
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 行表单提交状态
const formRef = ref<FormInstance>() // 行表单引用
const formData = ref<WmOutsourceReceiptLineFormData>(getDefaultFormData()) // 行表单数据
const detailFormVisible = ref(false) // 上架明细表单显示状态
const detailFormLoading = ref(false) // 上架明细提交状态
const detailFormRef = ref<FormInstance>() // 上架明细表单引用
const detailFormData = ref<WmOutsourceReceiptDetailFormData>(getDefaultDetailFormData()) // 上架明细表单数据
const detailSelectedItem = ref<SelectedItemPreview>() // 上架明细当前物料
const selectedItem = ref<SelectedItemPreview>() // 当前选择物料
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器状态
const detailMap = ref<Record<number, WmOutsourceReceiptDetailVO[]>>({}) // 行编号对应上架明细
const detailLoadingMap = ref<Record<number, boolean>>({}) // 行编号对应明细加载状态
const warehouseOptions = ref<WmWarehouseVO[]>([]) // 仓库选项
const locationOptions = ref<WmWarehouseLocationVO[]>([]) // 库区选项
const areaOptions = ref<WmWarehouseAreaVO[]>([]) // 库位选项
const warehousePickerVisible = ref(false) // 仓库选择器显示
const locationPickerVisible = ref(false) // 库区选择器显示
const areaPickerVisible = ref(false) // 库位选择器显示
const detailBatchCode = ref('') // 上架明细展示批次号
const detailQuantityMax = ref<number>() // 上架数量上限
const formTitle = computed(() => formData.value.id ? '编辑入库物料' : '添加入库物料')
const detailFormTitle = computed(() => detailFormData.value.id ? '编辑上架明细' : '添加上架明细')
const selectedItemText = computed(() => {
  if (!selectedItem.value) {
    return formData.value.itemId ? `物料 #${formData.value.itemId}` : ''
  }
  return `${selectedItem.value.code || '-'} ${selectedItem.value.name || ''}`.trim()
})
const detailSelectedItemText = computed(() => {
  if (!detailSelectedItem.value) {
    return ''
  }
  return `${detailSelectedItem.value.code || '-'} ${detailSelectedItem.value.name || ''}`.trim()
})
const warehousePickerValue = computed(() => detailFormData.value.warehouseId !== undefined ? [detailFormData.value.warehouseId] : [])
const locationPickerValue = computed(() => detailFormData.value.locationId !== undefined ? [detailFormData.value.locationId] : [])
const areaPickerValue = computed(() => detailFormData.value.areaId !== undefined ? [detailFormData.value.areaId] : [])
const warehouseDisplayValue = computed(() => getWotPickerFormValue(warehouseOptions.value, detailFormData.value.warehouseId, { labelKey: 'name', valueKey: 'id', placeholder: '' }))
const locationDisplayValue = computed(() => getWotPickerFormValue(locationOptions.value, detailFormData.value.locationId, { labelKey: 'name', valueKey: 'id', placeholder: '' }))
const areaDisplayValue = computed(() => getWotPickerFormValue(areaOptions.value, detailFormData.value.areaId, { labelKey: 'name', valueKey: 'id', placeholder: '' }))
const formSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '入库数量不能为空' },
    { validator: value => Number(value) > 0 || '入库数量必须大于 0' },
  ],
})
const detailFormSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  warehouseId: [{ required: true, message: '入库仓库不能为空' }],
  locationId: [{ required: true, message: '库区不能为空' }],
  areaId: [{ required: true, message: '库位不能为空' }],
  quantity: [
    { required: true, message: '上架数量不能为空' },
    { validator: value => Number(value) > 0 || '上架数量必须大于 0' },
    { validator: value => !detailQuantityMax.value || Number(value) <= detailQuantityMax.value || `上架数量不能大于入库数量 ${detailQuantityMax.value}` },
  ],
})

/** 默认入库物料表单数据 */
function getDefaultFormData(): WmOutsourceReceiptLineFormData {
  return {
    receiptId: props.receiptId || 0,
    itemId: undefined,
    quantity: undefined,
    productionDate: undefined,
    expireDate: undefined,
    lotNumber: '',
    iqcCheckFlag: false,
    remark: '',
  }
}

/** 默认上架明细表单数据 */
function getDefaultDetailFormData(): WmOutsourceReceiptDetailFormData {
  return {
    lineId: 0,
    receiptId: props.receiptId || 0,
    itemId: undefined,
    quantity: undefined,
    batchId: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    remark: '',
  }
}

/** 查询入库物料列表 */
async function getList() {
  if (!props.receiptId) {
    list.value = []
    detailMap.value = {}
    return
  }
  loading.value = true
  try {
    const data = await getOutsourceReceiptLinePage({
      pageNo: 1,
      pageSize: 100,
      receiptId: props.receiptId,
    })
    list.value = data.list
    await Promise.all(list.value.map(item => getDetailListByLine(item.id)))
  } finally {
    loading.value = false
  }
}

/** 查询单行上架明细 */
async function getDetailListByLine(lineId: number) {
  detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: true }
  try {
    const data = await getOutsourceReceiptDetailListByLineId(lineId)
    detailMap.value = { ...detailMap.value, [lineId]: data }
  } finally {
    detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: false }
  }
}

/** 获取单行上架明细 */
function getDetailList(lineId: number) {
  return detailMap.value[lineId] || []
}

/** 判断单行上架明细是否加载中 */
function isDetailLoading(lineId: number) {
  return !!detailLoadingMap.value[lineId]
}

/** 打开新增表单 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  selectedItem.value = undefined
  formVisible.value = true
}

/** 打开编辑表单 */
function openUpdateForm(item: WmOutsourceReceiptLineVO) {
  formData.value = {
    id: item.id,
    receiptId: item.receiptId,
    itemId: item.itemId,
    quantity: item.quantity,
    batchId: item.batchId,
    batchCode: item.batchCode || '',
    productionDate: item.productionDate,
    expireDate: item.expireDate,
    lotNumber: item.lotNumber || '',
    iqcCheckFlag: Boolean(item.iqcCheckFlag),
    remark: item.remark || '',
  }
  selectedItem.value = {
    id: item.itemId,
    code: item.itemCode || '',
    name: item.itemName || '',
    specification: item.specification || '',
    unitMeasureName: item.unitMeasureName || '',
  }
  formVisible.value = true
}

/** 打开物料选择器 */
function openItemSelector() {
  itemSelectorRef.value?.open()
}

/** 选择物料 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  selectedItem.value = item
  formData.value.itemId = item.id
}

/** 提交入库物料 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!props.receiptId) {
    return
  }
  formLoading.value = true
  try {
    const data: WmOutsourceReceiptLineCreateReqVO = {
      receiptId: props.receiptId,
      itemId: formData.value.itemId,
      quantity: formData.value.quantity,
      productionDate: formData.value.productionDate,
      expireDate: formData.value.expireDate,
      lotNumber: formData.value.lotNumber || undefined,
      iqcCheckFlag: formData.value.iqcCheckFlag,
      remark: formData.value.remark || undefined,
    }
    if (formData.value.id) {
      await updateOutsourceReceiptLine({ ...data, id: formData.value.id })
      toast.success('修改成功')
    } else {
      await createOutsourceReceiptLine(data)
      toast.success('添加成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除入库物料 */
async function handleDelete(item: WmOutsourceReceiptLineVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteOutsourceReceiptLine(item.id)
  toast.success('删除成功')
  await getList()
}

/** 加载仓库选项 */
async function loadWarehouseOptions() {
  if (warehouseOptions.value.length > 0) {
    return
  }
  warehouseOptions.value = await getWarehouseSimpleList() || []
}

/** 打开新增上架明细表单 */
async function openCreateDetailForm(line: WmOutsourceReceiptLineVO) {
  detailFormData.value = {
    ...getDefaultDetailFormData(),
    lineId: line.id,
    receiptId: props.receiptId || line.receiptId,
    itemId: line.itemId,
    batchId: line.batchId,
    quantity: line.quantity,
  }
  detailSelectedItem.value = {
    id: line.itemId,
    code: line.itemCode || '',
    name: line.itemName || '',
    specification: line.specification || '',
    unitMeasureName: line.unitMeasureName || '',
  }
  detailBatchCode.value = line.batchCode || ''
  detailQuantityMax.value = line.quantity
  locationOptions.value = []
  areaOptions.value = []
  await loadWarehouseOptions()
  detailFormVisible.value = true
}

/** 打开编辑上架明细表单 */
async function openUpdateDetailForm(line: WmOutsourceReceiptLineVO, detail: WmOutsourceReceiptDetailVO) {
  detailFormData.value = {
    id: detail.id,
    lineId: detail.lineId,
    receiptId: detail.receiptId,
    itemId: detail.itemId,
    quantity: detail.quantity,
    batchId: detail.batchId,
    warehouseId: detail.warehouseId,
    locationId: detail.locationId,
    areaId: detail.areaId,
    remark: detail.remark || '',
  }
  detailSelectedItem.value = {
    id: detail.itemId || line.itemId,
    code: detail.itemCode || line.itemCode || '',
    name: detail.itemName || line.itemName || '',
    specification: detail.specification || line.specification || '',
    unitMeasureName: detail.unitMeasureName || line.unitMeasureName || '',
  }
  detailBatchCode.value = line.batchCode || ''
  detailQuantityMax.value = line.quantity
  await loadWarehouseOptions()
  locationOptions.value = detail.warehouseId ? await getWarehouseLocationSimpleList(detail.warehouseId) || [] : []
  areaOptions.value = detail.locationId ? await getWarehouseAreaSimpleList(detail.locationId) || [] : []
  detailFormVisible.value = true
}

/** 选择仓库 */
async function handleWarehouseConfirm({ value }: { value: WotPickerValue[] }) {
  detailFormData.value.warehouseId = Number(value[0])
  detailFormData.value.locationId = undefined
  detailFormData.value.areaId = undefined
  locationOptions.value = await getWarehouseLocationSimpleList(detailFormData.value.warehouseId) || []
  areaOptions.value = []
}

/** 打开库区选择 */
function openLocationPicker() {
  if (!detailFormData.value.warehouseId) {
    toast.warning('请先选择仓库')
    return
  }
  locationPickerVisible.value = true
}

/** 选择库区 */
async function handleLocationConfirm({ value }: { value: WotPickerValue[] }) {
  detailFormData.value.locationId = Number(value[0])
  detailFormData.value.areaId = undefined
  areaOptions.value = await getWarehouseAreaSimpleList(detailFormData.value.locationId) || []
}

/** 打开库位选择 */
function openAreaPicker() {
  if (!detailFormData.value.locationId) {
    toast.warning('请先选择库区')
    return
  }
  areaPickerVisible.value = true
}

/** 选择库位 */
function handleAreaConfirm({ value }: { value: WotPickerValue[] }) {
  detailFormData.value.areaId = Number(value[0])
}

/** 提交上架明细 */
async function handleSubmitDetail() {
  const result = await detailFormRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!props.receiptId) {
    return
  }
  detailFormLoading.value = true
  try {
    const data: WmOutsourceReceiptDetailCreateReqVO = {
      lineId: detailFormData.value.lineId,
      receiptId: props.receiptId,
      itemId: detailFormData.value.itemId,
      quantity: detailFormData.value.quantity,
      batchId: detailFormData.value.batchId,
      warehouseId: detailFormData.value.warehouseId,
      locationId: detailFormData.value.locationId,
      areaId: detailFormData.value.areaId,
      remark: detailFormData.value.remark || undefined,
    }
    if (detailFormData.value.id) {
      await updateOutsourceReceiptDetail({ ...data, id: detailFormData.value.id })
      toast.success('修改成功')
    } else {
      await createOutsourceReceiptDetail(data)
      toast.success('添加成功')
    }
    detailFormVisible.value = false
    await getDetailListByLine(detailFormData.value.lineId)
  } finally {
    detailFormLoading.value = false
  }
}

/** 删除上架明细 */
async function handleDeleteDetail(detail: WmOutsourceReceiptDetailVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除上架明细「${detail.warehouseName || '-'} / ${detail.locationName || '-'} / ${detail.areaName || '-'}」吗？`,
    })
  } catch {
    return
  }
  await deleteOutsourceReceiptDetail(detail.id)
  toast.success('删除成功')
  await getDetailListByLine(detail.lineId)
}

watch(
  () => props.receiptId,
  () => {
    getList()
  },
  { immediate: true },
)

defineExpose({ refresh: getList })
</script>
