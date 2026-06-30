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
          <wd-form-item title="退料单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入退料单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="退料单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入退料单名称" />
          </wd-form-item>
          <wd-form-item title="退料类型" title-width="200rpx" prop="type">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openTypePicker">
              <text :class="selectedTypeText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedTypeText || '请选择退料类型' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
            <wd-picker
              v-model:visible="pickerVisible.type"
              :model-value="typePickerValue"
              :columns="typeOptions"
              label-key="label"
              value-key="value"
              title="请选择退料类型"
              placeholder="请选择退料类型"
              :disabled="isHeaderReadonly"
              clearable
              @confirm="handleTypeConfirm"
            />
          </wd-form-item>
          <wd-form-item title="生产工单" title-width="200rpx" prop="workOrderId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openWorkOrderSelector">
              <text :class="selectedWorkOrderText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedWorkOrderText || '请选择生产工单' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="工作站" title-width="200rpx" prop="workstationId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openWorkstationSelector">
              <text :class="selectedWorkstationText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedWorkstationText || '请选择工作站' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="退料日期" title-width="200rpx" prop="returnDate">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openReturnDatePicker">
              <text :class="formatDateTime(formData.returnDate) ? 'text-[#333]' : 'text-[#999]'">
                {{ formatDateTime(formData.returnDate) || '请选择退料日期' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.returnDate"
            v-model:visible="pickerVisible.returnDate"
            title="请选择退料日期"
            type="datetime"
          />
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_RETURN_ISSUE_STATUS" :value="formData.status" />
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

      <ReturnIssueLineList
        v-if="currentId"
        :issue-id="currentId"
        :readonly="!isEditable"
        :stock-mode="isStock"
      />

      <view v-if="isStock" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        请核对退料物料和入库明细数量后再执行上架；当前只验证确认框，不确认真实上架。
      </view>
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        执行退料将完成退料业务流转，H5 验证时只打开确认框并取消。
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
        {{ stockLoading ? '上架中...' : '执行上架' }}
      </view>
      <view
        v-if="isFinish"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="finishLoading ? 'opacity-60' : ''"
        @click="handleFinishIssue"
      >
        {{ finishLoading ? '执行中...' : '执行退料' }}
      </view>
    </MesFooterActions>

    <WorkOrderSelector ref="workOrderSelectorRef" @confirm="handleWorkOrderConfirm" />
    <WorkstationSelector ref="workstationSelectorRef" @confirm="handleWorkstationConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdWorkstationVO } from '@/api/mes/md/workstation'
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import type { WmReturnIssueCreateReqVO } from '@/api/mes/wm/returnissue'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  createReturnIssue,
  finishReturnIssue,
  getReturnIssue,
  stockReturnIssue,
  submitReturnIssue,
  updateReturnIssue,
} from '@/api/mes/wm/returnissue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmReturnIssueStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import WorkOrderSelector from '../../../pro/card/components/workorder-selector.vue'
import WorkstationSelector from '../../../pro/task/components/workstation-selector.vue'
import ReturnIssueLineList from '../components/return-issue-line-list.vue'

interface WmReturnIssueFormData extends Omit<WmReturnIssueCreateReqVO, 'workOrderId' | 'type'> {
  id?: number
  workOrderId?: number
  type?: number
  status?: number
  workOrderCode?: string
  workstationCode?: string
  workstationName?: string
  createTime?: string
}

interface PickerConfirmPayload {
  value: Array<number | string>
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
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/wm/returnissue/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const routeMode = computed(() => String(getRouteQueryValue('mode') || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'stock') {
    return '执行入库上架'
  }
  if (currentMode.value === 'finish') {
    return '执行生产退料'
  }
  return currentId.value ? '编辑生产退料' : '新增生产退料'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const stockLoading = ref(false) // 上架状态
const finishLoading = ref(false) // 执行状态
const codeLoading = ref(false) // 编码生成状态
const typeOptions = getIntDictOptions(DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE) // 退料类型选项
const formData = ref<WmReturnIssueFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '退料单编号不能为空' }],
  name: [{ required: true, message: '退料单名称不能为空' }],
  type: [{ required: true, message: '退料类型不能为空' }],
  workOrderId: [{ required: true, message: '生产工单不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const workOrderSelectorRef = ref<InstanceType<typeof WorkOrderSelector>>() // 工单选择器引用
const workstationSelectorRef = ref<InstanceType<typeof WorkstationSelector>>() // 工作站选择器引用
const selectedWorkOrder = ref<ProWorkOrderVO>() // 当前选择工单
const selectedWorkstation = ref<MdWorkstationVO>() // 当前选择工作站
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isEditable = computed(() => !currentMode.value || currentMode.value === 'update')
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmReturnIssueStatusEnum.APPROVING)
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmReturnIssueStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => isStock.value || isFinish.value)
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmReturnIssueStatusEnum.PREPARE
))
const selectedWorkOrderText = computed(() => {
  if (selectedWorkOrder.value) {
    return `${selectedWorkOrder.value.code || '-'} ${selectedWorkOrder.value.name || ''}`.trim()
  }
  return formData.value.workOrderCode || ''
})
const selectedTypeText = computed(() => {
  if (formData.value.type == null) {
    return ''
  }
  return getDictLabel(DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE, formData.value.type)
})
const typePickerValue = computed(() => formData.value.type != null ? [formData.value.type] : [])
const selectedWorkstationText = computed(() => {
  if (selectedWorkstation.value) {
    return `${selectedWorkstation.value.code || '-'} ${selectedWorkstation.value.name || ''}`.trim()
  }
  if (formData.value.workstationCode || formData.value.workstationName) {
    return `${formData.value.workstationCode || '-'} ${formData.value.workstationName || ''}`.trim()
  }
  return ''
})

/** 默认表单数据 */
function getDefaultFormData(): WmReturnIssueFormData {
  return {
    code: '',
    name: '',
    workOrderId: undefined,
    workOrderCode: '',
    workstationId: undefined,
    workstationCode: '',
    workstationName: '',
    type: undefined,
    returnDate: '',
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
  navigateBackPlus('/pages-mes/wm/returnissue/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getReturnIssue(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name || '',
    workOrderId: data.workOrderId,
    workOrderCode: data.workOrderCode || '',
    workstationId: data.workstationId,
    workstationCode: data.workstationCode || '',
    workstationName: data.workstationName || '',
    type: data.type,
    returnDate: data.returnDate || '',
    status: data.status,
    remark: data.remark || '',
    createTime: data.createTime,
  }
  selectedWorkOrder.value = data.workOrderId
    ? {
        id: data.workOrderId,
        code: data.workOrderCode || '',
        name: '',
        type: 0,
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
  selectedWorkstation.value = data.workstationId
    ? {
        id: data.workstationId,
        code: data.workstationCode || '',
        name: data.workstationName || '',
        address: null,
        workshopId: 0,
        workshopName: null,
        processId: null,
        processName: null,
        warehouseId: null,
        locationId: null,
        areaId: null,
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
    selectedWorkstation.value = undefined
    return
  }
  if (oldId !== currentId.value || !formData.value.id) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开退料类型选择 */
function openTypePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.type = true
}

/** 确认退料类型 */
function handleTypeConfirm({ value }: PickerConfirmPayload) {
  const [type] = value
  formData.value.type = type == null ? undefined : Number(type)
  pickerVisible.value.type = false
}

/** 打开退料日期选择 */
function openReturnDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.returnDate = true
}

/** 打开工单选择器 */
function openWorkOrderSelector() {
  if (isHeaderReadonly.value) {
    return
  }
  workOrderSelectorRef.value?.open(formData.value.workOrderId)
}

/** 打开工作站选择器 */
function openWorkstationSelector() {
  if (isHeaderReadonly.value) {
    return
  }
  workstationSelectorRef.value?.open(formData.value.workstationId)
}

/** 确认选择工单 */
function handleWorkOrderConfirm(workOrder: ProWorkOrderVO) {
  selectedWorkOrder.value = workOrder
  formData.value.workOrderId = workOrder.id
  formData.value.workOrderCode = workOrder.code
}

/** 确认选择工作站 */
function handleWorkstationConfirm(workstation: MdWorkstationVO) {
  selectedWorkstation.value = workstation
  formData.value.workstationId = workstation.id
  formData.value.workstationCode = workstation.code
  formData.value.workstationName = workstation.name
}

/** 生成退料单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_RETURN_ISSUE_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData() {
  if (!formData.value.workOrderId || formData.value.type == null) {
    throw new Error('生产工单和退料类型不能为空')
  }
  const data: WmReturnIssueCreateReqVO = {
    code: formData.value.code,
    name: formData.value.name,
    workOrderId: formData.value.workOrderId,
    workstationId: formData.value.workstationId,
    type: formData.value.type,
    returnDate: formData.value.returnDate || undefined,
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
      await updateReturnIssue({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      const id = await createReturnIssue(data)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmReturnIssueStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:returnissue:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交生产退料单 */
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
      msg: '确认提交该退料单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateReturnIssue({ ...buildSubmitData(), id: currentId.value })
    await submitReturnIssue(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:returnissue:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 3 处 setTimeout(() => handleBack())）
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    submitLoading.value = false
  }
}

/** 执行入库上架 */
async function handleStockIssue() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行入库上架？',
    })
  } catch {
    return
  }
  stockLoading.value = true
  try {
    await stockReturnIssue(currentId.value)
    toast.success('上架成功')
    uni.$emit('mes:wm:returnissue:reload')
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    stockLoading.value = false
  }
}

/** 执行生产退料 */
async function handleFinishIssue() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认完成该退料单并执行退料吗？',
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishReturnIssue(currentId.value)
    toast.success('执行成功')
    uni.$emit('mes:wm:returnissue:reload')
    setTimeout(() => {
      handleBack()
    }, 500)
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
