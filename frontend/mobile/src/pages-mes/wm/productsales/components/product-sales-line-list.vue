<template>
  <MesLineListShell
    title="出库物料"
    :loading="loading"
    :empty="list.length === 0"
    empty-text="暂无出库物料"
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
        <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(item.oqcCheckFlag))" />
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
        <text class="mr-8rpx shrink-0 text-[#999]">出库数量：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">已拣货数量：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.pickedQuantity ?? '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">批次号：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
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
      <view v-if="stockMode" class="mt-16rpx rounded-12rpx bg-[#f8fafc] p-16rpx">
        <view class="mb-12rpx flex items-center justify-between">
          <view class="text-26rpx text-[#333] font-medium">
            拣货明细
          </view>
          <view class="text-24rpx text-[#1677ff]" @click.stop="openCreateDetailForm(item)">
            添加拣货
          </view>
        </view>
        <view v-if="isDetailLoading(item.id)" class="py-12rpx text-24rpx text-[#999]">
          加载中...
        </view>
        <view v-else-if="getDetailList(item.id).length === 0" class="py-12rpx text-24rpx text-[#999]">
          暂无拣货明细
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
            批次号：{{ detail.batchCode || '-' }}
          </view>
          <view class="mb-8rpx text-24rpx text-[#666]">
            拣货数量：{{ detail.quantity ?? '-' }}
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
      </view>
    </view>
  </MesLineListShell>

  <!-- 出库物料表单弹窗 -->
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
            <wd-form-item v-if="hasNotice" title="发货通知行" title-width="220rpx" prop="noticeLineId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openNoticeLineSelector">
                <text :class="selectedNoticeLineText ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedNoticeLineText || '请选择发货通知单行' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="物料" title-width="220rpx" prop="itemId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openItemSelector">
                <text :class="selectedItemText ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedItemText || '请选择物料' }}
                </text>
                <wd-icon v-if="!formData.noticeLineId" name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="出库数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" :min="0.01" :precision="2" />
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
              <wd-input v-model="formData.batchCode" clearable placeholder="请输入批次号" />
            </wd-form-item>
            <wd-cell title="是否检验" center>
              <view class="flex justify-end">
                <wd-switch v-model="formData.oqcCheckFlag" />
              </view>
            </wd-cell>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <ItemSelector ref="itemSelectorRef" :multiple="false" @confirm="handleItemConfirm" />
  <SalesNoticeLineSelector
    ref="noticeLineSelectorRef"
    :notice-id="noticeId"
    @confirm="handleNoticeLineConfirm"
  />

  <!-- 拣货明细表单弹窗 -->
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
            <wd-form-item title="库存记录" title-width="220rpx" prop="materialStockId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openStockSelector">
                <text :class="selectedStockText ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedStockText || '请选择库存记录' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="拣货数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="detailFormData.quantity" :min="0.01" :max="quantityMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="仓库" title-width="220rpx" prop="warehouseId">
              <text>{{ selectedStock?.warehouseName || detailFormData.warehouseName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="库区" title-width="220rpx" prop="locationId">
              <text>{{ selectedStock?.locationName || detailFormData.locationName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="库位" title-width="220rpx" prop="areaId">
              <text>{{ selectedStock?.areaName || detailFormData.areaName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
              <text>{{ detailFormData.batchCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="detailFormData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <!-- 库存记录选择弹窗 -->
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
          选择库存记录
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
            <wd-empty icon="content" tip="暂无可选库存记录" />
          </view>
          <view v-if="stockLoading" class="flex justify-center py-24rpx">
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
import type { WmMaterialStockVO } from '@/api/mes/wm/materialstock'
import type {
  WmProductSalesDetailCreateReqVO,
  WmProductSalesDetailVO,
} from '@/api/mes/wm/productsales/detail'
import type {
  WmProductSalesLineCreateReqVO,
  WmProductSalesLineVO,
} from '@/api/mes/wm/productsales/line'
import type { WmSalesNoticeLineVO } from '@/api/mes/wm/salesnotice/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { getMaterialStockPage } from '@/api/mes/wm/materialstock'
import {
  createProductSalesDetail,
  deleteProductSalesDetail,
  getProductSalesDetailListByLineId,
  updateProductSalesDetail,
} from '@/api/mes/wm/productsales/detail'
import {
  createProductSalesLine,
  deleteProductSalesLine,
  getProductSalesLinePage,
  updateProductSalesLine,
} from '@/api/mes/wm/productsales/line'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import MesLineListShell from '@/pages-mes/components/mes-line-list-shell.vue'
import ItemSelector from '../../../md/item/components/item-selector.vue'
import SalesNoticeLineSelector from '../../salesnotice/components/sales-notice-line-selector.vue'

interface WmProductSalesLineFormData extends WmProductSalesLineCreateReqVO {
  id?: number
}

interface WmProductSalesDetailFormData extends WmProductSalesDetailCreateReqVO {
  id?: number
  warehouseName?: string
  locationName?: string
  areaName?: string
}

interface SelectedItemPreview {
  id: number
  code?: string
  name?: string
  specification?: string
  unitMeasureName?: string
}

const props = defineProps<{
  salesId?: number
  noticeId?: number
  readonly?: boolean
  stockMode?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<WmProductSalesLineVO[]>([]) // 出库物料列表
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<WmProductSalesLineFormData>(getDefaultFormData()) // 表单数据
const detailFormVisible = ref(false) // 拣货明细表单显示状态
const detailFormLoading = ref(false) // 拣货明细表单提交状态
const detailFormRef = ref<FormInstance>() // 拣货明细表单引用
const detailFormData = ref<WmProductSalesDetailFormData>(getDefaultDetailFormData()) // 拣货明细表单数据
const selectedItem = ref<SelectedItemPreview>() // 当前选择物料
const selectedNoticeLine = ref<WmSalesNoticeLineVO>() // 当前选择发货通知行
const detailSelectedItem = ref<SelectedItemPreview>() // 拣货明细当前物料
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const noticeLineSelectorRef = ref<InstanceType<typeof SalesNoticeLineSelector>>() // 发货通知行选择器引用
const detailListMap = ref<Record<number, WmProductSalesDetailVO[]>>({}) // 拣货明细列表
const detailLoadingMap = ref<Record<number, boolean>>({}) // 拣货明细加载状态
const stockSelectorVisible = ref(false) // 库存记录选择器显示状态
const stockLoading = ref(false) // 库存记录加载状态
const stockList = ref<WmMaterialStockVO[]>([]) // 库存记录列表
const selectedStock = ref<WmMaterialStockVO>() // 当前选择库存记录
const stockSearchBatchCode = ref('') // 库存批次号搜索
const stockPageNo = ref(1) // 库存当前页
const stockTotal = ref(0) // 库存总数
const quantityMax = ref<number>() // 当前库存数量上限
const hasNotice = computed(() => Boolean(props.noticeId))
const formTitle = computed(() => formData.value.id ? '编辑出库物料' : '添加出库物料')
const detailFormTitle = computed(() => detailFormData.value.id ? '编辑拣货明细' : '添加拣货明细')
const selectedItemText = computed(() => {
  if (!selectedItem.value) {
    return ''
  }
  return `${selectedItem.value.code || '-'} ${selectedItem.value.name || ''}`.trim()
})
const selectedNoticeLineText = computed(() => {
  if (!selectedNoticeLine.value) {
    return ''
  }
  return `${selectedNoticeLine.value.itemCode || '-'} ${selectedNoticeLine.value.itemName || ''}`.trim()
})
const detailSelectedItemText = computed(() => {
  return detailSelectedItem.value
    ? `${detailSelectedItem.value.code || '-'} ${detailSelectedItem.value.name || ''}`.trim()
    : ''
})
const selectedStockText = computed(() => {
  return selectedStock.value
    ? `${selectedStock.value.batchCode || `库存 #${selectedStock.value.id}`} / ${selectedStock.value.warehouseName || '-'}`
    : ''
})
const formSchema = createFormSchema({
  noticeLineId: [{ required: () => hasNotice.value, message: '发货通知单行不能为空' }],
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '出库数量不能为空' },
    { validator: value => Number(value) > 0 || '出库数量必须大于 0' },
  ],
  oqcCheckFlag: [{ required: true, message: '是否检验不能为空' }],
})
const detailFormSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  materialStockId: [{ required: true, message: '请选择库存记录' }],
  quantity: [
    { required: true, message: '拣货数量不能为空' },
    { validator: value => Number(value) > 0 || '拣货数量必须大于 0' },
    { validator: value => !quantityMax.value || Number(value) <= quantityMax.value || `拣货数量不能大于库存 ${quantityMax.value}` },
  ],
  warehouseId: [{ required: true, message: '仓库不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData() {
  return {
    salesId: props.salesId || 0,
    noticeLineId: undefined,
    itemId: undefined,
    batchId: undefined,
    batchCode: '',
    quantity: undefined,
    oqcCheckFlag: true,
    remark: '',
  } as WmProductSalesLineFormData
}

/** 默认拣货明细表单数据 */
function getDefaultDetailFormData() {
  return {
    salesId: props.salesId,
    lineId: undefined,
    materialStockId: undefined,
    itemId: undefined,
    quantity: undefined,
    batchId: undefined,
    batchCode: '',
    warehouseId: undefined,
    warehouseName: '',
    locationId: undefined,
    locationName: '',
    areaId: undefined,
    areaName: '',
    remark: '',
  } as WmProductSalesDetailFormData
}

/** 查询出库物料列表 */
async function getList() {
  if (!props.salesId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getProductSalesLinePage({
      pageNo: 1,
      pageSize: 100,
      salesId: props.salesId,
    })
    list.value = data.list
    if (props.stockMode) {
      await Promise.all(list.value.map(item => loadDetailList(item.id)))
    } else {
      detailListMap.value = {}
    }
  } finally {
    loading.value = false
  }
}

/** 获取拣货明细列表 */
function getDetailList(lineId: number) {
  return detailListMap.value[lineId] || []
}

/** 是否正在加载拣货明细 */
function isDetailLoading(lineId: number) {
  return !!detailLoadingMap.value[lineId]
}

/** 加载拣货明细 */
async function loadDetailList(lineId: number) {
  detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: true }
  try {
    const data = await getProductSalesDetailListByLineId(lineId)
    detailListMap.value = { ...detailListMap.value, [lineId]: data }
  } finally {
    detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: false }
  }
}

/** 打开新增表单 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  selectedItem.value = undefined
  selectedNoticeLine.value = undefined
  formVisible.value = true
}

/** 打开编辑表单 */
function openUpdateForm(item: WmProductSalesLineVO) {
  formData.value = {
    id: item.id,
    salesId: item.salesId,
    noticeLineId: item.noticeLineId,
    itemId: item.itemId,
    batchId: item.batchId,
    batchCode: item.batchCode || '',
    quantity: item.quantity,
    oqcCheckFlag: Boolean(item.oqcCheckFlag),
    remark: item.remark || '',
  }
  selectedItem.value = {
    id: item.itemId,
    code: item.itemCode || '',
    name: item.itemName || '',
    specification: item.specification || '',
    unitMeasureName: item.unitMeasureName || '',
  }
  selectedNoticeLine.value = item.noticeLineId
    ? {
        id: item.noticeLineId,
        noticeId: props.noticeId || 0,
        itemId: item.itemId,
        itemCode: item.itemCode || '',
        itemName: item.itemName || '',
        specification: item.specification || '',
        unitMeasureName: item.unitMeasureName || '',
        batchId: item.batchId,
        batchCode: item.batchCode || '',
        quantity: item.quantity,
        oqcCheckFlag: item.oqcCheckFlag,
        remark: item.remark || '',
      }
    : undefined
  formVisible.value = true
}

/** 打开物料选择器 */
function openItemSelector() {
  if (formData.value.noticeLineId) {
    return
  }
  itemSelectorRef.value?.open()
}

/** 打开发货通知行选择器 */
function openNoticeLineSelector() {
  noticeLineSelectorRef.value?.open()
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

/** 选择发货通知行 */
function handleNoticeLineConfirm(line: WmSalesNoticeLineVO) {
  selectedNoticeLine.value = line
  selectedItem.value = {
    id: line.itemId,
    code: line.itemCode || '',
    name: line.itemName || '',
    specification: line.specification || '',
    unitMeasureName: line.unitMeasureName || '',
  }
  formData.value.noticeLineId = line.id
  formData.value.itemId = line.itemId
  formData.value.batchId = line.batchId
  formData.value.batchCode = line.batchCode || ''
  formData.value.quantity = line.quantity
  formData.value.oqcCheckFlag = Boolean(line.oqcCheckFlag)
}

/** 提交出库物料 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!props.salesId) {
    return
  }
  formLoading.value = true
  try {
    const data: WmProductSalesLineCreateReqVO = {
      salesId: props.salesId,
      noticeLineId: formData.value.noticeLineId,
      itemId: formData.value.itemId,
      batchId: formData.value.batchId,
      batchCode: formData.value.batchCode || undefined,
      quantity: formData.value.quantity,
      oqcCheckFlag: formData.value.oqcCheckFlag,
      remark: formData.value.remark || undefined,
    }
    if (formData.value.id) {
      await updateProductSalesLine({ ...data, id: formData.value.id })
      toast.success('修改成功')
    } else {
      await createProductSalesLine(data)
      toast.success('添加成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除出库物料 */
async function handleDelete(item: WmProductSalesLineVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteProductSalesLine(item.id)
  toast.success('删除成功')
  await getList()
}

/** 打开新增拣货明细表单 */
function openCreateDetailForm(item: WmProductSalesLineVO) {
  detailFormData.value = {
    ...getDefaultDetailFormData(),
    salesId: props.salesId,
    lineId: item.id,
    itemId: item.itemId,
    quantity: item.quantity,
  }
  detailSelectedItem.value = {
    id: item.itemId,
    code: item.itemCode,
    name: item.itemName,
    specification: item.specification,
    unitMeasureName: item.unitMeasureName,
  }
  selectedStock.value = undefined
  quantityMax.value = undefined
  detailFormVisible.value = true
}

/** 打开编辑拣货明细表单 */
function openUpdateDetailForm(item: WmProductSalesLineVO, detail: WmProductSalesDetailVO) {
  detailFormData.value = {
    id: detail.id,
    salesId: detail.salesId,
    lineId: detail.lineId,
    materialStockId: detail.materialStockId,
    itemId: detail.itemId,
    quantity: detail.quantity,
    batchId: detail.batchId,
    batchCode: detail.batchCode || '',
    warehouseId: detail.warehouseId,
    warehouseName: detail.warehouseName || '',
    locationId: detail.locationId,
    locationName: detail.locationName || '',
    areaId: detail.areaId,
    areaName: detail.areaName || '',
    remark: detail.remark || '',
  }
  detailSelectedItem.value = {
    id: item.itemId,
    code: item.itemCode,
    name: item.itemName,
    specification: item.specification,
    unitMeasureName: item.unitMeasureName,
  }
  selectedStock.value = detail.materialStockId
    ? {
        id: detail.materialStockId,
        itemTypeId: 0,
        itemId: detail.itemId,
        itemCode: detail.itemCode || item.itemCode || '',
        itemName: detail.itemName || item.itemName || '',
        specification: detail.specification || item.specification || '',
        unitMeasureName: detail.unitMeasureName || item.unitMeasureName || '',
        batchId: detail.batchId || 0,
        batchCode: detail.batchCode || '',
        warehouseId: detail.warehouseId || 0,
        warehouseCode: '',
        warehouseName: detail.warehouseName || '',
        locationId: detail.locationId || 0,
        locationName: detail.locationName || '',
        areaId: detail.areaId || 0,
        areaName: detail.areaName || '',
        vendorId: 0,
        vendorName: '',
        quantity: detail.quantity,
        receiptTime: '',
        frozen: false,
        createTime: '',
      }
    : undefined
  quantityMax.value = undefined
  detailFormVisible.value = true
}

/** 打开库存记录选择器 */
function openStockSelector() {
  if (!detailFormData.value.itemId) {
    toast.warning('请先选择出库物料')
    return
  }
  stockSelectorVisible.value = true
  selectedStock.value = undefined
  stockSearchBatchCode.value = ''
  stockPageNo.value = 1
  stockList.value = []
  stockTotal.value = 0
  loadStockList()
}

/** 搜索库存记录 */
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

/** 库存记录加载更多 */
async function handleStockLoadMore() {
  if (stockLoading.value || stockList.value.length >= stockTotal.value) {
    return
  }
  stockPageNo.value++
  await loadStockList(true)
}

/** 加载库存记录 */
async function loadStockList(append = false) {
  if (!detailFormData.value.itemId || stockLoading.value) {
    return
  }
  stockLoading.value = true
  try {
    const data = await getMaterialStockPage({
      pageNo: stockPageNo.value,
      pageSize: 20,
      itemId: detailFormData.value.itemId,
      batchCode: stockSearchBatchCode.value || undefined,
      frozen: false,
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

/** 确认选择库存记录 */
function handleStockConfirm() {
  if (!selectedStock.value) {
    return
  }
  detailFormData.value.materialStockId = selectedStock.value.id
  detailFormData.value.itemId = selectedStock.value.itemId
  detailFormData.value.quantity = selectedStock.value.quantity
  detailFormData.value.batchId = selectedStock.value.batchId
  detailFormData.value.batchCode = selectedStock.value.batchCode
  detailFormData.value.warehouseId = selectedStock.value.warehouseId
  detailFormData.value.warehouseName = selectedStock.value.warehouseName
  detailFormData.value.locationId = selectedStock.value.locationId
  detailFormData.value.locationName = selectedStock.value.locationName
  detailFormData.value.areaId = selectedStock.value.areaId
  detailFormData.value.areaName = selectedStock.value.areaName
  quantityMax.value = selectedStock.value.quantity
  stockSelectorVisible.value = false
}

/** 删除拣货明细 */
async function handleDeleteDetail(detail: WmProductSalesDetailVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除批次「${detail.batchCode || detail.id}」的拣货明细吗？`,
    })
  } catch {
    return
  }
  await deleteProductSalesDetail(detail.id)
  toast.success('删除成功')
  await loadDetailList(detail.lineId)
}

/** 提交拣货明细表单 */
async function handleSubmitDetail() {
  const result = await detailFormRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!props.salesId || !detailFormData.value.lineId) {
    return
  }
  detailFormLoading.value = true
  try {
    const data: WmProductSalesDetailCreateReqVO = {
      salesId: props.salesId,
      lineId: detailFormData.value.lineId,
      materialStockId: detailFormData.value.materialStockId,
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
      await updateProductSalesDetail({ ...data, id: detailFormData.value.id })
      toast.success('修改成功')
    } else {
      await createProductSalesDetail(data)
      toast.success('新增成功')
    }
    detailFormVisible.value = false
    await loadDetailList(detailFormData.value.lineId)
    await getList()
  } finally {
    detailFormLoading.value = false
  }
}

watch(
  () => [props.salesId, props.stockMode],
  () => {
    getList()
  },
  { immediate: true },
)

defineExpose({ getList })
</script>
