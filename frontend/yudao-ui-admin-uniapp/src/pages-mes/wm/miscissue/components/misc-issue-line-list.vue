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
        <text class="mr-8rpx shrink-0 text-[#999]">出库数量：</text>
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
            <wd-form-item title="库存物资" title-width="220rpx" prop="materialStockId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openStockSelector">
                <text :class="selectedStockText ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedStockText || '请选择库存物资' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="出库数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" :min="0.01" :max="quantityInputMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="物料编码" title-width="220rpx" prop="itemId">
              <text>{{ formData.itemCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="物料名称" title-width="220rpx">
              <text>{{ formData.itemName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx">
              <text>{{ formData.batchCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="仓库" title-width="220rpx" prop="warehouseId">
              <text>{{ formData.warehouseName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="库区" title-width="220rpx" prop="locationId">
              <text>{{ formData.locationName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="库位" title-width="220rpx" prop="areaId">
              <text>{{ formData.areaName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="可用库存" title-width="220rpx">
              <text>{{ quantityMax ?? '-' }}</text>
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <!-- 库存物资选择弹窗 -->
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
          选择库存物资
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
              <text class="text-[#999]">规格：</text>{{ stock.specification || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">仓储：</text>{{ stock.warehouseName || '-' }} / {{ stock.locationName || '-' }} / {{ stock.areaName || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">入库时间：</text>{{ formatDate(stock.receiptTime) || '-' }}
            </view>
          </view>
          <view v-if="stockList.length === 0 && !stockLoading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选库存物资" />
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
import type { WmMiscIssueLineCreateReqVO, WmMiscIssueLineVO } from '@/api/mes/wm/miscissue/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { getMaterialStockPage } from '@/api/mes/wm/materialstock'
import {
  createMiscIssueLine,
  deleteMiscIssueLine,
  getMiscIssueLinePage,
  updateMiscIssueLine,
} from '@/api/mes/wm/miscissue/line'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import MesLineListShell from '@/pages-mes/components/mes-line-list-shell.vue'

interface WmMiscIssueLineFormData extends Partial<WmMiscIssueLineCreateReqVO> {
  id?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  warehouseName?: string
  locationName?: string
  areaName?: string
}

const props = defineProps<{
  issueId?: number
  readonly?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<WmMiscIssueLineVO[]>([]) // 出库物料列表
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 行表单提交状态
const formRef = ref<FormInstance>() // 行表单引用
const formData = ref<WmMiscIssueLineFormData>(getDefaultFormData()) // 行表单数据
const stockSelectorVisible = ref(false) // 库存选择器显示状态
const stockLoading = ref(false) // 库存加载状态
const stockList = ref<WmMaterialStockVO[]>([]) // 库存列表
const selectedStock = ref<WmMaterialStockVO>() // 当前选择库存
const stockSearchBatchCode = ref('') // 库存批次搜索
const stockPageNo = ref(1) // 库存当前页
const stockTotal = ref(0) // 库存总数
const quantityMax = ref<number>() // 当前可用库存
const quantityInputMax = computed(() => quantityMax.value ?? 999999999)
const formTitle = computed(() => formData.value.id ? '编辑出库物料' : '添加出库物料')
const selectedStockText = computed(() => {
  if (selectedStock.value) {
    return `${selectedStock.value.batchCode || `库存 #${selectedStock.value.id}`} / ${selectedStock.value.itemCode || '-'}`
  }
  if (formData.value.materialStockId) {
    return `${formData.value.batchCode || `库存 #${formData.value.materialStockId}`} / ${formData.value.itemCode || '-'}`
  }
  return ''
})
const formSchema = createFormSchema({
  materialStockId: [{ required: true, message: '库存物资不能为空' }],
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '出库数量不能为空' },
    { validator: value => Number(value) > 0 || '出库数量必须大于 0' },
    { validator: value => !quantityMax.value || Number(value) <= quantityMax.value || `出库数量不能大于库存 ${quantityMax.value}` },
  ],
  warehouseId: [{ required: true, message: '仓库不能为空' }],
  locationId: [{ required: true, message: '库区不能为空' }],
  areaId: [{ required: true, message: '库位不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData(): WmMiscIssueLineFormData {
  return {
    issueId: props.issueId,
    materialStockId: undefined,
    itemId: undefined,
    quantity: undefined,
    batchId: undefined,
    batchCode: '',
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    remark: '',
  }
}

/** 查询出库物料列表 */
async function getList() {
  if (!props.issueId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getMiscIssueLinePage({
      pageNo: 1,
      pageSize: 100,
      issueId: props.issueId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 打开新增表单 */
function openCreateForm() {
  if (props.readonly) {
    return
  }
  formData.value = getDefaultFormData()
  selectedStock.value = undefined
  quantityMax.value = undefined
  formVisible.value = true
}

/** 打开编辑表单 */
function openUpdateForm(item: WmMiscIssueLineVO) {
  if (props.readonly) {
    return
  }
  formData.value = {
    id: item.id,
    issueId: item.issueId,
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
    warehouseName: item.warehouseName || '',
    locationId: item.locationId,
    locationName: item.locationName || '',
    areaId: item.areaId,
    areaName: item.areaName || '',
    remark: item.remark || '',
  }
  selectedStock.value = undefined
  quantityMax.value = undefined
  formVisible.value = true
}

/** 打开库存选择器 */
async function openStockSelector() {
  if (props.readonly) {
    return
  }
  selectedStock.value = undefined
  stockSearchBatchCode.value = ''
  stockPageNo.value = 1
  stockTotal.value = 0
  stockList.value = []
  stockSelectorVisible.value = true
  await loadStockList(true)
}

/** 查询库存列表 */
async function loadStockList(reset = false) {
  if (stockLoading.value) {
    return
  }
  if (reset) {
    stockPageNo.value = 1
    stockTotal.value = 0
    stockList.value = []
  } else if (stockTotal.value && stockList.value.length >= stockTotal.value) {
    return
  }
  stockLoading.value = true
  try {
    const data = await getMaterialStockPage({
      pageNo: stockPageNo.value,
      pageSize: 10,
      batchCode: stockSearchBatchCode.value || undefined,
      frozen: false,
      virtualFilter: 'exclude',
    })
    stockList.value = reset ? data.list : [...stockList.value, ...data.list]
    stockTotal.value = data.total
    stockPageNo.value += 1
  } finally {
    stockLoading.value = false
  }
}

/** 搜索库存 */
function handleStockSearch() {
  loadStockList(true)
}

/** 重置库存搜索 */
function handleStockReset() {
  stockSearchBatchCode.value = ''
  selectedStock.value = undefined
  loadStockList(true)
}

/** 加载更多库存 */
function handleStockLoadMore() {
  loadStockList()
}

/** 确认库存选择 */
function handleStockConfirm() {
  if (!selectedStock.value) {
    return
  }
  const stock = selectedStock.value
  formData.value.materialStockId = stock.id
  formData.value.itemId = stock.itemId
  formData.value.itemCode = stock.itemCode || ''
  formData.value.itemName = stock.itemName || ''
  formData.value.specification = stock.specification || ''
  formData.value.unitMeasureName = stock.unitMeasureName || ''
  formData.value.batchId = stock.batchId
  formData.value.batchCode = stock.batchCode || ''
  formData.value.warehouseId = stock.warehouseId
  formData.value.warehouseName = stock.warehouseName || ''
  formData.value.locationId = stock.locationId
  formData.value.locationName = stock.locationName || ''
  formData.value.areaId = stock.areaId
  formData.value.areaName = stock.areaName || ''
  quantityMax.value = stock.quantity
  if (!formData.value.quantity || formData.value.quantity > stock.quantity) {
    formData.value.quantity = stock.quantity
  }
  stockSelectorVisible.value = false
}

/** 构造提交数据 */
function buildSubmitData(): WmMiscIssueLineCreateReqVO {
  if (
    !props.issueId
    || !formData.value.itemId
    || !formData.value.quantity
    || !formData.value.warehouseId
    || !formData.value.locationId
    || !formData.value.areaId
  ) {
    throw new Error('出库物料必填项不能为空')
  }
  return {
    issueId: props.issueId,
    sourceDocLineId: formData.value.sourceDocLineId,
    materialStockId: formData.value.materialStockId,
    itemId: formData.value.itemId,
    quantity: formData.value.quantity,
    batchId: formData.value.batchId,
    batchCode: formData.value.batchCode || undefined,
    warehouseId: formData.value.warehouseId,
    locationId: formData.value.locationId,
    areaId: formData.value.areaId,
    remark: formData.value.remark || undefined,
  }
}

/** 提交出库物料 */
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
      await updateMiscIssueLine({ ...data, id: formData.value.id })
      toast.success('修改成功')
    } else {
      await createMiscIssueLine(data)
      toast.success('添加成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除出库物料 */
async function handleDelete(item: WmMiscIssueLineVO) {
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
  await deleteMiscIssueLine(item.id)
  toast.success('删除成功')
  await getList()
}

watch(
  () => props.issueId,
  () => {
    getList()
  },
  { immediate: true },
)
</script>
