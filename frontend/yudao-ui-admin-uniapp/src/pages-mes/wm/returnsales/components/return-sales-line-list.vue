<template>
  <MesLineListShell
    title="退货物料"
    :loading="loading"
    :empty="list.length === 0"
    empty-text="暂无退货物料"
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
        <view class="shrink-0 text-24rpx text-[#999]">
          {{ item.batchCode || '未选择批次' }}
        </view>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.itemSpecification || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">单位：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.itemUnit || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">退货数量：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
      </view>
      <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">需要质检：</text>
        <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(item.rqcCheckFlag))" />
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
      <view v-if="!readonly" class="mt-16rpx flex rounded-8rpx bg-[#f7f8fa] text-26rpx">
        <view class="flex-1 py-16rpx text-center text-[#1677ff]" @click.stop="openUpdateForm(item)">
          编辑
        </view>
        <view class="flex-1 py-16rpx text-center text-[#f56c6c]" @click.stop="handleDelete(item)">
          删除
        </view>
      </view>
      <view v-if="stockMode" class="mt-16rpx rounded-12rpx bg-[#f8fafc] p-16rpx">
        <view class="mb-12rpx flex items-center justify-between">
          <view class="text-26rpx text-[#333] font-medium">
            上架明细
          </view>
          <view class="text-24rpx text-[#1677ff]" @click.stop="openCreateDetailForm(item)">
            添加上架
          </view>
        </view>
        <view v-if="isDetailLoading(item.id)" class="py-12rpx text-24rpx text-[#999]">
          加载中...
        </view>
        <view v-else-if="getDetailList(item.id).length === 0" class="py-12rpx text-24rpx text-[#999]">
          暂无上架明细
        </view>
        <template v-else>
          <view
            v-for="detail in getDetailList(item.id)"
            :key="detail.id"
            class="mb-12rpx rounded-8rpx bg-white p-16rpx last:mb-0"
          >
            <view class="mb-8rpx text-26rpx text-[#333]">
              {{ detail.warehouseName || '-' }} / {{ detail.locationName || '-' }} / {{ detail.areaName || '-' }}
            </view>
            <view class="mb-8rpx text-24rpx text-[#666]">
              批次号：{{ detail.batchCode || '-' }}
            </view>
            <view class="mb-8rpx text-24rpx text-[#666]">
              上架数量：{{ detail.quantity ?? '-' }}
            </view>
            <view v-if="detail.remark" class="text-24rpx text-[#666]">
              备注：{{ detail.remark }}
            </view>
            <view class="mt-12rpx flex rounded-8rpx bg-[#f7f8fa] text-24rpx">
              <view class="flex-1 py-12rpx text-center text-[#1677ff]" @click.stop="openUpdateDetailForm(item, detail)">
                编辑
              </view>
              <view class="flex-1 py-12rpx text-center text-[#f56c6c]" @click.stop="handleDeleteDetail(detail)">
                删除
              </view>
            </view>
          </view>
        </template>
      </view>
    </view>
  </MesLineListShell>

  <!-- 退货行表单弹窗 -->
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
            <wd-form-item title="产品物料" title-width="220rpx" prop="itemId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openItemSelector">
                <text :class="selectedItemText ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedItemText || '请选择产品物料' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="退货数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" :min="0.01" :precision="2" />
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx" prop="batchId">
              <view
                class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx"
                :class="formData.itemId ? '' : 'opacity-60'"
                @click.stop="openBatchSelector"
              >
                <text :class="selectedBatchText ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedBatchText || '请选择批次号' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="需要质检" title-width="220rpx" prop="rqcCheckFlag">
              <wd-switch v-model="formData.rqcCheckFlag" />
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

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
            <wd-form-item title="入库仓库" title-width="220rpx" prop="warehouseId" is-link :value="warehouseDisplayValue" placeholder="请选择仓库" @click="warehousePickerVisible = true" />
            <wd-picker v-model:visible="warehousePickerVisible" :model-value="warehousePickerValue" :columns="warehouseOptions" label-key="name" value-key="id" @confirm="handleWarehouseConfirm" />
            <wd-form-item title="库区" title-width="220rpx" prop="locationId" is-link :value="locationDisplayValue" placeholder="请选择库区" @click="openLocationPicker" />
            <wd-picker v-model:visible="locationPickerVisible" :model-value="locationPickerValue" :columns="locationOptions" label-key="name" value-key="id" @confirm="handleLocationConfirm" />
            <wd-form-item title="库位" title-width="220rpx" prop="areaId" is-link :value="areaDisplayValue" placeholder="请选择库位" @click="openAreaPicker" />
            <wd-picker v-model:visible="areaPickerVisible" :model-value="areaPickerValue" :columns="areaOptions" label-key="name" value-key="id" @confirm="handleAreaConfirm" />
            <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
              <wd-input v-model="detailFormData.batchCode" placeholder="请输入批次号" clearable />
            </wd-form-item>
            <wd-form-item title="上架数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="detailFormData.quantity" :min="0.01" :precision="2" />
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="detailFormData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <ItemSelector ref="itemSelectorRef" :multiple="false" @confirm="handleItemConfirm" />

  <!-- 批次选择弹窗 -->
  <wd-popup
    v-model="batchSelectorVisible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 78vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="batchSelectorVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          选择批次
        </view>
        <wd-button size="small" type="primary" :disabled="!selectedBatch" @click="handleBatchConfirm">
          确定
        </wd-button>
      </view>
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="batchSearchCode" placeholder="批次号" clearable />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleBatchReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleBatchSearch">
            搜索
          </wd-button>
        </view>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation @scrolltolower="handleBatchLoadMore">
        <view class="p-24rpx">
          <view
            v-for="batch in batchList"
            :key="batch.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="selectedBatch?.id === batch.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="selectedBatch = batch"
          >
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ batch.code || '-' }}
              </view>
              <dict-tag v-if="batch.qualityStatus != null" :type="DICT_TYPE.MES_WM_QUALITY_STATUS" :value="batch.qualityStatus" />
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">物料：</text>{{ batch.itemCode || '-' }} {{ batch.itemName || '' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">客户：</text>{{ batch.clientName || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">销售订单：</text>{{ batch.salesOrderCode || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">入库日期：</text>{{ formatDate(batch.receiptDate) || '-' }}
            </view>
          </view>
          <view v-if="batchList.length === 0 && !batchLoading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选批次" />
          </view>
          <view v-if="batchLoading" class="flex justify-center py-24rpx">
            <wd-loading />
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItemVO } from '@/api/mes/md/item'
import type { BatchVO } from '@/api/mes/wm/batch'
import type {
  WmReturnSalesDetailCreateReqVO,
  WmReturnSalesDetailVO,
} from '@/api/mes/wm/returnsales/detail'
import type {
  WmReturnSalesLineCreateReqVO,
  WmReturnSalesLineVO,
} from '@/api/mes/wm/returnsales/line'
import type { WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'
import type { WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import type { WotPickerValue } from '@/utils/wot'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { getBatchPage } from '@/api/mes/wm/batch'
import {
  createReturnSalesDetail,
  deleteReturnSalesDetail,
  getReturnSalesDetailListByLineId,
  updateReturnSalesDetail,
} from '@/api/mes/wm/returnsales/detail'
import {
  createReturnSalesLine,
  deleteReturnSalesLine,
  getReturnSalesLineListByReturnId,
  updateReturnSalesLine,
} from '@/api/mes/wm/returnsales/line'
import { getWarehouseAreaSimpleList } from '@/api/mes/wm/warehouse/area'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import MesLineListShell from '@/pages-mes/components/mes-line-list-shell.vue'
import ItemSelector from '../../../md/item/components/item-selector.vue'

interface WmReturnSalesLineFormData extends WmReturnSalesLineCreateReqVO {
  id?: number
}

interface WmReturnSalesDetailFormData extends WmReturnSalesDetailCreateReqVO {
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
  returnId?: number
  clientId?: number
  salesOrderCode?: string
  readonly?: boolean
  stockMode?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<WmReturnSalesLineVO[]>([]) // 退货行列表
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<WmReturnSalesLineFormData>(getDefaultFormData()) // 表单数据
const detailFormVisible = ref(false) // 上架明细表单显示状态
const detailFormLoading = ref(false) // 上架明细表单提交状态
const detailFormRef = ref<FormInstance>() // 上架明细表单引用
const detailFormData = ref<WmReturnSalesDetailFormData>(getDefaultDetailFormData()) // 上架明细表单数据
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const selectedItem = ref<SelectedItemPreview>() // 当前选择物料
const detailSelectedItem = ref<SelectedItemPreview>() // 上架明细当前物料
const batchSelectorVisible = ref(false) // 批次选择器显示状态
const batchLoading = ref(false) // 批次加载状态
const batchList = ref<BatchVO[]>([]) // 批次列表
const selectedBatch = ref<BatchVO>() // 当前临时选择批次
const batchSearchCode = ref('') // 批次号搜索
const batchPageNo = ref(1) // 批次当前页
const batchTotal = ref(0) // 批次总数
const detailListMap = ref<Record<number, WmReturnSalesDetailVO[]>>({}) // 上架明细列表
const detailLoadingMap = ref<Record<number, boolean>>({}) // 上架明细加载状态
const warehouseOptions = ref<WmWarehouseVO[]>([]) // 仓库选项
const locationOptions = ref<WmWarehouseLocationVO[]>([]) // 库区选项
const areaOptions = ref<WmWarehouseAreaVO[]>([]) // 库位选项
const warehousePickerVisible = ref(false) // 仓库选择器显示
const locationPickerVisible = ref(false) // 库区选择器显示
const areaPickerVisible = ref(false) // 库位选择器显示
const formSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '退货数量不能为空' },
    { validator: value => Number(value) > 0 || '退货数量必须大于 0' },
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
  ],
})
const formTitle = computed(() => formData.value.id ? '修改销售退货单行' : '添加销售退货单行')
const detailFormTitle = computed(() => detailFormData.value.id ? '编辑上架明细' : '添加上架明细')
const selectedItemText = computed(() => {
  return selectedItem.value
    ? `${selectedItem.value.code || '-'} ${selectedItem.value.name || ''}`.trim()
    : ''
})
const detailSelectedItemText = computed(() => {
  return detailSelectedItem.value
    ? `${detailSelectedItem.value.code || '-'} ${detailSelectedItem.value.name || ''}`.trim()
    : ''
})
const selectedBatchText = computed(() => {
  return formData.value.batchCode || selectedBatch.value?.code || ''
})
const warehousePickerValue = computed(() => detailFormData.value.warehouseId !== undefined ? [detailFormData.value.warehouseId] : [])
const locationPickerValue = computed(() => detailFormData.value.locationId !== undefined ? [detailFormData.value.locationId] : [])
const areaPickerValue = computed(() => detailFormData.value.areaId !== undefined ? [detailFormData.value.areaId] : [])
const warehouseDisplayValue = computed(() => getWotPickerFormValue(warehouseOptions.value, detailFormData.value.warehouseId, { labelKey: 'name', valueKey: 'id', placeholder: '' }))
const locationDisplayValue = computed(() => getWotPickerFormValue(locationOptions.value, detailFormData.value.locationId, { labelKey: 'name', valueKey: 'id', placeholder: '' }))
const areaDisplayValue = computed(() => getWotPickerFormValue(areaOptions.value, detailFormData.value.areaId, { labelKey: 'name', valueKey: 'id', placeholder: '' }))

/** 默认表单数据 */
function getDefaultFormData() {
  return {
    returnId: props.returnId,
    itemId: undefined,
    quantity: undefined,
    batchId: undefined,
    batchCode: '',
    rqcCheckFlag: true,
    remark: '',
  } as WmReturnSalesLineFormData
}

/** 默认上架明细表单数据 */
function getDefaultDetailFormData() {
  return {
    returnId: props.returnId,
    lineId: undefined,
    itemId: undefined,
    quantity: undefined,
    batchId: undefined,
    batchCode: '',
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    remark: '',
  } as WmReturnSalesDetailFormData
}

/** 加载退货行列表 */
async function loadList() {
  if (!props.returnId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getReturnSalesLineListByReturnId(props.returnId)
    if (props.stockMode) {
      await Promise.all(list.value.map(item => loadDetailList(item.id)))
    } else {
      detailListMap.value = {}
    }
  } finally {
    loading.value = false
  }
}

/** 获取单行上架明细 */
function getDetailList(lineId: number) {
  return detailListMap.value[lineId] || []
}

/** 判断单行上架明细是否加载中 */
function isDetailLoading(lineId: number) {
  return !!detailLoadingMap.value[lineId]
}

/** 加载单行上架明细 */
async function loadDetailList(lineId: number) {
  detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: true }
  try {
    const data = await getReturnSalesDetailListByLineId(lineId)
    detailListMap.value = { ...detailListMap.value, [lineId]: data }
  } finally {
    detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: false }
  }
}

/** 打开新增表单 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  selectedItem.value = undefined
  selectedBatch.value = undefined
  formVisible.value = true
}

/** 打开编辑表单 */
function openUpdateForm(item: WmReturnSalesLineVO) {
  formData.value = {
    id: item.id,
    returnId: item.returnId,
    itemId: item.itemId,
    quantity: item.quantity,
    batchId: item.batchId,
    batchCode: item.batchCode || '',
    rqcCheckFlag: Boolean(item.rqcCheckFlag),
    remark: item.remark || '',
  }
  selectedItem.value = {
    id: item.itemId,
    code: item.itemCode,
    name: item.itemName,
    specification: item.itemSpecification,
    unitMeasureName: item.itemUnit,
  }
  selectedBatch.value = item.batchId
    ? {
        id: item.batchId,
        code: item.batchCode || '',
        itemId: item.itemId,
      } as BatchVO
    : undefined
  formVisible.value = true
}

/** 打开物料选择器 */
function openItemSelector() {
  itemSelectorRef.value?.open()
}

/** 确认选择物料 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  selectedItem.value = {
    id: item.id,
    code: item.code,
    name: item.name,
    specification: item.specification,
    unitMeasureName: item.unitMeasureName,
  }
  formData.value.itemId = item.id
  formData.value.batchId = undefined
  formData.value.batchCode = ''
  selectedBatch.value = undefined
}

/** 打开批次选择器 */
function openBatchSelector() {
  if (!formData.value.itemId) {
    toast.warning('请先选择产品物料')
    return
  }
  batchSelectorVisible.value = true
  selectedBatch.value = undefined
  batchSearchCode.value = ''
  batchPageNo.value = 1
  batchList.value = []
  batchTotal.value = 0
  loadBatchList()
}

/** 搜索批次 */
function handleBatchSearch() {
  batchPageNo.value = 1
  loadBatchList()
}

/** 重置批次搜索 */
function handleBatchReset() {
  batchSearchCode.value = ''
  batchPageNo.value = 1
  loadBatchList()
}

/** 批次加载更多 */
async function handleBatchLoadMore() {
  if (batchLoading.value || batchList.value.length >= batchTotal.value) {
    return
  }
  batchPageNo.value++
  await loadBatchList(true)
}

/** 加载批次列表 */
async function loadBatchList(append = false) {
  if (!formData.value.itemId || batchLoading.value) {
    return
  }
  batchLoading.value = true
  try {
    const data = await getBatchPage({
      pageNo: batchPageNo.value,
      pageSize: 20,
      code: batchSearchCode.value || undefined,
      itemId: formData.value.itemId,
      clientId: props.clientId,
      salesOrderCode: props.salesOrderCode || undefined,
    })
    if (append) {
      batchList.value.push(...data.list)
    } else {
      batchList.value = data.list
    }
    batchTotal.value = data.total
  } finally {
    batchLoading.value = false
  }
}

/** 确认选择批次 */
function handleBatchConfirm() {
  if (!selectedBatch.value) {
    return
  }
  formData.value.batchId = selectedBatch.value.id
  formData.value.batchCode = selectedBatch.value.code
  batchSelectorVisible.value = false
}

/** 删除退货行 */
async function handleDelete(item: WmReturnSalesLineVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteReturnSalesLine(item.id)
  toast.success('删除成功')
  await loadList()
}

/** 加载仓库选项 */
async function loadWarehouseOptions() {
  if (warehouseOptions.value.length > 0) {
    return
  }
  warehouseOptions.value = await getWarehouseSimpleList() || []
}

/** 打开新增上架明细表单 */
async function openCreateDetailForm(item: WmReturnSalesLineVO) {
  detailFormData.value = {
    ...getDefaultDetailFormData(),
    returnId: props.returnId,
    lineId: item.id,
    itemId: item.itemId,
    quantity: item.quantity,
    batchId: item.batchId,
    batchCode: item.batchCode || '',
  }
  detailSelectedItem.value = {
    id: item.itemId,
    code: item.itemCode,
    name: item.itemName,
    specification: item.itemSpecification,
    unitMeasureName: item.itemUnit,
  }
  locationOptions.value = []
  areaOptions.value = []
  await loadWarehouseOptions()
  detailFormVisible.value = true
}

/** 打开编辑上架明细表单 */
async function openUpdateDetailForm(item: WmReturnSalesLineVO, detail: WmReturnSalesDetailVO) {
  detailFormData.value = {
    id: detail.id,
    returnId: detail.returnId,
    lineId: detail.lineId,
    itemId: detail.itemId,
    quantity: detail.quantity,
    batchId: detail.batchId,
    batchCode: detail.batchCode || '',
    warehouseId: detail.warehouseId,
    locationId: detail.locationId,
    areaId: detail.areaId,
    remark: detail.remark || '',
  }
  detailSelectedItem.value = {
    id: detail.itemId || item.itemId,
    code: detail.itemCode || item.itemCode,
    name: detail.itemName || item.itemName,
    specification: detail.itemSpecification || item.itemSpecification,
    unitMeasureName: detail.itemUnit || item.itemUnit,
  }
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

/** 删除上架明细 */
async function handleDeleteDetail(detail: WmReturnSalesDetailVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除上架明细「${detail.warehouseName || '-'} / ${detail.locationName || '-'} / ${detail.areaName || '-'}」吗？`,
    })
  } catch {
    return
  }
  await deleteReturnSalesDetail(detail.id)
  toast.success('删除成功')
  await loadDetailList(detail.lineId)
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!props.returnId) {
    return
  }
  formLoading.value = true
  try {
    const data: WmReturnSalesLineCreateReqVO = {
      returnId: props.returnId,
      itemId: formData.value.itemId,
      quantity: formData.value.quantity,
      batchId: formData.value.batchId,
      batchCode: formData.value.batchCode || undefined,
      rqcCheckFlag: Boolean(formData.value.rqcCheckFlag),
      remark: formData.value.remark || undefined,
    }
    if (formData.value.id) {
      await updateReturnSalesLine({ ...data, id: formData.value.id })
      toast.success('修改成功')
    } else {
      await createReturnSalesLine(data)
      toast.success('新增成功')
    }
    formVisible.value = false
    await loadList()
  } finally {
    formLoading.value = false
  }
}

/** 提交上架明细 */
async function handleSubmitDetail() {
  const result = await detailFormRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!props.returnId || !detailFormData.value.lineId) {
    return
  }
  detailFormLoading.value = true
  try {
    const data: WmReturnSalesDetailCreateReqVO = {
      returnId: props.returnId,
      lineId: detailFormData.value.lineId,
      itemId: detailFormData.value.itemId,
      quantity: detailFormData.value.quantity,
      batchId: detailFormData.value.batchId,
      batchCode: detailFormData.value.batchCode || undefined,
      warehouseId: detailFormData.value.warehouseId,
      locationId: detailFormData.value.locationId,
      areaId: detailFormData.value.areaId,
      remark: detailFormData.value.remark || undefined,
    }
    if (detailFormData.value.id) {
      await updateReturnSalesDetail({ ...data, id: detailFormData.value.id })
      toast.success('修改成功')
    } else {
      await createReturnSalesDetail(data)
      toast.success('添加成功')
    }
    detailFormVisible.value = false
    await loadDetailList(detailFormData.value.lineId)
  } finally {
    detailFormLoading.value = false
  }
}

watch(
  () => props.returnId,
  () => {
    formVisible.value = false
    detailFormVisible.value = false
    batchSelectorVisible.value = false
    warehousePickerVisible.value = false
    locationPickerVisible.value = false
    areaPickerVisible.value = false
    loadList()
  },
  { immediate: true },
)
</script>
