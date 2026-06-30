<template>
  <MesLineListShell
    title="调拨物料"
    :loading="loading"
    :empty="list.length === 0"
    empty-text="暂无调拨物料"
    :readonly="readonly"
    add-text="添加物料"
    :show-add="!stockMode"
    @add="openCreateLineForm"
  >
    <template #action>
      <view v-if="readonly" class="text-24rpx text-[#999]">
        只读
      </view>
      <view v-else-if="stockMode" class="text-24rpx text-[#999]">
        上架模式
      </view>
      <view
        v-else
        class="border border-[#1677ff] rounded-8rpx px-20rpx py-8rpx text-24rpx text-[#1677ff]"
        @click.stop="openCreateLineForm"
      >
        添加物料
      </view>
    </template>
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
          <view v-if="!readonly && !stockMode" class="mt-8rpx flex gap-16rpx text-24rpx">
            <text class="text-[#1677ff]" @click.stop="openUpdateLineForm(item)">
              编辑
            </text>
            <text class="text-[#f56c6c]" @click.stop="handleDeleteLine(item)">
              删除
            </text>
          </view>
          <view v-if="stockMode" class="mt-8rpx flex justify-end gap-16rpx text-24rpx">
            <text class="text-[#52c41a]" @click.stop="openCreateDetailForm(item)">
              上架
            </text>
          </view>
        </view>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">转移数量：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">批次号：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">移出位置：</text>
        <text class="min-w-0 flex-1 truncate">
          {{ item.fromWarehouseName || '-' }} / {{ item.fromLocationName || '-' }} / {{ item.fromAreaName || '-' }}
        </text>
      </view>
      <view class="mb-16rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
      </view>

      <view class="rounded-10rpx bg-[#fafafa] px-20rpx py-16rpx">
        <view class="mb-12rpx flex items-center justify-between">
          <view class="text-26rpx text-[#333] font-medium">
            上架明细
          </view>
          <view class="text-24rpx text-[#999]">
            合计 {{ getDetailQuantityTotal(item.id) }} / {{ item.quantity ?? '-' }}
          </view>
        </view>
        <view v-if="getDetailList(item.id).length === 0" class="py-12rpx text-24rpx text-[#999]">
          暂无上架明细
        </view>
        <view
          v-for="detail in getDetailList(item.id)"
          :key="detail.id"
          class="border-t border-t-[#eee] py-12rpx first:border-t-0"
        >
          <view class="mb-8rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 text-26rpx text-[#666]">
              <text class="text-[#999]">移入位置：</text>
              {{ detail.toWarehouseName || '-' }} / {{ detail.toLocationName || '-' }} / {{ detail.toAreaName || '-' }}
            </view>
            <view v-if="stockMode" class="flex shrink-0 gap-16rpx text-24rpx">
              <text class="text-[#1677ff]" @click.stop="openUpdateDetailForm(item, detail)">
                编辑
              </text>
              <text class="text-[#f56c6c]" @click.stop="handleDeleteDetail(item, detail)">
                删除
              </text>
            </view>
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            <text class="text-[#999]">上架数量：</text>{{ detail.quantity ?? '-' }}
          </view>
          <view class="text-26rpx text-[#666]">
            <text class="text-[#999]">备注：</text>{{ detail.remark || '-' }}
          </view>
        </view>
      </view>
    </view>
  </MesLineListShell>

  <!-- 调拨物料表单弹窗 -->
  <!-- TODO @YunaiV：本 wd-popup 去掉 transition="fade" :duration="0"，对齐 system/infra（基线不带这俩属性） -->
  <wd-popup
    v-model="lineFormVisible"
    position="top"
    transition="fade"
    :duration="0"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="lineFormVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ lineFormTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="lineFormLoading" @click="handleSubmitLine">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="lineFormRef" :model="lineFormData" :schema="lineFormSchema">
          <wd-cell-group border>
            <wd-form-item title="库存物资" title-width="220rpx" prop="materialStockId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openStockSelector">
                <text :class="selectedStockText ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedStockText || '请选择库存物资' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="转移数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="lineFormData.quantity" :min="0.01" :max="lineQuantityInputMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="物料编码" title-width="220rpx" prop="itemId">
              <text>{{ lineFormData.itemCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="物料名称" title-width="220rpx">
              <text>{{ lineFormData.itemName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx">
              <text>{{ lineFormData.batchCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="移出仓库" title-width="220rpx" prop="fromWarehouseId">
              <text>{{ lineFormData.fromWarehouseName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="移出库区" title-width="220rpx" prop="fromLocationId">
              <text>{{ lineFormData.fromLocationName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="移出库位" title-width="220rpx" prop="fromAreaId">
              <text>{{ lineFormData.fromAreaName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="可用库存" title-width="220rpx">
              <text>{{ lineQuantityMax ?? '-' }}</text>
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="lineFormData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
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
              <text>{{ detailItemText || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="上架数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="detailFormData.quantity" :min="0.01" :max="detailQuantityInputMax" :precision="2" />
            </wd-form-item>
            <wd-form-item title="剩余可上架" title-width="220rpx">
              <text>{{ detailQuantityMax ?? '-' }}</text>
            </wd-form-item>
            <wd-form-item title="移入仓库" title-width="220rpx" prop="toWarehouseId" is-link :value="warehouseDisplayValue" placeholder="请选择仓库" @click="openWarehousePicker" />
            <wd-picker v-model:visible="warehousePickerVisible" :model-value="warehousePickerValue" :columns="warehouseOptions" label-key="name" value-key="id" @confirm="handleWarehouseConfirm" />
            <wd-form-item title="移入库区" title-width="220rpx" prop="toLocationId" is-link :value="locationDisplayValue" placeholder="请选择库区" @click="openLocationPicker" />
            <wd-picker v-model:visible="locationPickerVisible" :model-value="locationPickerValue" :columns="locationOptions" label-key="name" value-key="id" @confirm="handleLocationConfirm" />
            <wd-form-item title="移入库位" title-width="220rpx" prop="toAreaId" is-link :value="areaDisplayValue" placeholder="请选择库位" @click="openAreaPicker" />
            <wd-picker v-model:visible="areaPickerVisible" :model-value="areaPickerValue" :columns="areaOptions" label-key="name" value-key="id" @confirm="handleAreaConfirm" />
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
  WmTransferDetailCreateReqVO,
  WmTransferDetailVO,
} from '@/api/mes/wm/transfer/detail'
import type {
  WmTransferLineCreateReqVO,
  WmTransferLineVO,
} from '@/api/mes/wm/transfer/line'
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import type { WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'
import type { WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import type { WotPickerValue } from '@/utils/wot'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { getMaterialStock, getMaterialStockPage } from '@/api/mes/wm/materialstock'
import {
  createTransferDetail,
  deleteTransferDetail,
  getTransferDetailListByLineId,
  updateTransferDetail,
} from '@/api/mes/wm/transfer/detail'
import {
  createTransferLine,
  deleteTransferLine,
  getTransferLineList,
  updateTransferLine,
} from '@/api/mes/wm/transfer/line'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { getWarehouseAreaSimpleList } from '@/api/mes/wm/warehouse/area'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate } from '@/utils/date'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import MesLineListShell from '@/pages-mes/components/mes-line-list-shell.vue'

interface WmTransferLineFormData extends Partial<WmTransferLineCreateReqVO> {
  id?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  batchCode?: string
  fromWarehouseName?: string
  fromLocationName?: string
  fromAreaName?: string
}

interface WmTransferDetailFormData extends Partial<WmTransferDetailCreateReqVO> {
  id?: number
  itemCode?: string
  itemName?: string
}

const props = defineProps<{
  transferId?: number
  readonly?: boolean
  stockMode?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<WmTransferLineVO[]>([]) // 调拨物料列表
const detailMap = ref<Record<number, WmTransferDetailVO[]>>({}) // 上架明细映射
const lineFormVisible = ref(false) // 调拨物料表单显示
const lineFormLoading = ref(false) // 调拨物料提交状态
const lineFormRef = ref<FormInstance>() // 调拨物料表单引用
const lineFormData = ref<WmTransferLineFormData>(getDefaultLineFormData()) // 调拨物料表单数据
const stockSelectorVisible = ref(false) // 库存选择器显示
const stockLoading = ref(false) // 库存加载状态
const stockList = ref<WmMaterialStockVO[]>([]) // 库存列表
const selectedStock = ref<WmMaterialStockVO>() // 当前选择库存
const stockSearchBatchCode = ref('') // 库存批次搜索
const stockPageNo = ref(1) // 库存当前页
const stockTotal = ref(0) // 库存总数
const lineQuantityMax = ref<number>() // 当前可用库存
const detailFormVisible = ref(false) // 上架明细表单显示
const detailFormLoading = ref(false) // 上架明细提交状态
const detailFormRef = ref<FormInstance>() // 上架明细表单引用
const currentLine = ref<WmTransferLineVO>() // 当前上架行
const detailFormData = ref<WmTransferDetailFormData>(getDefaultDetailFormData()) // 上架明细表单数据
const warehouseOptions = ref<WmWarehouseVO[]>([]) // 仓库选项
const locationOptions = ref<WmWarehouseLocationVO[]>([]) // 库区选项
const areaOptions = ref<WmWarehouseAreaVO[]>([]) // 库位选项
const warehousePickerVisible = ref(false) // 仓库选择器显示
const locationPickerVisible = ref(false) // 库区选择器显示
const areaPickerVisible = ref(false) // 库位选择器显示
const lineQuantityInputMax = computed(() => lineQuantityMax.value ?? 999999999)
const detailQuantityMax = computed(() => getDetailRemainingQuantity(currentLine.value, detailFormData.value.id))
const detailQuantityInputMax = computed(() => detailQuantityMax.value ?? 999999999)
const lineFormTitle = computed(() => lineFormData.value.id ? '编辑调拨物料' : '添加调拨物料')
const detailFormTitle = computed(() => detailFormData.value.id ? '编辑上架明细' : '添加上架明细')
const selectedStockText = computed(() => {
  if (selectedStock.value) {
    return `${selectedStock.value.batchCode || `库存 #${selectedStock.value.id}`} / ${selectedStock.value.itemCode || '-'}`
  }
  if (lineFormData.value.materialStockId) {
    return `${lineFormData.value.batchCode || `库存 #${lineFormData.value.materialStockId}`} / ${lineFormData.value.itemCode || '-'}`
  }
  return ''
})
const warehousePickerValue = computed(() => detailFormData.value.toWarehouseId !== undefined ? [detailFormData.value.toWarehouseId] : [])
const locationPickerValue = computed(() => detailFormData.value.toLocationId !== undefined ? [detailFormData.value.toLocationId] : [])
const areaPickerValue = computed(() => detailFormData.value.toAreaId !== undefined ? [detailFormData.value.toAreaId] : [])
const warehouseDisplayValue = computed(() => getWotPickerFormValue(warehouseOptions.value, detailFormData.value.toWarehouseId, { labelKey: 'name', valueKey: 'id', placeholder: '' }))
const locationDisplayValue = computed(() => getWotPickerFormValue(locationOptions.value, detailFormData.value.toLocationId, { labelKey: 'name', valueKey: 'id', placeholder: '' }))
const areaDisplayValue = computed(() => getWotPickerFormValue(areaOptions.value, detailFormData.value.toAreaId, { labelKey: 'name', valueKey: 'id', placeholder: '' }))
const detailItemText = computed(() => {
  if (currentLine.value) {
    return `${currentLine.value.itemCode || '-'} ${currentLine.value.itemName || ''}`.trim()
  }
  return detailFormData.value.itemId ? `物料 #${detailFormData.value.itemId}` : ''
})
const lineFormSchema = createFormSchema({
  materialStockId: [{ required: true, message: '库存物资不能为空' }],
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '转移数量不能为空' },
    { validator: value => Number(value) > 0 || '转移数量必须大于 0' },
    { validator: value => !lineQuantityMax.value || Number(value) <= lineQuantityMax.value || `转移数量不能大于库存 ${lineQuantityMax.value}` },
  ],
  fromWarehouseId: [{ required: true, message: '移出仓库不能为空' }],
  fromLocationId: [{ required: true, message: '移出库区不能为空' }],
  fromAreaId: [{ required: true, message: '移出库位不能为空' }],
})
const detailFormSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '上架数量不能为空' },
    { validator: value => Number(value) > 0 || '上架数量必须大于 0' },
    { validator: value => !detailQuantityMax.value || Number(value) <= detailQuantityMax.value || `上架数量不能大于剩余数量 ${detailQuantityMax.value}` },
  ],
  toWarehouseId: [{ required: true, message: '移入仓库不能为空' }],
  toLocationId: [{ required: true, message: '移入库区不能为空' }],
  toAreaId: [{ required: true, message: '移入库位不能为空' }],
})

/** 默认调拨物料表单数据 */
function getDefaultLineFormData(): WmTransferLineFormData {
  return {
    transferId: props.transferId,
    materialStockId: undefined,
    itemId: undefined,
    quantity: undefined,
    batchId: undefined,
    fromWarehouseId: undefined,
    fromLocationId: undefined,
    fromAreaId: undefined,
    remark: '',
  }
}

/** 默认上架明细表单数据 */
function getDefaultDetailFormData(): WmTransferDetailFormData {
  return {
    lineId: currentLine.value?.id,
    transferId: props.transferId,
    itemId: currentLine.value?.itemId,
    quantity: undefined,
    batchId: currentLine.value?.batchId,
    toWarehouseId: undefined,
    toLocationId: undefined,
    toAreaId: undefined,
    remark: '',
  }
}

/** 查询调拨物料列表 */
async function getList() {
  if (!props.transferId) {
    list.value = []
    detailMap.value = {}
    return
  }
  loading.value = true
  try {
    const lineList = await getTransferLineList(props.transferId)
    list.value = lineList
    const entries = await Promise.all(lineList.map(async (line) => {
      const details = await getTransferDetailListByLineId(line.id)
      return [line.id, details] as const
    }))
    detailMap.value = Object.fromEntries(entries)
  } finally {
    loading.value = false
  }
}

/** 查询当前行上架明细 */
function getDetailList(lineId: number) {
  return detailMap.value[lineId] || []
}

/** 获取上架合计 */
function getDetailQuantityTotal(lineId: number) {
  return getDetailList(lineId).reduce((total, item) => total + Number(item.quantity || 0), 0)
}

/** 计算剩余可上架数量 */
function getDetailRemainingQuantity(line?: WmTransferLineVO, editingDetailId?: number) {
  if (!line) {
    return undefined
  }
  const usedQuantity = getDetailList(line.id).reduce((total, item) => {
    if (editingDetailId && item.id === editingDetailId) {
      return total
    }
    return total + Number(item.quantity || 0)
  }, 0)
  return Math.max(Number(line.quantity || 0) - usedQuantity, 0)
}

/** 打开新增调拨物料 */
function openCreateLineForm() {
  if (props.readonly || props.stockMode) {
    return
  }
  lineFormData.value = getDefaultLineFormData()
  selectedStock.value = undefined
  lineQuantityMax.value = undefined
  lineFormVisible.value = true
}

/** 打开编辑调拨物料 */
async function openUpdateLineForm(item: WmTransferLineVO) {
  if (props.readonly || props.stockMode) {
    return
  }
  lineFormData.value = {
    id: item.id,
    transferId: item.transferId,
    materialStockId: item.materialStockId,
    itemId: item.itemId,
    itemCode: item.itemCode || '',
    itemName: item.itemName || '',
    specification: item.specification || '',
    unitMeasureName: item.unitMeasureName || '',
    quantity: item.quantity,
    batchId: item.batchId,
    batchCode: item.batchCode || '',
    fromWarehouseId: item.fromWarehouseId,
    fromWarehouseName: item.fromWarehouseName || '',
    fromLocationId: item.fromLocationId,
    fromLocationName: item.fromLocationName || '',
    fromAreaId: item.fromAreaId,
    fromAreaName: item.fromAreaName || '',
    remark: item.remark || '',
  }
  selectedStock.value = undefined
  lineQuantityMax.value = undefined
  if (item.materialStockId) {
    const stock = await getMaterialStock(item.materialStockId)
    lineQuantityMax.value = stock.quantity
  }
  lineFormVisible.value = true
}

/** 打开库存选择器 */
async function openStockSelector() {
  if (props.readonly || props.stockMode) {
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
  lineFormData.value.materialStockId = stock.id
  lineFormData.value.itemId = stock.itemId
  lineFormData.value.itemCode = stock.itemCode || ''
  lineFormData.value.itemName = stock.itemName || ''
  lineFormData.value.specification = stock.specification || ''
  lineFormData.value.unitMeasureName = stock.unitMeasureName || ''
  lineFormData.value.batchId = stock.batchId
  lineFormData.value.batchCode = stock.batchCode || ''
  lineFormData.value.fromWarehouseId = stock.warehouseId
  lineFormData.value.fromWarehouseName = stock.warehouseName || ''
  lineFormData.value.fromLocationId = stock.locationId
  lineFormData.value.fromLocationName = stock.locationName || ''
  lineFormData.value.fromAreaId = stock.areaId
  lineFormData.value.fromAreaName = stock.areaName || ''
  lineQuantityMax.value = stock.quantity
  if (!lineFormData.value.quantity || lineFormData.value.quantity > stock.quantity) {
    lineFormData.value.quantity = stock.quantity
  }
  stockSelectorVisible.value = false
}

/** 构造调拨物料提交数据 */
function buildLineSubmitData(): WmTransferLineCreateReqVO {
  if (
    !props.transferId
    || !lineFormData.value.materialStockId
    || !lineFormData.value.itemId
    || !lineFormData.value.quantity
    || !lineFormData.value.fromWarehouseId
    || !lineFormData.value.fromLocationId
    || !lineFormData.value.fromAreaId
  ) {
    throw new Error('调拨物料必填项不能为空')
  }
  return {
    transferId: props.transferId,
    materialStockId: lineFormData.value.materialStockId,
    itemId: lineFormData.value.itemId,
    quantity: lineFormData.value.quantity,
    batchId: lineFormData.value.batchId,
    fromWarehouseId: lineFormData.value.fromWarehouseId,
    fromLocationId: lineFormData.value.fromLocationId,
    fromAreaId: lineFormData.value.fromAreaId,
    remark: lineFormData.value.remark || undefined,
  }
}

/** 提交调拨物料 */
async function handleSubmitLine() {
  if (props.readonly || props.stockMode) {
    return
  }
  const result = await lineFormRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  lineFormLoading.value = true
  try {
    const data = buildLineSubmitData()
    if (lineFormData.value.id) {
      await updateTransferLine({ ...data, id: lineFormData.value.id })
      toast.success('修改成功')
    } else {
      await createTransferLine(data)
      toast.success('添加成功')
    }
    lineFormVisible.value = false
    await getList()
  } finally {
    lineFormLoading.value = false
  }
}

/** 删除调拨物料 */
async function handleDeleteLine(item: WmTransferLineVO) {
  if (props.readonly || props.stockMode) {
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
  await deleteTransferLine(item.id)
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

/** 打开新增上架明细 */
async function openCreateDetailForm(line: WmTransferLineVO) {
  if (!props.stockMode) {
    return
  }
  currentLine.value = line
  detailFormData.value = getDefaultDetailFormData()
  locationOptions.value = []
  areaOptions.value = []
  await loadWarehouseOptions()
  detailFormVisible.value = true
}

/** 打开编辑上架明细 */
async function openUpdateDetailForm(line: WmTransferLineVO, detail: WmTransferDetailVO) {
  if (!props.stockMode) {
    return
  }
  currentLine.value = line
  detailFormData.value = {
    id: detail.id,
    lineId: detail.lineId,
    transferId: detail.transferId,
    itemId: detail.itemId,
    itemCode: detail.itemCode || '',
    itemName: detail.itemName || '',
    quantity: detail.quantity,
    batchId: detail.batchId,
    toWarehouseId: detail.toWarehouseId,
    toLocationId: detail.toLocationId,
    toAreaId: detail.toAreaId,
    remark: detail.remark || '',
  }
  await loadWarehouseOptions()
  locationOptions.value = detail.toWarehouseId ? await getWarehouseLocationSimpleList(detail.toWarehouseId) || [] : []
  areaOptions.value = detail.toLocationId ? await getWarehouseAreaSimpleList(detail.toLocationId) || [] : []
  detailFormVisible.value = true
}

/** 打开仓库选择 */
async function openWarehousePicker() {
  if (!props.stockMode) {
    return
  }
  await loadWarehouseOptions()
  warehousePickerVisible.value = true
}

/** 选择仓库 */
async function handleWarehouseConfirm({ value }: { value: WotPickerValue[] }) {
  const warehouseId = Number(value[0])
  detailFormData.value.toWarehouseId = warehouseId
  detailFormData.value.toLocationId = undefined
  detailFormData.value.toAreaId = undefined
  locationOptions.value = await getWarehouseLocationSimpleList(warehouseId) || []
  areaOptions.value = []
}

/** 打开库区选择 */
function openLocationPicker() {
  if (!props.stockMode) {
    return
  }
  if (!detailFormData.value.toWarehouseId) {
    toast.warning('请先选择仓库')
    return
  }
  locationPickerVisible.value = true
}

/** 选择库区 */
async function handleLocationConfirm({ value }: { value: WotPickerValue[] }) {
  const locationId = Number(value[0])
  detailFormData.value.toLocationId = locationId
  detailFormData.value.toAreaId = undefined
  areaOptions.value = await getWarehouseAreaSimpleList(locationId) || []
}

/** 打开库位选择 */
function openAreaPicker() {
  if (!props.stockMode) {
    return
  }
  if (!detailFormData.value.toLocationId) {
    toast.warning('请先选择库区')
    return
  }
  areaPickerVisible.value = true
}

/** 选择库位 */
function handleAreaConfirm({ value }: { value: WotPickerValue[] }) {
  detailFormData.value.toAreaId = Number(value[0])
}

/** 构造上架明细提交数据 */
function buildDetailSubmitData(): WmTransferDetailCreateReqVO {
  if (
    !props.transferId
    || !currentLine.value
    || !detailFormData.value.itemId
    || !detailFormData.value.quantity
    || !detailFormData.value.toWarehouseId
    || !detailFormData.value.toLocationId
    || !detailFormData.value.toAreaId
  ) {
    throw new Error('上架明细必填项不能为空')
  }
  return {
    lineId: currentLine.value.id,
    transferId: props.transferId,
    itemId: detailFormData.value.itemId,
    quantity: detailFormData.value.quantity,
    batchId: detailFormData.value.batchId,
    toWarehouseId: detailFormData.value.toWarehouseId,
    toLocationId: detailFormData.value.toLocationId,
    toAreaId: detailFormData.value.toAreaId,
    remark: detailFormData.value.remark || undefined,
  }
}

/** 提交上架明细 */
async function handleSubmitDetail() {
  if (!props.stockMode) {
    return
  }
  const result = await detailFormRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  detailFormLoading.value = true
  try {
    const data = buildDetailSubmitData()
    if (detailFormData.value.id) {
      await updateTransferDetail({ ...data, id: detailFormData.value.id })
      toast.success('修改成功')
    } else {
      await createTransferDetail(data)
      toast.success('添加成功')
    }
    detailFormVisible.value = false
    await getList()
  } finally {
    detailFormLoading.value = false
  }
}

/** 删除上架明细 */
async function handleDeleteDetail(line: WmTransferLineVO, detail: WmTransferDetailVO) {
  if (!props.stockMode) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${line.itemCode || line.itemName || detail.id}」的上架明细吗？`,
    })
  } catch {
    return
  }
  await deleteTransferDetail(detail.id)
  toast.success('删除成功')
  await getList()
}

watch(
  () => props.transferId,
  () => {
    getList()
  },
  { immediate: true },
)
</script>
