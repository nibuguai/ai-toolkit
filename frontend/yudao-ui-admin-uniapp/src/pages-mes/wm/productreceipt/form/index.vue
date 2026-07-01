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
          <wd-form-item title="入库单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入入库单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="入库单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入入库单名称" />
          </wd-form-item>
          <wd-form-item
            title="入库日期"
            title-width="200rpx"
            prop="receiptDate"
            is-link
            placeholder="请选择入库日期"
            :value="formatDate(formData.receiptDate)"
            @click="openReceiptDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.receiptDate"
            v-model:visible="pickerVisible.receiptDate"
            title="请选择入库日期"
            type="date"
          />
          <wd-form-item title="生产工单" title-width="200rpx" prop="workOrderId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openWorkOrderSelector">
              <text :class="selectedWorkOrderText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedWorkOrderText || '请选择生产工单' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="产品物料" title-width="200rpx">
            <view class="text-28rpx text-[#333]">
              {{ selectedProductText || '-' }}
            </view>
          </wd-form-item>
          <wd-form-item title="规格型号" title-width="200rpx">
            <view class="text-28rpx text-[#333]">
              {{ formData.specification || '-' }}
            </view>
          </wd-form-item>
          <wd-form-item title="计量单位" title-width="200rpx">
            <view class="text-28rpx text-[#333]">
              {{ formData.unitMeasureName || '-' }}
            </view>
          </wd-form-item>
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_PRODUCT_RECPT_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :disabled="isHeaderReadonly"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <ProductReceiptLineList
        v-if="currentId"
        :receipt-id="currentId"
        :readonly="!isEditable"
        :stock-mode="isStock"
      />

      <view v-if="isStock" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        请核对入库物料和入库明细数量后再执行上架；当前只验证确认框，不确认真实上架。
      </view>
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        执行入库将更新库存台账，H5 验证时只打开确认框并取消，不写入真实库存。
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions content-class="flex gap-24rpx text-28rpx">
      <view
        v-if="isEditable"
        class="flex-1 rounded-8rpx bg-[#1677ff] py-20rpx text-center text-white"
        :class="formLoading ? 'opacity-60' : ''"
        @click="handleSubmit"
      >
        {{ formLoading ? '保存中...' : '保存' }}
      </view>
      <view
        v-if="canSubmit"
        class="flex-1 rounded-8rpx bg-[#faad14] py-20rpx text-center text-white"
        :class="submitLoading ? 'opacity-60' : ''"
        @click="handleSubmitReceipt"
      >
        {{ submitLoading ? '提交中...' : '提交' }}
      </view>
      <view
        v-if="isStock"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="stockLoading ? 'opacity-60' : ''"
        @click="handleStockReceipt"
      >
        {{ stockLoading ? '上架中...' : '执行上架' }}
      </view>
      <view
        v-if="isFinish"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="finishLoading ? 'opacity-60' : ''"
        @click="handleFinishReceipt"
      >
        {{ finishLoading ? '入库中...' : '执行入库' }}
      </view>
    </MesFooterActions>

    <WorkOrderSelector ref="workOrderSelectorRef" @confirm="handleWorkOrderConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import type { WmProductReceiptCreateReqVO } from '@/api/mes/wm/productreceipt'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  checkProductReceiptQuantity,
  createProductReceipt,
  finishProductReceipt,
  getProductReceipt,
  stockProductReceipt,
  submitProductReceipt,
  updateProductReceipt,
} from '@/api/mes/wm/productreceipt'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmProductReceiptStatusEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ProductReceiptLineList from '../components/product-receipt-line-list.vue'
import WorkOrderSelector from '../../../pro/card/components/workorder-selector.vue'

interface WmProductReceiptFormData extends WmProductReceiptCreateReqVO {
  id?: number
  status?: number
  workOrderCode?: string
  itemId?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
}

const props = defineProps<{
  id?: number | string
  mode?: 'stock' | 'finish' | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/wm/productreceipt/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const routeMode = computed(() => String(getRouteQueryValue('mode') || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'stock') {
    return '执行上架'
  }
  if (currentMode.value === 'finish') {
    return '执行入库'
  }
  return currentId.value ? '编辑产品入库' : '新增产品入库'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const stockLoading = ref(false) // 上架状态
const finishLoading = ref(false) // 入库状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmProductReceiptFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '入库单编号不能为空' }],
  name: [{ required: true, message: '入库单名称不能为空' }],
  receiptDate: [{ required: true, message: '入库日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const workOrderSelectorRef = ref<InstanceType<typeof WorkOrderSelector>>() // 工单选择器引用
const selectedWorkOrder = ref<ProWorkOrderVO>() // 当前选择工单
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isEditable = computed(() => !currentMode.value || currentMode.value === 'update')
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmProductReceiptStatusEnum.APPROVING)
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmProductReceiptStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => isStock.value || isFinish.value)
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmProductReceiptStatusEnum.PREPARE
))
const selectedWorkOrderText = computed(() => {
  if (selectedWorkOrder.value) {
    return `${selectedWorkOrder.value.code || '-'} ${selectedWorkOrder.value.name || ''}`.trim()
  }
  return formData.value.workOrderCode || ''
})
const selectedProductText = computed(() => {
  if (formData.value.itemCode || formData.value.itemName) {
    return `${formData.value.itemCode || '-'} / ${formData.value.itemName || '-'}`.trim()
  }
  return formData.value.itemId ? `物料 #${formData.value.itemId}` : ''
})

/** 默认表单数据 */
function getDefaultFormData(): WmProductReceiptFormData {
  return {
    code: '',
    name: '',
    workOrderId: undefined,
    workOrderCode: '',
    itemId: undefined,
    itemCode: '',
    itemName: '',
    specification: '',
    unitMeasureName: '',
    receiptDate: '',
    status: undefined,
    remark: '',
  }
}

/** 刷新当前路由参数 */
function refreshRouteState() {
  currentId.value = routeId.value
  currentMode.value = routeMode.value
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/productreceipt/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getProductReceipt(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name || '',
    workOrderId: data.workOrderId,
    workOrderCode: data.workOrderCode || '',
    itemId: data.itemId,
    itemCode: data.itemCode || '',
    itemName: data.itemName || '',
    specification: data.specification || '',
    unitMeasureName: data.unitMeasureName || '',
    receiptDate: data.receiptDate,
    status: data.status,
    remark: data.remark || '',
  }
  selectedWorkOrder.value = data.workOrderId
    ? {
        id: data.workOrderId,
        code: data.workOrderCode || '',
        name: '',
        type: 0,
        orderSourceType: 0,
        productId: data.itemId || 0,
        productCode: data.itemCode || '',
        productName: data.itemName || '',
        productSpecification: data.specification || '',
        unitMeasureName: data.unitMeasureName || '',
        quantity: 0,
        requestDate: '',
        status: 0,
      }
    : undefined
}

/** 初始化页面数据 */
async function initPage() {
  const oldId = currentId.value
  refreshRouteState()
  if (!currentId.value) {
    formData.value = getDefaultFormData()
    selectedWorkOrder.value = undefined
    return
  }
  if (oldId !== currentId.value || !formData.value.id) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开入库日期选择 */
function openReceiptDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.receiptDate = true
}

/** 打开工单选择器 */
function openWorkOrderSelector() {
  if (isHeaderReadonly.value) {
    return
  }
  workOrderSelectorRef.value?.open(formData.value.workOrderId)
}

/** 确认选择工单 */
function handleWorkOrderConfirm(workOrder: ProWorkOrderVO) {
  selectedWorkOrder.value = workOrder
  formData.value.workOrderId = workOrder.id
  formData.value.workOrderCode = workOrder.code
  formData.value.itemId = workOrder.productId
  formData.value.itemCode = workOrder.productCode || ''
  formData.value.itemName = workOrder.productName || ''
  formData.value.specification = workOrder.productSpecification || ''
  formData.value.unitMeasureName = workOrder.unitMeasureName || ''
}

/** 生成入库单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.PRODUCTRECPT_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData() {
  const data: WmProductReceiptCreateReqVO = {
    code: formData.value.code,
    name: formData.value.name,
    workOrderId: formData.value.workOrderId,
    receiptDate: formData.value.receiptDate,
    remark: formData.value.remark || undefined,
  }
  return data
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
    if (currentId.value) {
      await updateProductReceipt({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      const id = await createProductReceipt(data)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmProductReceiptStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:productreceipt:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交产品入库单 */
async function handleSubmitReceipt() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该产品入库单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateProductReceipt({ ...buildSubmitData(), id: currentId.value })
    await submitProductReceipt(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:productreceipt:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 执行上架 */
async function handleStockReceipt() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行上架？',
    })
  } catch {
    return
  }
  stockLoading.value = true
  try {
    const quantityMatch = await checkProductReceiptQuantity(currentId.value)
    if (!quantityMatch) {
      await dialog.confirm({
        title: '提示',
        msg: '明细数量与行收货数量不一致，确认执行上架？',
      })
    }
    await stockProductReceipt(currentId.value)
    toast.success('上架成功')
    uni.$emit('mes:wm:productreceipt:reload')
    delay(handleBack)
  } finally {
    stockLoading.value = false
  }
}

/** 执行入库 */
async function handleFinishReceipt() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行入库？执行后将更新库存台账。',
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishProductReceipt(currentId.value)
    toast.success('入库成功')
    uni.$emit('mes:wm:productreceipt:reload')
    delay(handleBack)
  } finally {
    finishLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})

onShow(() => {
  initPage()
})

watch([routeId, routeMode], () => {
  initPage()
})
</script>
