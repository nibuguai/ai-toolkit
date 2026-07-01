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
        <view class="shrink-0 text-24rpx text-[#999]">
          {{ item.batchCode || '未带出批次' }}
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
        <text class="mr-8rpx shrink-0 text-[#999]">入库数量：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">库存记录：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.materialStockId ? `#${item.materialStockId}` : '-' }}</text>
      </view>
      <view class="flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
      </view>
      <view v-if="!readonly" class="mt-16rpx flex rounded-8rpx bg-[#f7f8fa] text-26rpx">
        <view class="flex-1 py-16rpx text-center text-[#1677ff]" @click="openUpdateForm(item)">
          编辑
        </view>
        <view class="flex-1 py-16rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
          删除
        </view>
      </view>
      <view class="mt-16rpx rounded-12rpx bg-[#f8fafc] p-16rpx">
        <view class="mb-12rpx flex items-center justify-between">
          <view class="text-26rpx text-[#333] font-medium">
            入库明细
          </view>
          <view v-if="stockMode" class="text-24rpx text-[#1677ff]" @click.stop="openCreateDetailForm(item)">
            添加上架
          </view>
        </view>
        <view v-if="isDetailLoading(item.id)" class="py-12rpx text-24rpx text-[#999]">
          加载中...
        </view>
        <view v-else-if="getDetailList(item.id).length === 0" class="py-12rpx text-24rpx text-[#999]">
          暂无入库明细
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
            <wd-form-item title="线边库存" title-width="220rpx" prop="materialStockId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openStockSelector">
                <text :class="selectedStockText ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedStockText || '请选择线边库存' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="物料" title-width="220rpx" prop="itemId">
              <text>{{ selectedItemText || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="入库数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" :min="0.01" :max="quantityMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
              <text>{{ formData.batchCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <!-- 线边库存选择弹窗 -->
  <wd-popup
    v-model="stockSelectorVisible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 78vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="stockSelectorVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          选择线边库存
        </view>
        <wd-button size="small" type="primary" :disabled="!selectedStock" @click="handleStockConfirm">
          确定
        </wd-button>
      </view>
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="stockSearchBatchCode" placeholder="批次号" clearable />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleStockReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleStockSearch">
            搜索
          </wd-button>
        </view>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation @scrolltolower="handleStockLoadMore">
        <view class="p-24rpx">
          <view
            v-for="stock in stockList"
            :key="stock.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="selectedStock?.id === stock.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="selectedStock = stock"
          >
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ stock.batchCode || `库存 #${stock.id}` }}
              </view>
              <view class="shrink-0 text-24rpx text-[#52c41a]">
                在库 {{ stock.quantity ?? '-' }}
              </view>
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">物料：</text>{{ stock.itemCode || '-' }} {{ stock.itemName || '' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">仓储：</text>{{ stock.warehouseName || '-' }} / {{ stock.locationName || '-' }} / {{ stock.areaName || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">供应商：</text>{{ stock.vendorName || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">入库时间：</text>{{ formatDate(stock.receiptTime) || '-' }}
            </view>
          </view>
          <view v-if="stockList.length === 0 && !stockLoading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选线边库存" />
          </view>
          <view v-if="stockLoading" class="flex justify-center py-24rpx">
            <wd-loading />
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>

  <!-- 入库明细表单弹窗 -->
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
import type { WmMaterialStockVO } from '@/api/mes/wm/materialstock'
import type {
  WmProductReceiptDetailCreateReqVO,
  WmProductReceiptDetailVO,
} from '@/api/mes/wm/productreceipt/detail'
import type {
  WmProductReceiptLineCreateReqVO,
  WmProductReceiptLineVO,
} from '@/api/mes/wm/productreceipt/line'
import type { WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'
import type { WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import type { WotPickerValue } from '@/utils/wot'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { getMaterialStock, getMaterialStockPage } from '@/api/mes/wm/materialstock'
import {
  createProductReceiptDetail,
  deleteProductReceiptDetail,
  getProductReceiptDetailListByLineId,
  updateProductReceiptDetail,
} from '@/api/mes/wm/productreceipt/detail'
import {
  createProductReceiptLine,
  deleteProductReceiptLine,
  getProductReceiptLinePage,
  updateProductReceiptLine,
} from '@/api/mes/wm/productreceipt/line'
import { getWarehouseAreaSimpleList } from '@/api/mes/wm/warehouse/area'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import MesLineListShell from '@/pages-mes/components/mes-line-list-shell.vue'

interface WmProductReceiptLineFormData {
  id?: number
  receiptId?: number
  itemId?: number
  materialStockId?: number
  quantity?: number
  batchId?: number
  batchCode?: string
  remark?: string
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
}

interface WmProductReceiptDetailFormData extends WmProductReceiptDetailCreateReqVO {
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
const list = ref<WmProductReceiptLineVO[]>([]) // 入库物料列表
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<WmProductReceiptLineFormData>(getDefaultFormData()) // 表单数据
const selectedStock = ref<WmMaterialStockVO>() // 当前选择线边库存
const stockSelectorVisible = ref(false) // 库存选择器显示状态
const stockLoading = ref(false) // 库存加载状态
const stockList = ref<WmMaterialStockVO[]>([]) // 库存列表
const stockSearchBatchCode = ref('') // 库存批次号搜索
const stockPageNo = ref(1) // 库存当前页
const stockTotal = ref(0) // 库存总数
const quantityMax = ref<number>() // 当前库存数量上限
const detailListMap = ref<Record<number, WmProductReceiptDetailVO[]>>({}) // 入库明细列表
const detailLoadingMap = ref<Record<number, boolean>>({}) // 入库明细加载状态
const detailFormVisible = ref(false) // 入库明细表单显示状态
const detailFormLoading = ref(false) // 入库明细表单提交状态
const detailFormRef = ref<FormInstance>() // 入库明细表单引用
const detailFormData = ref<WmProductReceiptDetailFormData>(getDefaultDetailFormData()) // 入库明细表单数据
const detailSelectedItem = ref<SelectedItemPreview>() // 入库明细当前物料
const detailQuantityMax = ref<number>() // 入库明细数量上限
const warehouseOptions = ref<WmWarehouseVO[]>([]) // 仓库选项
const locationOptions = ref<WmWarehouseLocationVO[]>([]) // 库区选项
const areaOptions = ref<WmWarehouseAreaVO[]>([]) // 库位选项
const warehousePickerVisible = ref(false) // 仓库选择器显示
const locationPickerVisible = ref(false) // 库区选择器显示
const areaPickerVisible = ref(false) // 库位选择器显示
const formTitle = computed(() => formData.value.id ? '编辑入库物料' : '添加入库物料')
const detailFormTitle = computed(() => detailFormData.value.id ? '编辑入库明细' : '添加入库明细')
const selectedStockText = computed(() => {
  if (selectedStock.value) {
    return `${selectedStock.value.batchCode || `库存 #${selectedStock.value.id}`} / ${selectedStock.value.itemCode || '-'}`
  }
  if (formData.value.materialStockId) {
    return `${formData.value.batchCode || `库存 #${formData.value.materialStockId}`} / ${formData.value.itemCode || '-'}`
  }
  return ''
})
const selectedItemText = computed(() => {
  if (formData.value.itemCode || formData.value.itemName) {
    return `${formData.value.itemCode || '-'} ${formData.value.itemName || ''}`.trim()
  }
  return formData.value.itemId ? `物料 #${formData.value.itemId}` : ''
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
  materialStockId: [{ required: true, message: '线边库存不能为空' }],
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '入库数量不能为空' },
    { validator: value => Number(value) > 0 || '入库数量必须大于 0' },
    { validator: value => !quantityMax.value || Number(value) <= quantityMax.value || `入库数量不能大于库存 ${quantityMax.value}` },
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

/** 默认表单数据 */
function getDefaultFormData(): WmProductReceiptLineFormData {
  return {
    receiptId: props.receiptId,
    itemId: undefined,
    materialStockId: undefined,
    quantity: undefined,
    batchId: undefined,
    batchCode: '',
    remark: '',
    itemCode: '',
    itemName: '',
    specification: '',
    unitMeasureName: '',
  }
}

/** 默认入库明细表单数据 */
function getDefaultDetailFormData(): WmProductReceiptDetailFormData {
  return {
    lineId: 0,
    receiptId: props.receiptId || 0,
    itemId: 0,
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
    detailListMap.value = {}
    return
  }
  loading.value = true
  try {
    const data = await getProductReceiptLinePage({
      pageNo: 1,
      pageSize: 100,
      receiptId: props.receiptId,
    })
    list.value = data.list
    await Promise.all(list.value.map(item => loadDetailList(item.id)))
  } finally {
    loading.value = false
  }
}

/** 获取入库明细列表 */
function getDetailList(lineId: number) {
  return detailListMap.value[lineId] || []
}

/** 是否正在加载入库明细 */
function isDetailLoading(lineId: number) {
  return !!detailLoadingMap.value[lineId]
}

/** 加载入库明细 */
async function loadDetailList(lineId: number) {
  detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: true }
  try {
    const data = await getProductReceiptDetailListByLineId(lineId)
    detailListMap.value = { ...detailListMap.value, [lineId]: data }
  } finally {
    detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: false }
  }
}

/** 打开新增表单 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  selectedStock.value = undefined
  quantityMax.value = undefined
  formVisible.value = true
}

/** 打开编辑表单 */
async function openUpdateForm(item: WmProductReceiptLineVO) {
  formData.value = {
    id: item.id,
    receiptId: item.receiptId,
    itemId: item.itemId,
    materialStockId: item.materialStockId,
    quantity: item.quantity,
    batchId: item.batchId,
    batchCode: item.batchCode || '',
    remark: item.remark || '',
    itemCode: item.itemCode || '',
    itemName: item.itemName || '',
    specification: item.specification || '',
    unitMeasureName: item.unitMeasureName || '',
  }
  selectedStock.value = item.materialStockId ? await getMaterialStock(item.materialStockId) : undefined
  quantityMax.value = selectedStock.value?.quantity
  formVisible.value = true
}

/** 打开线边库存选择 */
function openStockSelector() {
  stockSelectorVisible.value = true
  selectedStock.value = undefined
  stockSearchBatchCode.value = ''
  stockPageNo.value = 1
  stockList.value = []
  stockTotal.value = 0
  loadStockList()
}

/** 搜索线边库存 */
function handleStockSearch() {
  stockPageNo.value = 1
  loadStockList()
}

/** 重置库存搜索 */
function handleStockReset() {
  stockSearchBatchCode.value = ''
  stockPageNo.value = 1
  loadStockList()
}

/** 库存加载更多 */
async function handleStockLoadMore() {
  if (stockLoading.value || stockList.value.length >= stockTotal.value) {
    return
  }
  stockPageNo.value++
  await loadStockList(true)
}

/** 加载线边库存 */
async function loadStockList(append = false) {
  if (stockLoading.value) {
    return
  }
  stockLoading.value = true
  try {
    const data = await getMaterialStockPage({
      pageNo: stockPageNo.value,
      pageSize: 20,
      batchCode: stockSearchBatchCode.value || undefined,
      frozen: false,
      virtualFilter: 'only',
    })
    if (append) {
      stockList.value.push(...data.list)
    } else {
      stockList.value = data.list
    }
    stockTotal.value = data.total
  } finally {
    stockLoading.value = false
  }
}

/** 确认选择线边库存 */
function handleStockConfirm() {
  if (!selectedStock.value) {
    return
  }
  formData.value.materialStockId = selectedStock.value.id
  formData.value.itemId = selectedStock.value.itemId
  formData.value.itemCode = selectedStock.value.itemCode
  formData.value.itemName = selectedStock.value.itemName
  formData.value.specification = selectedStock.value.specification
  formData.value.unitMeasureName = selectedStock.value.unitMeasureName
  formData.value.quantity = selectedStock.value.quantity
  formData.value.batchId = selectedStock.value.batchId
  formData.value.batchCode = selectedStock.value.batchCode
  quantityMax.value = selectedStock.value.quantity
  stockSelectorVisible.value = false
}

/** 构造提交数据 */
function buildSubmitData(): WmProductReceiptLineCreateReqVO | undefined {
  if (!props.receiptId || !formData.value.itemId || !formData.value.quantity) {
    return undefined
  }
  return {
    receiptId: props.receiptId,
    itemId: formData.value.itemId,
    materialStockId: formData.value.materialStockId,
    quantity: formData.value.quantity,
    batchId: formData.value.batchId,
    batchCode: formData.value.batchCode || undefined,
    remark: formData.value.remark || undefined,
  }
}

/** 提交入库物料 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  const data = buildSubmitData()
  if (!data) {
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateProductReceiptLine({ ...data, id: formData.value.id })
      toast.success('修改成功')
    } else {
      await createProductReceiptLine(data)
      toast.success('添加成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除入库物料 */
async function handleDelete(item: WmProductReceiptLineVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteProductReceiptLine(item.id)
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

/** 打开新增入库明细表单 */
async function openCreateDetailForm(line: WmProductReceiptLineVO) {
  detailFormData.value = {
    ...getDefaultDetailFormData(),
    lineId: line.id,
    receiptId: props.receiptId || line.receiptId,
    itemId: line.itemId,
    quantity: line.quantity,
    batchId: line.batchId,
  }
  detailSelectedItem.value = {
    id: line.itemId,
    code: line.itemCode,
    name: line.itemName,
    specification: line.specification,
    unitMeasureName: line.unitMeasureName,
  }
  detailQuantityMax.value = line.quantity
  locationOptions.value = []
  areaOptions.value = []
  await loadWarehouseOptions()
  detailFormVisible.value = true
}

/** 打开编辑入库明细表单 */
async function openUpdateDetailForm(line: WmProductReceiptLineVO, detail: WmProductReceiptDetailVO) {
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

/** 提交入库明细 */
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
    const data: WmProductReceiptDetailCreateReqVO = {
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
      await updateProductReceiptDetail({ ...data, id: detailFormData.value.id })
      toast.success('修改成功')
    } else {
      await createProductReceiptDetail(data)
      toast.success('添加成功')
    }
    detailFormVisible.value = false
    await loadDetailList(detailFormData.value.lineId)
  } finally {
    detailFormLoading.value = false
  }
}

/** 删除入库明细 */
async function handleDeleteDetail(detail: WmProductReceiptDetailVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除入库明细「${detail.warehouseName || '-'} / ${detail.locationName || '-'} / ${detail.areaName || '-'}」吗？`,
    })
  } catch {
    return
  }
  await deleteProductReceiptDetail(detail.id)
  toast.success('删除成功')
  await loadDetailList(detail.lineId)
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
