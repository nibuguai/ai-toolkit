<template>
  <view class="mt-24rpx">
    <!-- 标题 -->
    <view class="mb-16rpx flex items-center justify-between">
      <view>
        <view class="text-30rpx text-[#333] font-semibold">
          盘点参数
        </view>
        <view class="mt-4rpx text-24rpx text-[#999]">
          {{ total }} 条
        </view>
      </view>
      <view
        v-if="!readonly"
        class="border border-[#1677ff] rounded-8rpx px-20rpx py-8rpx text-24rpx text-[#1677ff]"
        @click.stop="openCreateForm"
      >
        添加条件
      </view>
      <view v-else class="text-24rpx text-[#999]">
        只读
      </view>
    </view>

    <!-- 参数列表 -->
    <view v-if="list.length > 0">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_WM_STOCK_TAKING_PLAN_PARAM_TYPE" :value="item.type" />
          </view>
          <view class="shrink-0 text-24rpx text-[#999]">
            #{{ item.id }}
          </view>
        </view>
        <view class="mb-10rpx text-26rpx text-[#666]">
          <text class="text-[#999]">条件值编码：</text>{{ item.valueCode || '-' }}
        </view>
        <view class="mb-10rpx text-26rpx text-[#666]">
          <text class="text-[#999]">条件值名称：</text>{{ item.valueName || '-' }}
        </view>
        <view class="text-26rpx text-[#666]">
          <text class="text-[#999]">备注：</text>{{ item.remark || '-' }}
        </view>
        <view v-if="!readonly" class="mt-16rpx flex border-t border-t-[#f0f0f0] pt-16rpx text-28rpx">
          <view class="flex-1 py-12rpx text-center text-[#1677ff]" @click.stop="openUpdateForm(item)">
            编辑
          </view>
          <view class="flex-1 py-12rpx text-center text-[#f56c6c]" @click.stop="handleDelete(item)">
            删除
          </view>
        </view>
      </view>
    </view>
    <view v-else class="rounded-12rpx bg-white py-64rpx text-center text-26rpx text-[#999]">
      {{ loading ? '加载中...' : '暂无盘点参数' }}
    </view>

    <!-- 参数表单 -->
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
              <wd-form-item title="条件类型" title-width="220rpx" prop="type">
                <wd-radio-group v-model="formData.type" type="button">
                  <wd-radio v-for="dict in paramTypeOptions" :key="dict.value" :value="dict.value">
                    {{ dict.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>

              <wd-form-item
                v-if="formData.type === MesWmStockTakingParamTypeEnum.WAREHOUSE"
                title="仓库"
                title-width="220rpx"
                prop="valueId"
              >
                <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openWarehousePicker">
                  <text :class="formData.valueName ? 'text-[#333]' : 'text-[#999]'">
                    {{ getValueText('请选择仓库') }}
                  </text>
                  <wd-icon name="arrow-right" size="28rpx" color="#999" />
                </view>
              </wd-form-item>

              <template v-if="formData.type === MesWmStockTakingParamTypeEnum.LOCATION">
                <wd-form-item title="仓库" title-width="220rpx">
                  <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openLocationWarehousePicker">
                    <text :class="locationWarehouseName ? 'text-[#333]' : 'text-[#999]'">
                      {{ locationWarehouseName || '请先选择仓库' }}
                    </text>
                    <wd-icon name="arrow-right" size="28rpx" color="#999" />
                  </view>
                </wd-form-item>
                <wd-form-item title="库区" title-width="220rpx" prop="valueId">
                  <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openLocationPicker">
                    <text :class="formData.valueName ? 'text-[#333]' : 'text-[#999]'">
                      {{ getValueText('请选择库区') }}
                    </text>
                    <wd-icon name="arrow-right" size="28rpx" color="#999" />
                  </view>
                </wd-form-item>
              </template>

              <template v-if="formData.type === MesWmStockTakingParamTypeEnum.AREA">
                <wd-form-item title="仓库" title-width="220rpx">
                  <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openAreaWarehousePicker">
                    <text :class="areaWarehouseName ? 'text-[#333]' : 'text-[#999]'">
                      {{ areaWarehouseName || '请先选择仓库' }}
                    </text>
                    <wd-icon name="arrow-right" size="28rpx" color="#999" />
                  </view>
                </wd-form-item>
                <wd-form-item title="库区" title-width="220rpx">
                  <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openAreaLocationPicker">
                    <text :class="areaLocationName ? 'text-[#333]' : 'text-[#999]'">
                      {{ areaLocationName || '请再选择库区' }}
                    </text>
                    <wd-icon name="arrow-right" size="28rpx" color="#999" />
                  </view>
                </wd-form-item>
                <wd-form-item title="库位" title-width="220rpx" prop="valueId">
                  <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openAreaPicker">
                    <text :class="formData.valueName ? 'text-[#333]' : 'text-[#999]'">
                      {{ getValueText('请选择库位') }}
                    </text>
                    <wd-icon name="arrow-right" size="28rpx" color="#999" />
                  </view>
                </wd-form-item>
              </template>

              <wd-form-item
                v-if="formData.type === MesWmStockTakingParamTypeEnum.ITEM"
                title="物料"
                title-width="220rpx"
                prop="valueId"
              >
                <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openItemSelector">
                  <text :class="formData.valueName ? 'text-[#333]' : 'text-[#999]'">
                    {{ getValueText('请选择物料') }}
                  </text>
                  <wd-icon name="arrow-right" size="28rpx" color="#999" />
                </view>
              </wd-form-item>

              <wd-form-item
                v-if="formData.type === MesWmStockTakingParamTypeEnum.BATCH"
                title="批次"
                title-width="220rpx"
                prop="valueId"
              >
                <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openBatchSelector">
                  <text :class="formData.valueName ? 'text-[#333]' : 'text-[#999]'">
                    {{ getValueText('请选择批次') }}
                  </text>
                  <wd-icon name="arrow-right" size="28rpx" color="#999" />
                </view>
              </wd-form-item>

              <wd-form-item
                v-if="formData.type === MesWmStockTakingParamTypeEnum.QUALITY_STATUS"
                title="质量状态"
                title-width="220rpx"
                prop="valueId"
              >
                <wd-radio-group v-model="qualityStatusValue" type="button">
                  <wd-radio v-for="dict in qualityStatusOptions" :key="dict.value" :value="dict.value">
                    {{ dict.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>

              <wd-form-item title="备注" title-width="220rpx" prop="remark">
                <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
        </scroll-view>
      </view>
    </wd-popup>

    <!-- 仓储条件选择 -->
    <wd-popup
      v-model="storageSelectorVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 72vh; border-radius: 24rpx 24rpx 0 0; z-index: 20;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <wd-button variant="plain" size="small" @click="storageSelectorVisible = false">
            取消
          </wd-button>
          <view class="text-32rpx text-[#333] font-semibold">
            {{ storageSelectorTitle }}
          </view>
          <view class="w-96rpx" />
        </view>
        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <view class="p-24rpx">
            <view
              v-for="item in storageOptions"
              :key="item.id"
              class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
              @click="handleStorageConfirm(item)"
            >
              <view class="mb-10rpx text-30rpx text-[#333] font-semibold">
                {{ item.code || '-' }}
              </view>
              <view class="text-26rpx text-[#666]">
                {{ item.name || '-' }}
              </view>
            </view>
            <view v-if="storageOptions.length === 0" class="py-100rpx text-center">
              <wd-empty icon="content" tip="暂无可选数据" />
            </view>
          </view>
        </scroll-view>
      </view>
    </wd-popup>

    <!-- 物料选择 -->
    <ItemSelector
      ref="itemSelectorRef"
      :multiple="false"
      @confirm="handleItemConfirm"
    />

    <!-- 批次选择 -->
    <wd-popup
      v-model="batchSelectorVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 78vh; border-radius: 24rpx 24rpx 0 0; z-index: 20;"
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
              <view class="mb-12rpx flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                  {{ batch.code || '-' }}
                </view>
                <dict-tag v-if="batch.qualityStatus != null" :type="DICT_TYPE.MES_WM_QUALITY_STATUS" :value="batch.qualityStatus" />
              </view>
              <view class="mb-10rpx text-26rpx text-[#666]">
                <text class="text-[#999]">物料：</text>{{ batch.itemCode || '-' }} {{ batch.itemName || '' }}
              </view>
              <view class="mb-10rpx text-26rpx text-[#666]">
                <text class="text-[#999]">规格：</text>{{ batch.itemSpecification || '-' }}
              </view>
              <view class="text-26rpx text-[#666]">
                <text class="text-[#999]">有效期：</text>{{ formatDate(batch.expireDate) || '-' }}
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
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItemVO } from '@/api/mes/md/item'
import type { BatchVO } from '@/api/mes/wm/batch'
import type {
  StockTakingPlanParamCreateReqVO,
  StockTakingPlanParamVO,
} from '@/api/mes/wm/stocktaking/plan'
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import type { WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'
import type { WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getBatchPage } from '@/api/mes/wm/batch'
import {
  createStockTakingPlanParam,
  deleteStockTakingPlanParam,
  getStockTakingPlanParam,
  getStockTakingPlanParamPage,
  updateStockTakingPlanParam,
} from '@/api/mes/wm/stocktaking/plan'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { getWarehouseArea, getWarehouseAreaSimpleList } from '@/api/mes/wm/warehouse/area'
import { getWarehouseLocation, getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE, MesWmStockTakingParamTypeEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

interface StockTakingPlanParamFormData {
  id?: number
  type?: number
  valueId?: number
  valueCode: string
  valueName: string
  remark?: string
}

type WarehousePickerMode = 'warehouse' | 'locationWarehouse' | 'areaWarehouse'
type LocationPickerMode = 'location' | 'areaLocation'
type StorageSelectorMode = WarehousePickerMode | LocationPickerMode | 'area'
type StorageOption = WmWarehouseVO | WmWarehouseLocationVO | WmWarehouseAreaVO

const props = defineProps<{
  planId?: number
  readonly?: boolean
}>()

const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<StockTakingPlanParamVO[]>([]) // 盘点参数列表
const total = ref(0) // 参数总数
const formVisible = ref(false) // 表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formMode = ref<'create' | 'update'>('create') // 表单模式
const formData = ref<StockTakingPlanParamFormData>(getDefaultFormData()) // 表单数据
const warehouseOptions = ref<WmWarehouseVO[]>([]) // 仓库选项
const locationOptions = ref<WmWarehouseLocationVO[]>([]) // 库区选项
const areaOptions = ref<WmWarehouseAreaVO[]>([]) // 库位选项
const warehousePickerMode = ref<WarehousePickerMode>('warehouse') // 仓库选择场景
const locationPickerMode = ref<LocationPickerMode>('location') // 库区选择场景
const storageSelectorVisible = ref(false) // 仓储选择器显示状态
const storageSelectorMode = ref<StorageSelectorMode>('warehouse') // 仓储选择场景
const storageSelectorTitle = ref('选择仓库') // 仓储选择标题
const storageOptions = ref<StorageOption[]>([]) // 仓储选择列表
const locationWarehouseId = ref<number>() // 库区条件所属仓库
const locationWarehouseName = ref('') // 库区条件所属仓库名称
const areaWarehouseId = ref<number>() // 库位条件所属仓库
const areaWarehouseName = ref('') // 库位条件所属仓库名称
const areaLocationId = ref<number>() // 库位条件所属库区
const areaLocationName = ref('') // 库位条件所属库区名称
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const batchSelectorVisible = ref(false) // 批次选择器显示状态
const batchLoading = ref(false) // 批次加载状态
const batchList = ref<BatchVO[]>([]) // 批次列表
const selectedBatch = ref<BatchVO>() // 当前选择批次
const batchPageNo = ref(1) // 批次页码
const batchTotal = ref(0) // 批次总数
const batchSearchCode = ref('') // 批次号搜索

const formTitle = computed(() => formMode.value === 'create' ? '添加盘点条件' : '编辑盘点条件')
const paramTypeOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_PLAN_PARAM_TYPE))
const qualityStatusOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_WM_QUALITY_STATUS))
const qualityStatusValue = ref<number>() // 质量状态临时值
const formSchema = createFormSchema({
  type: [{ required: true, message: '条件类型不能为空' }],
  valueId: [{ validator: validateValue }],
})

/** 默认表单数据 */
function getDefaultFormData(): StockTakingPlanParamFormData {
  return {
    type: undefined,
    valueId: undefined,
    valueCode: '',
    valueName: '',
    remark: '',
  }
}

/** 条件值校验 */
function validateValue() {
  if (!formData.value.type) {
    return true
  }
  return formData.value.valueId ? true : '条件值不能为空'
}

/** 条件值展示 */
function getValueText(placeholder: string) {
  return [formData.value.valueCode, formData.value.valueName].filter(Boolean).join(' / ') || placeholder
}

/** 查询盘点参数 */
async function getList() {
  if (!props.planId) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const data = await getStockTakingPlanParamPage({
      pageNo: 1,
      pageSize: 100,
      planId: props.planId,
    })
    list.value = data.list
    total.value = data.total
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
function openCreateForm() {
  formMode.value = 'create'
  formData.value = getDefaultFormData()
  qualityStatusValue.value = undefined
  resetCascadeData()
  formVisible.value = true
}

/** 打开编辑表单 */
async function openUpdateForm(item: StockTakingPlanParamVO) {
  formMode.value = 'update'
  resetCascadeData()
  formVisible.value = true
  formLoading.value = true
  try {
    const data = await getStockTakingPlanParam(item.id)
    formData.value = {
      id: data.id,
      type: data.type,
      valueId: data.valueId,
      valueCode: data.valueCode || '',
      valueName: data.valueName || '',
      remark: data.remark || '',
    }
    qualityStatusValue.value = data.type === MesWmStockTakingParamTypeEnum.QUALITY_STATUS
      ? Number(data.valueId || data.valueCode || undefined)
      : undefined
    await loadCascadeData()
  } finally {
    formLoading.value = false
  }
}

/** 条件类型变化 */
function handleTypeChange() {
  formData.value.valueId = undefined
  formData.value.valueCode = ''
  formData.value.valueName = ''
  qualityStatusValue.value = undefined
  resetCascadeData()
}

/** 清理级联状态 */
function resetCascadeData() {
  locationWarehouseId.value = undefined
  locationWarehouseName.value = ''
  areaWarehouseId.value = undefined
  areaWarehouseName.value = ''
  areaLocationId.value = undefined
  areaLocationName.value = ''
  locationOptions.value = []
  areaOptions.value = []
}

/** 加载编辑级联数据 */
async function loadCascadeData() {
  if (!formData.value.valueId) {
    return
  }
  if (formData.value.type === MesWmStockTakingParamTypeEnum.LOCATION) {
    const location = await getWarehouseLocation(formData.value.valueId)
    locationWarehouseId.value = location.warehouseId
    locationWarehouseName.value = location.warehouseName || ''
  }
  if (formData.value.type === MesWmStockTakingParamTypeEnum.AREA) {
    const area = await getWarehouseArea(formData.value.valueId)
    areaWarehouseId.value = area.warehouseId || undefined
    areaWarehouseName.value = area.warehouseName || ''
    areaLocationId.value = area.locationId
    areaLocationName.value = area.locationName || ''
  }
}

/** 选择仓库条件 */
async function openWarehousePicker() {
  await loadWarehouseOptions()
  warehousePickerMode.value = 'warehouse'
  openStorageSelector('warehouse', '选择仓库', warehouseOptions.value)
}

/** 选择库区所属仓库 */
async function openLocationWarehousePicker() {
  await loadWarehouseOptions()
  warehousePickerMode.value = 'locationWarehouse'
  openStorageSelector('locationWarehouse', '选择仓库', warehouseOptions.value)
}

/** 选择库位所属仓库 */
async function openAreaWarehousePicker() {
  await loadWarehouseOptions()
  warehousePickerMode.value = 'areaWarehouse'
  openStorageSelector('areaWarehouse', '选择仓库', warehouseOptions.value)
}

/** 仓库选择确认 */
async function handleWarehouseConfirm(item: WmWarehouseVO) {
  if (warehousePickerMode.value === 'warehouse') {
    fillSelectedValue(item)
    return
  }
  if (warehousePickerMode.value === 'locationWarehouse') {
    locationWarehouseId.value = item.id
    locationWarehouseName.value = item.name
    formData.value.valueId = undefined
    formData.value.valueCode = ''
    formData.value.valueName = ''
    locationOptions.value = await getWarehouseLocationSimpleList(item.id) || []
    return
  }
  areaWarehouseId.value = item.id
  areaWarehouseName.value = item.name
  areaLocationId.value = undefined
  areaLocationName.value = ''
  formData.value.valueId = undefined
  formData.value.valueCode = ''
  formData.value.valueName = ''
  locationOptions.value = await getWarehouseLocationSimpleList(item.id) || []
  areaOptions.value = []
}

/** 打开库区选择 */
async function openLocationPicker() {
  if (!locationWarehouseId.value) {
    uni.showToast({ title: '请先选择仓库', icon: 'none' })
    return
  }
  if (locationOptions.value.length === 0) {
    locationOptions.value = await getWarehouseLocationSimpleList(locationWarehouseId.value) || []
  }
  locationPickerMode.value = 'location'
  openStorageSelector('location', '选择库区', locationOptions.value)
}

/** 打开库位所属库区选择 */
async function openAreaLocationPicker() {
  if (!areaWarehouseId.value) {
    uni.showToast({ title: '请先选择仓库', icon: 'none' })
    return
  }
  if (locationOptions.value.length === 0) {
    locationOptions.value = await getWarehouseLocationSimpleList(areaWarehouseId.value) || []
  }
  locationPickerMode.value = 'areaLocation'
  openStorageSelector('areaLocation', '选择库区', locationOptions.value)
}

/** 库区选择确认 */
async function handleLocationConfirm(item: WmWarehouseLocationVO) {
  if (locationPickerMode.value === 'location') {
    fillSelectedValue(item)
    return
  }
  areaLocationId.value = item.id
  areaLocationName.value = item.name
  formData.value.valueId = undefined
  formData.value.valueCode = ''
  formData.value.valueName = ''
  areaOptions.value = await getWarehouseAreaSimpleList(item.id) || []
}

/** 打开库位选择 */
async function openAreaPicker() {
  if (!areaLocationId.value) {
    uni.showToast({ title: '请先选择库区', icon: 'none' })
    return
  }
  if (areaOptions.value.length === 0) {
    areaOptions.value = await getWarehouseAreaSimpleList(areaLocationId.value) || []
  }
  openStorageSelector('area', '选择库位', areaOptions.value)
}

/** 库位选择确认 */
function handleAreaConfirm(item: WmWarehouseAreaVO) {
  fillSelectedValue(item)
}

/** 打开仓储选择器 */
function openStorageSelector(mode: StorageSelectorMode, title: string, options: StorageOption[]) {
  storageSelectorMode.value = mode
  storageSelectorTitle.value = title
  storageOptions.value = options
  storageSelectorVisible.value = true
}

/** 仓储选择确认 */
async function handleStorageConfirm(item: StorageOption) {
  if (
    storageSelectorMode.value === 'warehouse'
    || storageSelectorMode.value === 'locationWarehouse'
    || storageSelectorMode.value === 'areaWarehouse'
  ) {
    await handleWarehouseConfirm(item as WmWarehouseVO)
  } else if (storageSelectorMode.value === 'location' || storageSelectorMode.value === 'areaLocation') {
    await handleLocationConfirm(item as WmWarehouseLocationVO)
  } else {
    handleAreaConfirm(item as WmWarehouseAreaVO)
  }
  storageSelectorVisible.value = false
}

/** 打开物料选择器 */
function openItemSelector() {
  itemSelectorRef.value?.open()
}

/** 物料选择确认 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  formData.value.valueId = item.id
  formData.value.valueCode = item.code || ''
  formData.value.valueName = item.name || ''
}

/** 打开批次选择器 */
function openBatchSelector() {
  batchSelectorVisible.value = true
  selectedBatch.value = undefined
  batchSearchCode.value = ''
  batchList.value = []
  batchTotal.value = 0
  batchPageNo.value = 1
  loadBatchList()
}

/** 查询批次 */
async function loadBatchList(append = false) {
  if (batchLoading.value) {
    return
  }
  batchLoading.value = true
  try {
    const data = await getBatchPage({
      pageNo: batchPageNo.value,
      pageSize: 20,
      code: batchSearchCode.value || undefined,
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

/** 加载更多批次 */
async function handleBatchLoadMore() {
  if (batchLoading.value || batchList.value.length >= batchTotal.value) {
    return
  }
  batchPageNo.value += 1
  await loadBatchList(true)
}

/** 批次选择确认 */
function handleBatchConfirm() {
  if (!selectedBatch.value) {
    return
  }
  formData.value.valueId = selectedBatch.value.id
  formData.value.valueCode = selectedBatch.value.code || ''
  formData.value.valueName = selectedBatch.value.code || ''
  batchSelectorVisible.value = false
}

/** 质量状态选择 */
function handleQualityStatusChange(value?: number) {
  if (value === undefined) {
    formData.value.valueId = undefined
    formData.value.valueCode = ''
    formData.value.valueName = ''
    return
  }
  const label = getDictLabel(DICT_TYPE.MES_WM_QUALITY_STATUS, value)
  formData.value.valueId = value
  formData.value.valueCode = String(value)
  formData.value.valueName = label
}

/** 回填通用选择值 */
function fillSelectedValue(item: { id: number, code: string, name: string }) {
  formData.value.valueId = item.id
  formData.value.valueCode = item.code || ''
  formData.value.valueName = item.name || ''
}

/** 删除参数 */
async function handleDelete(item: StockTakingPlanParamVO) {
  const result = await uni.showModal({
    title: '提示',
    content: `确定要删除盘点条件「${item.valueName || item.valueCode || item.id}」吗？`,
    confirmText: '删除',
    confirmColor: '#f56c6c',
  })
  if (!result.confirm) {
    return
  }
  await deleteStockTakingPlanParam(item.id)
  toast.success('删除成功')
  await getList()
}

/** 构造提交数据 */
function buildSubmitData(): StockTakingPlanParamCreateReqVO {
  if (!props.planId) {
    throw new Error('方案编号不能为空')
  }
  if (!formData.value.type) {
    throw new Error('条件类型不能为空')
  }
  if (!formData.value.valueId) {
    throw new Error('条件值不能为空')
  }
  return {
    planId: props.planId,
    type: formData.value.type,
    valueId: formData.value.valueId,
    valueCode: formData.value.valueCode,
    valueName: formData.value.valueName,
    remark: formData.value.remark || undefined,
  }
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (formMode.value === 'create') {
      await createStockTakingPlanParam(data)
      toast.success('新增成功')
    } else if (formData.value.id) {
      await updateStockTakingPlanParam({ ...data, id: formData.value.id })
      toast.success('修改成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

onMounted(getList)

watch(() => props.planId, getList)

watch(() => formData.value.type, (type, oldType) => {
  if (oldType !== undefined && type !== oldType) {
    handleTypeChange()
  }
})

watch(qualityStatusValue, (value) => {
  if (formData.value.type === MesWmStockTakingParamTypeEnum.QUALITY_STATUS) {
    handleQualityStatusChange(value)
  }
})

defineExpose({ reload: getList })
</script>
