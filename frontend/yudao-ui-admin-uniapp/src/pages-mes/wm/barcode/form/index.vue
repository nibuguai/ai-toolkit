<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="业务类型" title-width="220rpx" prop="bizType">
            <wd-radio-group v-if="!currentId" v-model="formData.bizType" type="button">
              <wd-radio v-for="dict in bizTypeOptions" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
            <view v-else class="py-8rpx text-28rpx text-[#666]">
              {{ getDictLabel(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE, formData.bizType) || '-' }}
            </view>
          </wd-form-item>
          <wd-form-item title="业务对象" title-width="220rpx" prop="bizId">
            <view
              v-if="isWarehouseBizType && currentId"
              class="min-h-72rpx flex items-center rounded-8rpx bg-[#f7f8fa] px-20rpx text-28rpx text-[#333]"
            >
              <text class="min-w-0 flex-1 truncate">
                {{ selectedBizText || '-' }}
              </text>
            </view>
            <view
              v-else-if="isWarehouseBizType"
              class="space-y-16rpx"
            >
              <view
                class="min-h-72rpx flex items-center justify-between gap-16rpx rounded-8rpx bg-[#f7f8fa] px-20rpx text-28rpx"
                :class="currentId ? 'opacity-70' : ''"
                @click="openWarehousePicker"
              >
                <text class="min-w-0 flex-1 truncate" :class="warehouseDisplayText ? 'text-[#333]' : 'text-[#999]'">
                  {{ warehouseDisplayText || '请选择仓库' }}
                </text>
                <wd-icon v-if="warehouseId && !currentId" name="close" size="28rpx" @click.stop="clearWarehouseObject" />
                <wd-icon v-else name="arrow-right" size="28rpx" />
              </view>
              <view
                v-if="formData.bizType === BarcodeBizTypeEnum.LOCATION || formData.bizType === BarcodeBizTypeEnum.AREA"
                class="min-h-72rpx flex items-center justify-between gap-16rpx rounded-8rpx bg-[#f7f8fa] px-20rpx text-28rpx"
                :class="currentId ? 'opacity-70' : ''"
                @click="openLocationPicker"
              >
                <text class="min-w-0 flex-1 truncate" :class="locationDisplayText ? 'text-[#333]' : 'text-[#999]'">
                  {{ locationDisplayText || '请选择库区' }}
                </text>
                <wd-icon v-if="locationId && !currentId" name="close" size="28rpx" @click.stop="clearLocationObject" />
                <wd-icon v-else name="arrow-right" size="28rpx" />
              </view>
              <view
                v-if="formData.bizType === BarcodeBizTypeEnum.AREA"
                class="min-h-72rpx flex items-center justify-between gap-16rpx rounded-8rpx bg-[#f7f8fa] px-20rpx text-28rpx"
                :class="currentId ? 'opacity-70' : ''"
                @click="openAreaPicker"
              >
                <text class="min-w-0 flex-1 truncate" :class="areaDisplayText ? 'text-[#333]' : 'text-[#999]'">
                  {{ areaDisplayText || '请选择库位' }}
                </text>
                <wd-icon v-if="formData.bizId && !currentId" name="close" size="28rpx" @click.stop="clearAreaObject" />
                <wd-icon v-else name="arrow-right" size="28rpx" />
              </view>
            </view>
            <view
              v-else-if="isSupportedBizType"
              class="min-h-72rpx flex items-center justify-between gap-16rpx rounded-8rpx bg-[#f7f8fa] px-20rpx text-28rpx"
              :class="currentId ? 'opacity-70' : ''"
              @click="openBizSelector"
            >
              <text class="min-w-0 flex-1 truncate" :class="selectedBizText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedBizText || '请选择业务对象' }}
              </text>
              <wd-icon v-if="formData.bizId && !currentId" name="close" size="28rpx" @click.stop="clearBizObject" />
              <wd-icon v-else name="arrow-right" size="28rpx" />
            </view>
            <view v-else class="rounded-8rpx bg-[#fff7e6] px-20rpx py-18rpx text-26rpx text-[#8a5a00] leading-38rpx">
              {{ unsupportedTip }}
            </view>
          </wd-form-item>
          <wd-form-item title="业务编码" title-width="220rpx" prop="bizCode">
            <wd-input v-model="formData.bizCode" readonly placeholder="选择业务对象后回填" />
          </wd-form-item>
          <wd-form-item title="业务名称" title-width="220rpx" prop="bizName">
            <wd-input v-model="formData.bizName" readonly placeholder="选择业务对象后回填" />
          </wd-form-item>
          <wd-form-item title="条码内容" title-width="220rpx" prop="content">
            <wd-input v-model="formData.content" placeholder="选择业务对象后自动生成，也可手动调整" clearable />
          </wd-form-item>
          <wd-form-item title="状态" title-width="220rpx" prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#8a5a00] leading-40rpx">
        当前已开放仓库、库区、库位、装箱单、库存、批次、流转卡、工单、任务、设备、工具、物料、供应商、工作站、车间、人员和客户条码；流转单待后端模块补齐后开放。
      </view>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions content-class="yd-detail-footer-actions">
      <wd-button class="flex-1" variant="plain" @click="handleConfig">
        条码设置
      </wd-button>
      <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </MesFooterActions>

    <!-- 业务对象选择器 -->
    <ItemSelector ref="itemSelectorRef" :multiple="false" @confirm="handleItemConfirm" />
    <VendorSelector ref="vendorSelectorRef" @confirm="handleVendorConfirm" />
    <ClientSelector ref="clientSelectorRef" @confirm="handleClientConfirm" />
    <WorkOrderSelector ref="workOrderSelectorRef" :confirmed-only="false" @confirm="handleWorkOrderConfirm" />
    <PackageSelector ref="packageSelectorRef" @confirm="handlePackageConfirm" />
    <MaterialStockSelector ref="materialStockSelectorRef" @confirm="handleMaterialStockConfirm" />
    <MachinerySelector ref="machinerySelectorRef" @confirm="handleMachineryConfirm" />
    <WorkstationSelector ref="workstationSelectorRef" @confirm="handleWorkstationConfirm" />
    <BatchSelector ref="batchSelectorRef" @confirm="handleBatchConfirm" />
    <ToolSelector ref="toolSelectorRef" @confirm="handleToolConfirm" />
    <CardSelector ref="cardSelectorRef" @confirm="handleCardConfirm" />
    <TaskSelector ref="taskSelectorRef" :statuses="taskSelectorStatuses" @confirm="handleTaskConfirm" />
    <WorkshopSelector ref="workshopSelectorRef" @confirm="handleWorkshopConfirm" />
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
    <wd-select-picker
      v-model="userPickerValue"
      v-model:visible="userPickerVisible"
      title="选择人员"
      :columns="userOptions"
      value-key="id"
      label-key="nickname"
      type="radio"
      filterable
      @confirm="handleUserPickerConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DvMachineryVO } from '@/api/mes/dv/machinery'
import type { MdClientVO } from '@/api/mes/md/client'
import type { MdItemVO } from '@/api/mes/md/item'
import type { MdVendorVO } from '@/api/mes/md/vendor'
import type { MdWorkstationVO } from '@/api/mes/md/workstation'
import type { MdWorkshopVO } from '@/api/mes/md/workstation/workshop'
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import type { ProCardVO } from '@/api/mes/pro/card'
import type { ProTaskVO } from '@/api/mes/pro/task'
import type { WmBarcodeCreateReqVO, WmBarcodeUpdateReqVO } from '@/api/mes/wm/barcode'
import type { BatchVO } from '@/api/mes/wm/batch'
import type { WmMaterialStockVO } from '@/api/mes/wm/materialstock'
import type { WmPackageVO } from '@/api/mes/wm/packages'
import type { WmWarehouseVO } from '@/api/mes/wm/warehouse'
import type { WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'
import type { WmWarehouseLocationVO } from '@/api/mes/wm/warehouse/location'
import type { WotPickerValue } from '@/utils/wot'
import type { TmToolVO } from '@/api/mes/tm/tool'
import type { User } from '@/api/system/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import MachinerySelector from '@/pages-mes/dv/machinery/components/machinery-selector.vue'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import ClientSelector from '@/pages-mes/md/client/components/client-selector.vue'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import VendorSelector from '@/pages-mes/md/vendor/components/vendor-selector.vue'
import WorkOrderSelector from '@/pages-mes/pro/card/components/workorder-selector.vue'
import WorkstationSelector from '@/pages-mes/pro/task/components/workstation-selector.vue'
import BatchSelector from '@/pages-mes/wm/barcode/components/batch-selector.vue'
import CardSelector from '@/pages-mes/wm/barcode/components/card-selector.vue'
import ToolSelector from '@/pages-mes/wm/barcode/components/tool-selector.vue'
import WorkshopSelector from '@/pages-mes/wm/barcode/components/workshop-selector.vue'
import TaskSelector from '@/pages-mes/pro/feedback/components/task-selector.vue'
import MaterialStockSelector from '@/pages-mes/wm/stocktaking/task/components/material-stock-selector.vue'
import PackageSelector from '@/pages-mes/wm/packages/components/package-selector.vue'
import { createBarcode, generateBarcodeContent, getBarcode, updateBarcode } from '@/api/mes/wm/barcode'
import { getSimpleUserList } from '@/api/system/user'
import { getWarehouseAreaSimpleList } from '@/api/mes/wm/warehouse/area'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { delay, navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum, CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

interface BarcodeFormData {
  id?: number
  bizType?: number
  bizId?: number
  bizCode: string
  bizName: string
  content: string
  status: number
  remark: string
}

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/barcode/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前条码编号
const formLoading = ref(false) // 表单提交状态
const loadingDetail = ref(false) // 详情加载状态
const formRef = ref<FormInstance>() // 表单组件引用
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器
const clientSelectorRef = ref<InstanceType<typeof ClientSelector>>() // 客户选择器
const workOrderSelectorRef = ref<InstanceType<typeof WorkOrderSelector>>() // 工单选择器
const packageSelectorRef = ref<InstanceType<typeof PackageSelector>>() // 装箱单选择器
const materialStockSelectorRef = ref<InstanceType<typeof MaterialStockSelector>>() // 库存选择器
const machinerySelectorRef = ref<InstanceType<typeof MachinerySelector>>() // 设备选择器
const workstationSelectorRef = ref<InstanceType<typeof WorkstationSelector>>() // 工作站选择器
const batchSelectorRef = ref<InstanceType<typeof BatchSelector>>() // 批次选择器
const toolSelectorRef = ref<InstanceType<typeof ToolSelector>>() // 工具选择器
const cardSelectorRef = ref<InstanceType<typeof CardSelector>>() // 流转卡选择器
const taskSelectorRef = ref<InstanceType<typeof TaskSelector>>() // 生产任务选择器
const workshopSelectorRef = ref<InstanceType<typeof WorkshopSelector>>() // 车间选择器
const userPickerValue = ref<number | string>('') // 人员选择值
const userPickerVisible = ref(false) // 人员选择器显示状态
const userOptions = ref<User[]>([]) // 人员选项
const warehouseOptions = ref<WmWarehouseVO[]>([]) // 仓库选项
const locationOptions = ref<WmWarehouseLocationVO[]>([]) // 库区选项
const areaOptions = ref<WmWarehouseAreaVO[]>([]) // 库位选项
const warehousePickerVisible = ref(false) // 仓库选择器显示状态
const locationPickerVisible = ref(false) // 库区选择器显示状态
const areaPickerVisible = ref(false) // 库位选择器显示状态
const warehouseId = ref<number>() // 仓库编号
const locationId = ref<number>() // 库区编号
const taskSelectorStatuses = [0, 1, 2, 3, 4, 5, 10] // 条码选择任务时不过滤状态
const formData = ref<BarcodeFormData>({
  bizType: undefined,
  bizId: undefined,
  bizCode: '',
  bizName: '',
  content: '',
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  bizType: [{ required: true, message: '业务类型不能为空' }],
  bizId: [{ required: true, message: '业务对象不能为空' }],
  bizCode: [{ required: true, message: '业务编码不能为空' }],
  bizName: [{ required: true, message: '业务名称不能为空' }],
  content: [{ required: true, message: '条码内容不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
  remark: [{ max: 200, message: '备注长度不能超过 200 个字符' }],
})
const getTitle = computed(() => currentId.value ? '编辑条码' : '新增条码')
const bizTypeOptions = computed(() => {
  const options = [...getIntDictOptions(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE)]
  if (!options.some(item => item.value === BarcodeBizTypeEnum.TASK)) {
    options.push({ label: '任务', value: BarcodeBizTypeEnum.TASK })
  }
  return options
})
const supportedBizTypes: number[] = [
  BarcodeBizTypeEnum.ITEM,
  BarcodeBizTypeEnum.VENDOR,
  BarcodeBizTypeEnum.CLIENT,
  BarcodeBizTypeEnum.WORKORDER,
  BarcodeBizTypeEnum.PACKAGE,
  BarcodeBizTypeEnum.STOCK,
  BarcodeBizTypeEnum.WAREHOUSE,
  BarcodeBizTypeEnum.LOCATION,
  BarcodeBizTypeEnum.AREA,
  BarcodeBizTypeEnum.BATCH,
  BarcodeBizTypeEnum.PROCARD,
  BarcodeBizTypeEnum.MACHINERY,
  BarcodeBizTypeEnum.TOOL,
  BarcodeBizTypeEnum.WORKSTATION,
  BarcodeBizTypeEnum.TASK,
  BarcodeBizTypeEnum.WORKSHOP,
  BarcodeBizTypeEnum.USER,
] // 已接入移动端选择器的业务类型
const isSupportedBizType = computed(() => {
  return formData.value.bizType !== undefined && supportedBizTypes.includes(formData.value.bizType)
})
const isWarehouseBizType = computed(() => {
  return formData.value.bizType === BarcodeBizTypeEnum.WAREHOUSE
    || formData.value.bizType === BarcodeBizTypeEnum.LOCATION
    || formData.value.bizType === BarcodeBizTypeEnum.AREA
})
const selectedBizText = computed(() => {
  const code = formData.value.bizCode
  const name = formData.value.bizName
  return [code, name].filter(Boolean).join(' / ')
})
const warehousePickerValue = computed(() => warehouseId.value !== undefined ? [warehouseId.value] : [])
const locationPickerValue = computed(() => locationId.value !== undefined ? [locationId.value] : [])
const areaPickerValue = computed(() => formData.value.bizId !== undefined ? [formData.value.bizId] : [])
const warehouseDisplayText = computed(() => getWotPickerFormValue(warehouseOptions.value, warehouseId.value, {
  labelKey: 'name',
  placeholder: '',
  valueKey: 'id',
}))
const locationDisplayText = computed(() => getWotPickerFormValue(locationOptions.value, locationId.value, {
  labelKey: 'name',
  placeholder: '',
  valueKey: 'id',
}))
const areaDisplayText = computed(() => getWotPickerFormValue(areaOptions.value, formData.value.bizId, {
  labelKey: 'name',
  placeholder: '',
  valueKey: 'id',
}))
const unsupportedTip = computed(() => {
  if (!formData.value.bizType) {
    return '请先选择业务类型。'
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.TRANSORDER) {
    return '流转单后端模块尚未实现，移动端暂不开放该业务条码保存。'
  }
  const label = getDictLabel(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE, formData.value.bizType)
  return `${label || '当前业务类型'}暂未纳入移动端条码对象维护范围；如需开放，请先确认后端业务对象来源和移动端选择器设计。`
})

/** 默认表单数据 */
function getDefaultFormData(): BarcodeFormData {
  return {
    bizType: undefined,
    bizId: undefined,
    bizCode: '',
    bizName: '',
    content: '',
    status: CommonStatusEnum.ENABLE,
    remark: '',
  }
}

/** 返回列表 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/barcode/index')
}

/** 打开条码设置 */
function handleConfig() {
  uni.navigateTo({
    url: '/pages-mes/wm/barcode/config/index',
  })
}

/** 清空业务对象 */
function clearBizObject() {
  formData.value.bizId = undefined
  formData.value.bizCode = ''
  formData.value.bizName = ''
  formData.value.content = ''
  warehouseId.value = undefined
  locationId.value = undefined
  locationOptions.value = []
  areaOptions.value = []
}

/** 重置表单 */
function resetForm() {
  formData.value = getDefaultFormData()
  clearBizObject()
}

/** 清空仓库业务对象 */
function clearWarehouseObject() {
  clearBizObject()
}

/** 清空库区业务对象 */
function clearLocationObject() {
  locationId.value = undefined
  if (formData.value.bizType === BarcodeBizTypeEnum.LOCATION) {
    clearBizObject()
    return
  }
  formData.value.bizId = undefined
  formData.value.bizCode = ''
  formData.value.bizName = ''
  formData.value.content = ''
  areaOptions.value = []
}

/** 清空库位业务对象 */
function clearAreaObject() {
  formData.value.bizId = undefined
  formData.value.bizCode = ''
  formData.value.bizName = ''
  formData.value.content = ''
}

/** 加载仓库选项 */
async function loadWarehouseOptions() {
  if (warehouseOptions.value.length > 0) {
    return
  }
  warehouseOptions.value = await getWarehouseSimpleList() || []
}

/** 打开仓库选择 */
async function openWarehousePicker() {
  if (currentId.value) {
    toast.warning('编辑条码时不支持切换业务对象')
    return
  }
  await loadWarehouseOptions()
  warehousePickerVisible.value = true
}

/** 打开库区选择 */
async function openLocationPicker() {
  if (currentId.value) {
    toast.warning('编辑条码时不支持切换业务对象')
    return
  }
  if (!warehouseId.value) {
    toast.warning('请先选择仓库')
    return
  }
  if (locationOptions.value.length === 0) {
    locationOptions.value = await getWarehouseLocationSimpleList(warehouseId.value) || []
  }
  locationPickerVisible.value = true
}

/** 打开库位选择 */
async function openAreaPicker() {
  if (currentId.value) {
    toast.warning('编辑条码时不支持切换业务对象')
    return
  }
  if (!locationId.value) {
    toast.warning('请先选择库区')
    return
  }
  if (areaOptions.value.length === 0) {
    areaOptions.value = await getWarehouseAreaSimpleList(locationId.value) || []
  }
  areaPickerVisible.value = true
}

/** 打开业务对象选择器 */
function openBizSelector() {
  if (currentId.value) {
    toast.warning('编辑条码时不支持切换业务对象')
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.ITEM) {
    itemSelectorRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.VENDOR) {
    vendorSelectorRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.CLIENT) {
    clientSelectorRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.WORKORDER) {
    workOrderSelectorRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.PACKAGE) {
    packageSelectorRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.STOCK) {
    materialStockSelectorRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.BATCH) {
    batchSelectorRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.MACHINERY) {
    machinerySelectorRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.TOOL) {
    toolSelectorRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.WORKSTATION) {
    workstationSelectorRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.PROCARD) {
    cardSelectorRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.TASK) {
    taskSelectorRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.WORKSHOP) {
    workshopSelectorRef.value?.open()
    return
  }
  if (formData.value.bizType === BarcodeBizTypeEnum.USER) {
    openUserPicker()
    return
  }
  toast.warning(unsupportedTip.value)
}

/** 打开人员选择 */
async function openUserPicker() {
  userPickerValue.value = formData.value.bizId ?? ''
  if (userOptions.value.length === 0) {
    userOptions.value = await getSimpleUserList()
  }
  userPickerVisible.value = true
}

/** 回填业务对象 */
async function fillBizObject(bizId: number, bizCode: string, bizName: string) {
  formData.value.bizId = bizId
  formData.value.bizCode = bizCode
  formData.value.bizName = bizName
  await generateContent()
}

/** 生成条码内容 */
async function generateContent() {
  if (!formData.value.bizType || !formData.value.bizCode) {
    formData.value.content = ''
    return
  }
  try {
    formData.value.content = await generateBarcodeContent(formData.value.bizType, formData.value.bizCode)
  } catch {
    formData.value.content = ''
  }
}

/** 确认物料 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  fillBizObject(item.id, item.code || '', item.name || item.code || '')
}

/** 确认供应商 */
function handleVendorConfirm(vendors: MdVendorVO[]) {
  const vendor = vendors[0]
  if (!vendor) {
    return
  }
  fillBizObject(vendor.id, vendor.code || '', vendor.name || vendor.nickname || vendor.code || '')
}

/** 确认客户 */
function handleClientConfirm(clients: MdClientVO[]) {
  const client = clients[0]
  if (!client) {
    return
  }
  fillBizObject(client.id, client.code || '', client.name || client.nickname || client.code || '')
}

/** 确认生产工单 */
function handleWorkOrderConfirm(item: ProWorkOrderVO) {
  fillBizObject(item.id, item.code || '', item.name || item.code || '')
}

/** 确认装箱单 */
function handlePackageConfirm(item: WmPackageVO) {
  fillBizObject(item.id, item.code || '', item.clientName || item.code || '')
}

/** 确认库存台账 */
function handleMaterialStockConfirm(rows: WmMaterialStockVO[]) {
  const stock = rows[0]
  if (!stock) {
    return
  }
  fillBizObject(stock.id, stock.itemCode || stock.batchCode || String(stock.id), stock.itemName || stock.batchCode || '')
}

/** 确认仓库 */
function handleWarehouseConfirm({ value }: { value: WotPickerValue[] }) {
  const id = Number(value[0])
  const warehouse = warehouseOptions.value.find(item => item.id === id)
  if (!warehouse) {
    return
  }
  warehouseId.value = warehouse.id
  locationId.value = undefined
  locationOptions.value = []
  areaOptions.value = []
  if (formData.value.bizType === BarcodeBizTypeEnum.WAREHOUSE) {
    fillBizObject(warehouse.id, warehouse.code || '', warehouse.name || warehouse.code || '')
    return
  }
  clearAreaObject()
}

/** 确认库区 */
async function handleLocationConfirm({ value }: { value: WotPickerValue[] }) {
  const id = Number(value[0])
  const location = locationOptions.value.find(item => item.id === id)
  if (!location) {
    return
  }
  locationId.value = location.id
  areaOptions.value = []
  if (formData.value.bizType === BarcodeBizTypeEnum.LOCATION) {
    await fillBizObject(location.id, location.code || '', location.name || location.code || '')
    return
  }
  clearAreaObject()
}

/** 确认库位 */
function handleAreaConfirm({ value }: { value: WotPickerValue[] }) {
  const id = Number(value[0])
  const area = areaOptions.value.find(item => item.id === id)
  if (!area) {
    return
  }
  fillBizObject(area.id, area.code || '', area.name || area.code || '')
}

/** 确认批次 */
function handleBatchConfirm(item: BatchVO) {
  fillBizObject(item.id, item.code || '', item.itemName || item.code || '')
}

/** 确认设备 */
function handleMachineryConfirm(item: DvMachineryVO) {
  fillBizObject(item.id, item.code || '', item.name || item.code || '')
}

/** 确认工具 */
function handleToolConfirm(item: TmToolVO) {
  fillBizObject(item.id, item.code || '', item.name || item.code || '')
}

/** 确认工作站 */
function handleWorkstationConfirm(item: MdWorkstationVO) {
  fillBizObject(item.id, item.code || '', item.name || item.code || '')
}

/** 确认流转卡 */
function handleCardConfirm(item: ProCardVO) {
  fillBizObject(item.id, item.code || '', item.workOrderName || item.itemName || item.code || '')
}

/** 确认生产任务 */
function handleTaskConfirm(item: ProTaskVO) {
  fillBizObject(item.id, item.code || item.name || String(item.id), item.name || item.itemName || item.processName || '')
}

/** 确认车间 */
function handleWorkshopConfirm(item: MdWorkshopVO) {
  fillBizObject(item.id, item.code || '', item.name || item.code || '')
}

/** 确认人员 */
function handleUserConfirm(users: User[]) {
  const user = users[0]
  if (!user?.id) {
    return
  }
  fillBizObject(user.id, user.username || String(user.id), user.nickname || user.username || '')
}

/** 确认人员 Picker */
function handleUserPickerConfirm({ value }: { value: WotPickerValue }) {
  if (value === '') {
    return
  }
  const userId = Number(value)
  const user = userOptions.value.find(item => item.id === userId)
  if (!user?.id) {
    return
  }
  handleUserConfirm([user])
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  loadingDetail.value = true
  try {
    const data = await getBarcode(currentId.value)
    formData.value = {
      id: data.id,
      bizType: data.bizType,
      bizId: data.bizId,
      bizCode: data.bizCode || '',
      bizName: data.bizName || '',
      content: data.content || '',
      status: data.status,
      remark: data.remark || '',
    }
  } finally {
    loadingDetail.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData(): WmBarcodeCreateReqVO | WmBarcodeUpdateReqVO {
  const data: WmBarcodeCreateReqVO = {
    bizType: Number(formData.value.bizType),
    bizId: Number(formData.value.bizId),
    bizCode: formData.value.bizCode,
    bizName: formData.value.bizName || undefined,
    content: formData.value.content || undefined,
    status: formData.value.status,
    remark: formData.value.remark || undefined,
  }
  if (currentId.value) {
    return { ...data, id: currentId.value }
  }
  return data
}

/** 提交表单 */
async function handleSubmit() {
  if (!isSupportedBizType.value) {
    toast.warning(unsupportedTip.value)
    return
  }
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (currentId.value) {
      await updateBarcode(data as WmBarcodeUpdateReqVO)
      toast.success('修改成功')
    } else {
      await createBarcode(data as WmBarcodeCreateReqVO)
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:barcode:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

watch(
  () => formData.value.bizType,
  () => {
    if (currentId.value || loadingDetail.value) {
      return
    }
    clearBizObject()
  },
)

watch(currentId, () => {
  if (currentId.value) {
    getDetail()
    return
  }
  resetForm()
})

onMounted(() => {
  if (currentId.value) {
    getDetail()
    return
  }
  resetForm()
})
</script>
