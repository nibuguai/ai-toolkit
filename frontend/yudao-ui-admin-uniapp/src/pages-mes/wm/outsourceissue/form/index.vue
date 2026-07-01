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
          <wd-form-item title="发料单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入发料单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="发料单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入发料单名称" />
          </wd-form-item>
          <wd-form-item title="发料日期" title-width="200rpx" prop="issueDate">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openIssueDatePicker">
              <text :class="formatDateTime(formData.issueDate) ? 'text-[#333]' : 'text-[#999]'">
                {{ formatDateTime(formData.issueDate) || '请选择发料日期' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.issueDate"
            v-model:visible="pickerVisible.issueDate"
            title="请选择发料日期"
            type="datetime"
          />
          <wd-form-item title="外协工单" title-width="200rpx" prop="workOrderId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openWorkOrderSelector">
              <text :class="selectedWorkOrderText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedWorkOrderText || '请选择外协工单' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="供应商" title-width="200rpx" prop="vendorId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openVendorSelector">
              <text :class="selectedVendorText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedVendorText || '请选择供应商' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_OUTSOURCE_ISSUE_STATUS" :value="formData.status" />
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

      <OutsourceIssueLineList
        v-if="currentId"
        ref="lineListRef"
        :issue-id="currentId"
        :readonly="isHeaderReadonly"
        :stock-mode="isStock"
      />
      <view v-if="isStock" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        请核对发料物料和拣货明细数量后再执行拣货；当前只验证确认框，不确认真实拣货。
      </view>
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        执行领出将扣减库存并生成库存记录，H5 验证时只打开确认框并取消。
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
        @click="handleSubmitIssue"
      >
        {{ submitLoading ? '提交中...' : '提交' }}
      </view>
      <view
        v-if="isStock"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="stockLoading ? 'opacity-60' : ''"
        @click="handleStockIssue"
      >
        {{ stockLoading ? '拣货中...' : '执行拣货' }}
      </view>
      <view
        v-if="isFinish"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="finishLoading ? 'opacity-60' : ''"
        @click="handleFinishIssue"
      >
        {{ finishLoading ? '领出中...' : '执行领出' }}
      </view>
    </MesFooterActions>

    <WorkOrderSelector
      ref="workOrderSelectorRef"
      title="选择外协工单"
      empty-tip="暂无已确认外协工单"
      :type="MesProWorkOrderTypeEnum.OUTSOURCE"
      @confirm="handleWorkOrderConfirm"
    />
    <VendorSelector ref="vendorSelectorRef" title="选择供应商" @confirm="handleVendorConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdVendorVO } from '@/api/mes/md/vendor'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import type { WmOutsourceIssueCreateReqVO } from '@/api/mes/wm/outsourceissue'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  checkOutsourceIssueQuantity,
  createOutsourceIssue,
  finishOutsourceIssue,
  getOutsourceIssue,
  stockOutsourceIssue,
  submitOutsourceIssue,
  updateOutsourceIssue,
} from '@/api/mes/wm/outsourceissue'
import { delay, navigateBackPlus } from '@/utils'
import {
  DICT_TYPE,
  MesAutoCodeRuleCode,
  MesProWorkOrderTypeEnum,
  MesWmOutsourceIssueStatusEnum,
} from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import OutsourceIssueLineList from '../components/outsource-issue-line-list.vue'
import VendorSelector from '../../../md/vendor/components/vendor-selector.vue'
import WorkOrderSelector from '../../../pro/card/components/workorder-selector.vue'

interface WmOutsourceIssueFormData extends Omit<WmOutsourceIssueCreateReqVO, 'workOrderId'> {
  id?: number
  workOrderId?: number
  workOrderCode?: string
  workOrderName?: string
  vendorCode?: string
  vendorName?: string
  status?: number
  createTime?: string
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
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/wm/outsourceissue/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const routeMode = computed(() => String(getRouteQueryValue('mode') || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'stock') {
    return '执行拣货'
  }
  if (currentMode.value === 'finish') {
    return '执行外协领出'
  }
  return currentId.value ? '编辑外协发料' : '新增外协发料'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const stockLoading = ref(false) // 拣货状态
const finishLoading = ref(false) // 领出状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmOutsourceIssueFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '发料单编号不能为空' }],
  name: [{ required: true, message: '发料单名称不能为空' }],
  workOrderId: [{ required: true, message: '外协工单不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const lineListRef = ref<InstanceType<typeof OutsourceIssueLineList>>() // 发料物料列表引用
const workOrderSelectorRef = ref<InstanceType<typeof WorkOrderSelector>>() // 工单选择器引用
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器引用
const selectedWorkOrder = ref<ProWorkOrderVO>() // 当前选择工单
const selectedVendor = ref<MdVendorVO>() // 当前选择供应商
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isEditable = computed(() => !currentMode.value || currentMode.value === 'update')
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmOutsourceIssueStatusEnum.APPROVING)
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmOutsourceIssueStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => isStock.value || isFinish.value)
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmOutsourceIssueStatusEnum.PREPARE
))
const selectedWorkOrderText = computed(() => {
  if (selectedWorkOrder.value) {
    return `${selectedWorkOrder.value.code || '-'} ${selectedWorkOrder.value.name || ''}`.trim()
  }
  if (formData.value.workOrderCode || formData.value.workOrderName) {
    return `${formData.value.workOrderCode || '-'} ${formData.value.workOrderName || ''}`.trim()
  }
  return ''
})
const selectedVendorText = computed(() => {
  if (selectedVendor.value) {
    return `${selectedVendor.value.code || '-'} ${selectedVendor.value.name || ''}`.trim()
  }
  if (formData.value.vendorCode || formData.value.vendorName) {
    return `${formData.value.vendorCode || '-'} ${formData.value.vendorName || ''}`.trim()
  }
  return ''
})

/** 默认表单数据 */
function getDefaultFormData(): WmOutsourceIssueFormData {
  return {
    code: '',
    name: '',
    vendorId: undefined,
    vendorCode: '',
    vendorName: '',
    workOrderId: undefined,
    workOrderCode: '',
    workOrderName: '',
    issueDate: '',
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
  navigateBackPlus('/pages-mes/wm/outsourceissue/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getOutsourceIssue(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name || '',
    vendorId: data.vendorId,
    vendorCode: data.vendorCode || '',
    vendorName: data.vendorName || '',
    workOrderId: data.workOrderId,
    workOrderCode: data.workOrderCode || '',
    workOrderName: data.workOrderName || '',
    issueDate: data.issueDate || '',
    status: data.status,
    remark: data.remark || '',
    createTime: data.createTime,
  }
  selectedWorkOrder.value = data.workOrderId
    ? {
        id: data.workOrderId,
        code: data.workOrderCode || '',
        name: data.workOrderName || '',
        type: MesProWorkOrderTypeEnum.OUTSOURCE,
        orderSourceType: 0,
        productId: 0,
        productCode: '',
        productName: '',
        productSpecification: '',
        unitMeasureName: '',
        quantity: 0,
        requestDate: '',
        status: 0,
      }
    : undefined
  selectedVendor.value = data.vendorId
    ? {
        id: data.vendorId,
        code: data.vendorCode || '',
        name: data.vendorName || '',
        nickname: null,
        englishName: null,
        description: null,
        logo: null,
        level: null,
        score: null,
        address: null,
        website: null,
        email: null,
        telephone: null,
        contact1Name: null,
        contact1Telephone: null,
        contact1Email: null,
        contact2Name: null,
        contact2Telephone: null,
        contact2Email: null,
        creditCode: null,
        status: 0,
        remark: null,
        createTime: '',
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
    selectedVendor.value = undefined
    return
  }
  if (oldId !== currentId.value || !formData.value.id) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开发料日期选择 */
function openIssueDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.issueDate = true
}

/** 打开工单选择器 */
function openWorkOrderSelector() {
  if (isHeaderReadonly.value) {
    return
  }
  workOrderSelectorRef.value?.open(formData.value.workOrderId)
}

/** 打开供应商选择器 */
function openVendorSelector() {
  if (isHeaderReadonly.value) {
    return
  }
  vendorSelectorRef.value?.open()
}

/** 确认选择工单 */
function handleWorkOrderConfirm(workOrder: ProWorkOrderVO) {
  selectedWorkOrder.value = workOrder
  formData.value.workOrderId = workOrder.id
  formData.value.workOrderCode = workOrder.code
  formData.value.workOrderName = workOrder.name
  formData.value.vendorId = workOrder.vendorId
  formData.value.vendorCode = workOrder.vendorCode || ''
  formData.value.vendorName = workOrder.vendorName || ''
  selectedVendor.value = workOrder.vendorId
    ? {
        id: workOrder.vendorId,
        code: workOrder.vendorCode || '',
        name: workOrder.vendorName || '',
        nickname: null,
        englishName: null,
        description: null,
        logo: null,
        level: null,
        score: null,
        address: null,
        website: null,
        email: null,
        telephone: null,
        contact1Name: null,
        contact1Telephone: null,
        contact1Email: null,
        contact2Name: null,
        contact2Telephone: null,
        contact2Email: null,
        creditCode: null,
        status: 0,
        remark: null,
        createTime: '',
      }
    : undefined
}

/** 确认供应商 */
function handleVendorConfirm(vendors: MdVendorVO[]) {
  const vendor = vendors[0]
  selectedVendor.value = vendor
  formData.value.vendorId = vendor?.id
  formData.value.vendorCode = vendor?.code || ''
  formData.value.vendorName = vendor?.name || ''
}

/** 生成发料单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_OUTSOURCE_ISSUE_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData() {
  if (!formData.value.workOrderId) {
    throw new Error('外协工单不能为空')
  }
  const data: WmOutsourceIssueCreateReqVO = {
    code: formData.value.code,
    name: formData.value.name,
    vendorId: formData.value.vendorId,
    workOrderId: formData.value.workOrderId,
    issueDate: formData.value.issueDate || undefined,
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
      await updateOutsourceIssue({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      const id = await createOutsourceIssue(data)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmOutsourceIssueStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:outsourceissue:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交外协发料单 */
async function handleSubmitIssue() {
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
      msg: '确认提交该外协发料单？提交前请确认已维护发料物料，提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateOutsourceIssue({ ...buildSubmitData(), id: currentId.value })
    await submitOutsourceIssue(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:outsourceissue:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 执行拣货 */
async function handleStockIssue() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行拣货？',
    })
  } catch {
    return
  }
  stockLoading.value = true
  try {
    const quantityMatch = await checkOutsourceIssueQuantity(currentId.value)
    if (!quantityMatch) {
      await dialog.confirm({
        title: '提示',
        msg: '发料数量与拣货数量不一致，确认执行拣货？',
      })
    }
    await stockOutsourceIssue(currentId.value)
    toast.success('拣货成功')
    uni.$emit('mes:wm:outsourceissue:reload')
    delay(handleBack)
  } finally {
    stockLoading.value = false
  }
}

/** 执行外协领出 */
async function handleFinishIssue() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行领出？执行后将扣减库存，且无法撤销。',
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishOutsourceIssue(currentId.value)
    toast.success('领出成功')
    uni.$emit('mes:wm:outsourceissue:reload')
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
