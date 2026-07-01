<template>
  <MesLineListShell
    title="退料物料"
    :loading="loading"
    :empty="list.length === 0"
    empty-text="暂无退料物料"
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
        <text class="mr-8rpx shrink-0 text-[#999]">退料数量：</text>
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

      <view v-if="stockMode" class="mt-16rpx rounded-12rpx bg-[#f8fafc] p-16rpx">
        <view class="mb-12rpx text-26rpx text-[#333] font-medium">
          上架明细
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
      </view>
    </view>
  </MesLineListShell>

  <!-- 退料物料表单弹窗 -->
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
            <wd-form-item title="库存记录" title-width="220rpx" prop="materialStockId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openLineStockSelector">
                <text :class="lineStockText ? 'text-[#333]' : 'text-[#999]'">
                  {{ lineStockText || '请选择库存记录' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="物料" title-width="220rpx" prop="itemId">
              <text>{{ selectedLineItemText || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="退料数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" :min="0.01" :max="lineQuantityMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
              <text>{{ formData.batchCode || '-' }}</text>
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
            <wd-form-item title="库存记录" title-width="220rpx" prop="materialStockId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openDetailStockSelector">
                <text :class="detailStockText ? 'text-[#333]' : 'text-[#999]'">
                  {{ detailStockText || '请选择库存记录' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="上架数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="detailFormData.quantity" :min="0.01" :max="detailQuantityMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="仓库" title-width="220rpx" prop="warehouseId">
              <text>{{ selectedDetailStock?.warehouseName || detailFormData.warehouseName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="库区" title-width="220rpx" prop="locationId">
              <text>{{ selectedDetailStock?.locationName || detailFormData.locationName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="库位" title-width="220rpx" prop="areaId">
              <text>{{ selectedDetailStock?.areaName || detailFormData.areaName || '-' }}</text>
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
import type { WmMaterialStockVO } from '@/api/mes/wm/materialstock'
import type {
  WmReturnIssueDetailCreateReqVO,
  WmReturnIssueDetailVO,
} from '@/api/mes/wm/returnissue/detail'
import type {
  WmReturnIssueLineCreateReqVO,
  WmReturnIssueLineVO,
} from '@/api/mes/wm/returnissue/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { getMaterialStockPage } from '@/api/mes/wm/materialstock'
import {
  createReturnIssueDetail,
  deleteReturnIssueDetail,
  getReturnIssueDetailListByLineId,
  updateReturnIssueDetail,
} from '@/api/mes/wm/returnissue/detail'
import {
  createReturnIssueLine,
  deleteReturnIssueLine,
  getReturnIssueLinePage,
  updateReturnIssueLine,
} from '@/api/mes/wm/returnissue/line'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import MesLineListShell from '@/pages-mes/components/mes-line-list-shell.vue'

interface WmReturnIssueLineFormData extends WmReturnIssueLineCreateReqVO {
  id?: number
}

interface WmReturnIssueDetailFormData extends WmReturnIssueDetailCreateReqVO {
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

type StockSelectorTarget = 'line' | 'detail'

const props = defineProps<{
  issueId?: number
  readonly?: boolean
  stockMode?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<WmReturnIssueLineVO[]>([]) // 退料物料列表
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<WmReturnIssueLineFormData>(getDefaultFormData()) // 表单数据
const selectedLineStock = ref<WmMaterialStockVO>() // 行表单库存记录
const lineQuantityMax = ref<number>() // 行表单数量上限
const detailFormVisible = ref(false) // 上架明细表单显示状态
const detailFormLoading = ref(false) // 上架明细提交状态
const detailFormRef = ref<FormInstance>() // 上架明细表单引用
const detailFormData = ref<WmReturnIssueDetailFormData>(getDefaultDetailFormData()) // 上架明细数据
const detailSelectedItem = ref<SelectedItemPreview>() // 上架明细当前物料
const detailListMap = ref<Record<number, WmReturnIssueDetailVO[]>>({}) // 上架明细列表
const detailLoadingMap = ref<Record<number, boolean>>({}) // 上架明细加载状态
const stockSelectorVisible = ref(false) // 库存记录选择器显示状态
const stockSelectorTarget = ref<StockSelectorTarget>('line') // 当前库存选择目标
const stockLoading = ref(false) // 库存记录加载状态
const stockList = ref<WmMaterialStockVO[]>([]) // 库存记录列表
const selectedStock = ref<WmMaterialStockVO>() // 库存弹层当前选择
const selectedDetailStock = ref<WmMaterialStockVO>() // 上架明细库存记录
const stockSearchBatchCode = ref('') // 批次号搜索
const stockPageNo = ref(1) // 库存当前页
const stockTotal = ref(0) // 库存总数
const detailQuantityMax = ref<number>() // 上架明细数量上限
const formTitle = computed(() => formData.value.id ? '编辑退料物料' : '添加退料物料')
const detailFormTitle = computed(() => detailFormData.value.id ? '编辑上架明细' : '添加上架明细')
const selectedLineItemText = computed(() => {
  if (!selectedLineStock.value && !formData.value.itemId) {
    return ''
  }
  return selectedLineStock.value
    ? `${selectedLineStock.value.itemCode || '-'} ${selectedLineStock.value.itemName || ''}`.trim()
    : `物料 #${formData.value.itemId}`
})
const lineStockText = computed(() => {
  return selectedLineStock.value
    ? `${selectedLineStock.value.batchCode || `库存 #${selectedLineStock.value.id}`} / ${selectedLineStock.value.warehouseName || '-'}`
    : ''
})
const detailSelectedItemText = computed(() => {
  return detailSelectedItem.value
    ? `${detailSelectedItem.value.code || '-'} ${detailSelectedItem.value.name || ''}`.trim()
    : ''
})
const detailStockText = computed(() => {
  return selectedDetailStock.value
    ? `${selectedDetailStock.value.batchCode || `库存 #${selectedDetailStock.value.id}`} / ${selectedDetailStock.value.warehouseName || '-'}`
    : ''
})
const formSchema = createFormSchema({
  materialStockId: [{ required: true, message: '请选择库存记录' }],
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '退料数量不能为空' },
    { validator: value => Number(value) > 0 || '退料数量必须大于 0' },
    { validator: value => !lineQuantityMax.value || Number(value) <= lineQuantityMax.value || `退料数量不能大于库存 ${lineQuantityMax.value}` },
  ],
  rqcCheckFlag: [{ required: true, message: '需要质检不能为空' }],
})
const detailFormSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  materialStockId: [{ required: true, message: '请选择库存记录' }],
  quantity: [
    { required: true, message: '上架数量不能为空' },
    { validator: value => Number(value) > 0 || '上架数量必须大于 0' },
    { validator: value => !detailQuantityMax.value || Number(value) <= detailQuantityMax.value || `上架数量不能大于库存 ${detailQuantityMax.value}` },
  ],
  warehouseId: [{ required: true, message: '仓库不能为空' }],
  locationId: [{ required: true, message: '库区不能为空' }],
  areaId: [{ required: true, message: '库位不能为空' }],
})

/** 默认退料物料表单 */
function getDefaultFormData(): WmReturnIssueLineFormData {
  return {
    issueId: props.issueId || 0,
    itemId: undefined,
    materialStockId: undefined,
    quantity: undefined,
    batchId: undefined,
    batchCode: '',
    rqcCheckFlag: false,
    remark: '',
  }
}

/** 默认上架明细表单 */
function getDefaultDetailFormData(): WmReturnIssueDetailFormData {
  return {
    issueId: props.issueId || 0,
    lineId: 0,
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
  }
}

/** 查询退料物料列表 */
async function getList() {
  if (!props.issueId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getReturnIssueLinePage({
      pageNo: 1,
      pageSize: 100,
      issueId: props.issueId,
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

/** 获取上架明细列表 */
function getDetailList(lineId: number) {
  return detailListMap.value[lineId] || []
}

/** 是否加载上架明细 */
function isDetailLoading(lineId: number) {
  return !!detailLoadingMap.value[lineId]
}

/** 加载上架明细 */
async function loadDetailList(lineId: number) {
  detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: true }
  try {
    const data = await getReturnIssueDetailListByLineId(lineId)
    detailListMap.value = { ...detailListMap.value, [lineId]: data }
  } finally {
    detailLoadingMap.value = { ...detailLoadingMap.value, [lineId]: false }
  }
}

/** 打开新增退料物料 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  selectedLineStock.value = undefined
  lineQuantityMax.value = undefined
  formVisible.value = true
}

/** 打开编辑退料物料 */
function openUpdateForm(item: WmReturnIssueLineVO) {
  formData.value = {
    id: item.id,
    issueId: item.issueId,
    itemId: item.itemId,
    materialStockId: item.materialStockId,
    quantity: item.quantity,
    batchId: item.batchId,
    batchCode: item.batchCode || '',
    rqcCheckFlag: Boolean(item.rqcCheckFlag),
    remark: item.remark || '',
  }
  selectedLineStock.value = item.materialStockId
    ? createStockFromLine(item)
    : undefined
  lineQuantityMax.value = undefined
  formVisible.value = true
}

/** 从行数据构造库存预览 */
function createStockFromLine(item: WmReturnIssueLineVO): WmMaterialStockVO {
  return {
    id: item.materialStockId || 0,
    itemTypeId: 0,
    itemId: item.itemId,
    itemCode: item.itemCode || '',
    itemName: item.itemName || '',
    specification: item.specification || '',
    unitMeasureName: item.unitMeasureName || '',
    batchId: item.batchId || 0,
    batchCode: item.batchCode || '',
    warehouseId: 0,
    warehouseCode: '',
    warehouseName: '',
    locationId: 0,
    locationName: '',
    areaId: 0,
    areaName: '',
    vendorId: 0,
    vendorName: '',
    quantity: item.quantity,
    receiptTime: '',
    frozen: false,
    createTime: '',
  }
}

/** 打开行库存选择器 */
function openLineStockSelector() {
  openStockSelector('line')
}

/** 打开明细库存选择器 */
function openDetailStockSelector() {
  if (!detailFormData.value.itemId) {
    toast.warning('请先选择退料物料')
    return
  }
  openStockSelector('detail')
}

/** 打开库存选择器 */
function openStockSelector(target: StockSelectorTarget) {
  stockSelectorTarget.value = target
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
  if (stockLoading.value) {
    return
  }
  stockLoading.value = true
  try {
    const data = await getMaterialStockPage({
      pageNo: stockPageNo.value,
      pageSize: 20,
      itemId: stockSelectorTarget.value === 'detail' ? detailFormData.value.itemId : undefined,
      batchCode: stockSearchBatchCode.value || undefined,
      virtualFilter: 'only',
      frozen: false,
    })
    const availableList = data.list.filter(stock => Number(stock.quantity) > 0)
    if (append) {
      stockList.value.push(...availableList)
    } else {
      stockList.value = availableList
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
  if (stockSelectorTarget.value === 'line') {
    applyLineStock(selectedStock.value)
  } else {
    applyDetailStock(selectedStock.value)
  }
  stockSelectorVisible.value = false
}

/** 回填退料物料库存 */
function applyLineStock(stock: WmMaterialStockVO) {
  selectedLineStock.value = stock
  formData.value.materialStockId = stock.id
  formData.value.itemId = stock.itemId
  formData.value.quantity = stock.quantity
  formData.value.batchId = stock.batchId
  formData.value.batchCode = stock.batchCode
  lineQuantityMax.value = stock.quantity
}

/** 回填上架明细库存 */
function applyDetailStock(stock: WmMaterialStockVO) {
  selectedDetailStock.value = stock
  detailFormData.value.materialStockId = stock.id
  detailFormData.value.itemId = stock.itemId
  detailFormData.value.quantity = stock.quantity
  detailFormData.value.batchId = stock.batchId
  detailFormData.value.batchCode = stock.batchCode
  detailFormData.value.warehouseId = stock.warehouseId
  detailFormData.value.warehouseName = stock.warehouseName
  detailFormData.value.locationId = stock.locationId
  detailFormData.value.locationName = stock.locationName
  detailFormData.value.areaId = stock.areaId
  detailFormData.value.areaName = stock.areaName
  detailQuantityMax.value = stock.quantity
}

/** 提交退料物料 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!props.issueId) {
    return
  }
  formLoading.value = true
  try {
    const data: WmReturnIssueLineCreateReqVO = {
      issueId: props.issueId,
      itemId: formData.value.itemId,
      materialStockId: formData.value.materialStockId,
      quantity: formData.value.quantity,
      batchId: formData.value.batchId,
      batchCode: formData.value.batchCode || undefined,
      rqcCheckFlag: Boolean(formData.value.rqcCheckFlag),
      remark: formData.value.remark || undefined,
    }
    if (formData.value.id) {
      await updateReturnIssueLine({ ...data, id: formData.value.id })
      toast.success('修改成功')
    } else {
      await createReturnIssueLine(data)
      toast.success('添加成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除退料物料 */
async function handleDelete(item: WmReturnIssueLineVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteReturnIssueLine(item.id)
  toast.success('删除成功')
  await getList()
}

/** 打开新增上架明细 */
function openCreateDetailForm(item: WmReturnIssueLineVO) {
  detailFormData.value = {
    ...getDefaultDetailFormData(),
    issueId: props.issueId || 0,
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
  selectedDetailStock.value = undefined
  detailQuantityMax.value = undefined
  detailFormVisible.value = true
}

/** 打开编辑上架明细 */
function openUpdateDetailForm(item: WmReturnIssueLineVO, detail: WmReturnIssueDetailVO) {
  detailFormData.value = {
    id: detail.id,
    issueId: detail.issueId,
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
  selectedDetailStock.value = detail.materialStockId
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
  detailQuantityMax.value = undefined
  detailFormVisible.value = true
}

/** 删除上架明细 */
async function handleDeleteDetail(detail: WmReturnIssueDetailVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除批次「${detail.batchCode || detail.id}」的上架明细吗？`,
    })
  } catch {
    return
  }
  await deleteReturnIssueDetail(detail.id)
  toast.success('删除成功')
  await loadDetailList(detail.lineId)
}

/** 提交上架明细 */
async function handleSubmitDetail() {
  const result = await detailFormRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!props.issueId || !detailFormData.value.lineId) {
    return
  }
  detailFormLoading.value = true
  try {
    const data: WmReturnIssueDetailCreateReqVO = {
      issueId: props.issueId,
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
      await updateReturnIssueDetail({ ...data, id: detailFormData.value.id })
      toast.success('修改成功')
    } else {
      await createReturnIssueDetail(data)
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
  () => [props.issueId, props.stockMode],
  () => {
    getList()
  },
  { immediate: true },
)

defineExpose({ getList })
</script>
