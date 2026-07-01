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
          <wd-form-item title="报工单号" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable :disabled="headerReadonly">
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :disabled="headerReadonly" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="报工类型" title-width="220rpx" prop="type">
            <wd-radio-group v-model="formData.type" type="button" :disabled="headerReadonly">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_FEEDBACK_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="生产工单" title-width="220rpx" prop="workOrderId" is-link :value="selectedWorkOrderText" placeholder="请选择已确认工单" @click="openWorkOrderSelector" />
          <wd-form-item title="工作站" title-width="220rpx" prop="workstationId" is-link :value="selectedWorkstationText" placeholder="请选择工作站" @click="openWorkstationSelector" />
          <wd-form-item title="生产任务" title-width="220rpx" prop="taskId" is-link :value="selectedTaskText" :placeholder="taskPlaceholder" @click="openTaskSelector" />
          <wd-cell title="产品编码" :value="productInfo.itemCode || '-'" />
          <wd-cell title="产品名称" :value="productInfo.itemName || '-'" />
          <wd-cell title="规格/单位" :value="productSpecText" />
          <wd-cell v-if="formData.status != null" title="单据状态">
            <dict-tag :type="DICT_TYPE.MES_PRO_FEEDBACK_STATUS" :value="formData.status" />
          </wd-cell>
        </wd-cell-group>

        <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
          报工数量
        </view>
        <wd-cell-group border>
          <template v-if="checkFlag">
            <wd-form-item title="报工数量" title-width="220rpx" prop="feedbackQuantity" center>
              <wd-input-number v-model="formData.feedbackQuantity" :min="0" :precision="2" :disabled="quantityReadonly" />
            </wd-form-item>
            <wd-cell title="待检数量" :value="`${formData.feedbackQuantity || 0}`" />
          </template>
          <template v-else>
            <wd-form-item title="报工数量" title-width="220rpx" prop="feedbackQuantity" center>
              <wd-input-number v-model="formData.feedbackQuantity" :min="0" :precision="2" disabled />
            </wd-form-item>
            <wd-form-item title="合格品数量" title-width="220rpx" prop="qualifiedQuantity" center>
              <wd-input-number v-model="formData.qualifiedQuantity" :min="0" :precision="2" :disabled="quantityReadonly" @change="handleQuantityChanged" />
            </wd-form-item>
            <wd-form-item title="不良品数量" title-width="220rpx" prop="unqualifiedQuantity" center>
              <wd-input-number v-model="formData.unqualifiedQuantity" :min="0" :precision="2" :disabled="quantityReadonly" @change="handleQuantityChanged" />
            </wd-form-item>
            <template v-if="Number(formData.unqualifiedQuantity || 0) > 0">
              <wd-form-item title="工废数量" title-width="220rpx" prop="laborScrapQuantity" center>
                <wd-input-number v-model="formData.laborScrapQuantity" :min="0" :precision="2" :disabled="quantityReadonly" @change="handleScrapChanged" />
              </wd-form-item>
              <wd-form-item title="料废数量" title-width="220rpx" prop="materialScrapQuantity" center>
                <wd-input-number v-model="formData.materialScrapQuantity" :min="0" :precision="2" :disabled="quantityReadonly" @change="handleScrapChanged" />
              </wd-form-item>
              <wd-form-item title="其他废品" title-width="220rpx" prop="otherScrapQuantity" center>
                <wd-input-number v-model="formData.otherScrapQuantity" :min="0" :precision="2" :disabled="quantityReadonly" @change="handleScrapChanged" />
              </wd-form-item>
            </template>
          </template>
        </wd-cell-group>

        <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
          人员与备注
        </view>
        <wd-cell-group border>
          <UserPicker v-model="formData.feedbackUserId" label="报工人" label-width="220rpx" prop="feedbackUserId" type="radio" placeholder="请选择报工人" :disabled="headerReadonly" />
          <wd-datetime-picker v-model="formData.feedbackTime" type="datetime" label="报工时间" label-width="220rpx" prop="feedbackTime" :disabled="headerReadonly" />
          <UserPicker v-model="formData.approveUserId" label="审核人" label-width="220rpx" prop="approveUserId" type="radio" placeholder="请选择审核人" :disabled="headerReadonly" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable :disabled="detailReadonly" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <ItemConsumeList v-if="showTraceLists" :feedback-id="formData.id" />
      <ProductProduceList v-if="showTraceLists" :feedback-id="formData.id" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions content-class="flex gap-16rpx">
      <wd-button v-if="isEditable" class="flex-1" type="primary" :loading="formLoading" @click="handleSave">
        保存
      </wd-button>
      <wd-button v-if="canSubmit" class="flex-1" type="warning" :loading="formLoading" @click="handleSubmitFeedback">
        提交
      </wd-button>
      <wd-button v-if="isApproveMode" class="flex-1" type="success" :loading="formLoading" @click="handleApprove">
        通过
      </wd-button>
      <wd-button v-if="isApproveMode" class="flex-1" type="danger" :loading="formLoading" @click="handleReject">
        不通过
      </wd-button>
    </MesFooterActions>

    <WorkOrderSelector ref="workOrderSelectorRef" @confirm="handleWorkOrderConfirm" />
    <WorkstationSelector ref="workstationSelectorRef" @confirm="handleWorkstationConfirm" />
    <TaskSelector
      ref="taskSelectorRef"
      :work-order-id="formData.workOrderId"
      :workstation-id="formData.workstationId"
      :statuses="[MesProTaskStatusEnum.PREPARE]"
      @confirm="handleTaskConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdWorkstationVO } from '@/api/mes/md/workstation'
import type { ProFeedbackSaveReqVO, ProFeedbackVO } from '@/api/mes/pro/feedback'
import type { ProTaskVO } from '@/api/mes/pro/task'
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { approveFeedback, createFeedback, getFeedback, rejectFeedback, submitFeedback, updateFeedback } from '@/api/mes/pro/feedback'
import { getRouteProcessByRouteAndProcess } from '@/api/mes/pro/route/process'
import { getTask } from '@/api/mes/pro/task'
import { getWorkOrder } from '@/api/mes/pro/workorder'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { useUserStore } from '@/store/user'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import ItemConsumeList from '../components/item-consume-list.vue'
import ProductProduceList from '../components/product-produce-list.vue'
import TaskSelector from '../components/task-selector.vue'
import WorkOrderSelector from '../../card/components/workorder-selector.vue'
import WorkstationSelector from '../../task/components/workstation-selector.vue'

type FormMode = 'approve' | 'create' | 'detail' | 'submit' | 'update'

interface FeedbackFormData {
  id?: number
  code?: string
  type?: number
  feedbackTime?: number | string
  workstationId?: number
  routeId?: number
  processId?: number
  workOrderId?: number
  taskId?: number
  itemId?: number
  expireDate?: number | string
  feedbackQuantity: number
  qualifiedQuantity: number
  unqualifiedQuantity: number
  uncheckQuantity: number
  laborScrapQuantity: number
  materialScrapQuantity: number
  otherScrapQuantity: number
  feedbackUserId?: number
  approveUserId?: number
  status?: number
  remark?: string
}

interface ProductInfo {
  itemCode: string
  itemName: string
  unitMeasureName: string
  itemSpecification: string
}

const props = withDefaults(defineProps<{
  id?: number | string
  mode?: FormMode
}>(), {
  id: undefined,
  mode: 'create',
})

const MesAutoCodeRuleCode = {
  PRO_FEEDBACK_CODE: 'PRO_FEEDBACK_CODE',
} as const
const MesProFeedbackStatusEnum = {
  PREPARE: 0,
  APPROVING: 2,
  UNCHECK: 3,
  FINISHED: 4,
  CANCELED: 5,
} as const
const MesProTaskStatusEnum = {
  PREPARE: 0,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const userStore = useUserStore()
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/pro/feedback/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const routeMode = computed(() => (getRouteQueryValue('mode') as FormMode) || 'create')
const formMode = ref<FormMode>(routeMode.value)
const workOrderSelectorRef = ref<InstanceType<typeof WorkOrderSelector>>() // 工单选择器引用
const workstationSelectorRef = ref<InstanceType<typeof WorkstationSelector>>() // 工作站选择器引用
const taskSelectorRef = ref<InstanceType<typeof TaskSelector>>() // 任务选择器引用
const selectedWorkOrder = ref<ProWorkOrderVO>() // 当前工单
const selectedTask = ref<ProTaskVO>() // 当前任务
const selectedWorkstation = ref<MdWorkstationVO>() // 当前工作站
const checkFlag = ref(true) // 是否需要质检
const originalFormSnapshot = ref('') // 原始表单快照
const productInfo = ref<ProductInfo>(getDefaultProductInfo())
const formData = ref<FeedbackFormData>(getDefaultFormData())
const formSchema = createFormSchema({
  code: [{ required: true, message: '报工单号不能为空' }],
  type: [{ required: true, message: '报工类型不能为空' }],
  workOrderId: [{ required: true, message: '生产工单不能为空' }],
  taskId: [{ required: true, message: '生产任务不能为空' }],
  workstationId: [{ required: true, message: '工作站不能为空' }],
  feedbackQuantity: [
    { required: true, message: '报工数量不能为空' },
    {
      validator: () => {
        if (Number(formData.value.feedbackQuantity || 0) > 0) {
          return true
        }
        return '报工数量必须大于 0'
      },
    },
  ],
  feedbackUserId: [{ required: true, message: '报工人不能为空' }],
  feedbackTime: [{ required: true, message: '报工时间不能为空' }],
  approveUserId: [{ required: true, message: '审核人不能为空' }],
})
const getTitle = computed(() => {
  const titles: Record<FormMode, string> = {
    create: '新增生产报工',
    update: '编辑生产报工',
    submit: '提交生产报工',
    approve: '审批生产报工',
    detail: '生产报工详情',
  }
  return titles[formMode.value]
})
const isEditable = computed(() =>
  formMode.value === 'create'
  || (['submit', 'update'].includes(formMode.value) && formData.value.status === MesProFeedbackStatusEnum.PREPARE),
)
const isApproveMode = computed(() => formMode.value === 'approve')
const detailReadonly = computed(() => !isEditable.value)
const headerReadonly = computed(() => !isEditable.value || formMode.value === 'submit')
const quantityReadonly = computed(() => !isEditable.value)
const canSubmit = computed(() => isEditable.value && formData.value.status === MesProFeedbackStatusEnum.PREPARE)
const showTraceLists = computed(() =>
  !!formData.value.id
  && formData.value.status !== MesProFeedbackStatusEnum.PREPARE
  && formData.value.status !== MesProFeedbackStatusEnum.APPROVING,
)
const selectedWorkOrderText = computed(() => {
  if (!selectedWorkOrder.value) {
    return formData.value.workOrderId ? `工单 #${formData.value.workOrderId}` : ''
  }
  return `${selectedWorkOrder.value.code || '-'} / ${selectedWorkOrder.value.name || '-'}`
})
const selectedWorkstationText = computed(() => {
  if (selectedWorkstation.value) {
    return `${selectedWorkstation.value.code || '-'} / ${selectedWorkstation.value.name || '-'}`
  }
  return selectedTask.value?.workstationName || ''
})
const selectedTaskText = computed(() => {
  if (!selectedTask.value) {
    return formData.value.taskId ? `任务 #${formData.value.taskId}` : ''
  }
  return `${selectedTask.value.code || '-'} / ${selectedTask.value.processName || '-'}`
})
const taskPlaceholder = computed(() => formData.value.workOrderId ? '请选择生产任务' : '请先选择生产工单')
const productSpecText = computed(() => `${productInfo.value.itemSpecification || '-'} / ${productInfo.value.unitMeasureName || '-'}`)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/feedback/index')
}

/** 默认产品信息 */
function getDefaultProductInfo(): ProductInfo {
  return {
    itemCode: '',
    itemName: '',
    unitMeasureName: '',
    itemSpecification: '',
  }
}

/** 默认表单数据 */
function getDefaultFormData(): FeedbackFormData {
  return {
    code: undefined,
    type: undefined,
    feedbackTime: undefined,
    workstationId: undefined,
    routeId: undefined,
    processId: undefined,
    workOrderId: undefined,
    taskId: undefined,
    itemId: undefined,
    expireDate: undefined,
    feedbackQuantity: 0,
    qualifiedQuantity: 0,
    unqualifiedQuantity: 0,
    uncheckQuantity: 0,
    laborScrapQuantity: 0,
    materialScrapQuantity: 0,
    otherScrapQuantity: 0,
    feedbackUserId: undefined,
    approveUserId: undefined,
    status: undefined,
    remark: '',
  }
}

/** 重置表单上下文 */
function resetFormContext() {
  formData.value = getDefaultFormData()
  selectedWorkOrder.value = undefined
  selectedTask.value = undefined
  selectedWorkstation.value = undefined
  checkFlag.value = true
  productInfo.value = getDefaultProductInfo()
  originalFormSnapshot.value = ''
}

/** 打开工单选择器 */
function openWorkOrderSelector() {
  if (headerReadonly.value) {
    return
  }
  workOrderSelectorRef.value?.open(formData.value.workOrderId)
}

/** 打开工作站选择器 */
function openWorkstationSelector() {
  if (headerReadonly.value) {
    return
  }
  workstationSelectorRef.value?.open(formData.value.workstationId)
}

/** 打开任务选择器 */
function openTaskSelector() {
  if (headerReadonly.value || !formData.value.workOrderId) {
    return
  }
  taskSelectorRef.value?.open(formData.value.taskId)
}

/** 生成报工单号 */
async function handleGenerateCode() {
  if (headerReadonly.value) {
    return
  }
  formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.PRO_FEEDBACK_CODE)
}

/** 工单变更：清空任务和产品关联 */
function handleWorkOrderConfirm(item: ProWorkOrderVO) {
  selectedWorkOrder.value = item
  formData.value.workOrderId = item.id
  formData.value.taskId = undefined
  formData.value.routeId = undefined
  formData.value.processId = undefined
  formData.value.workstationId = undefined
  formData.value.itemId = undefined
  selectedTask.value = undefined
  selectedWorkstation.value = undefined
  checkFlag.value = true
  productInfo.value = { itemCode: '', itemName: '', unitMeasureName: '', itemSpecification: '' }
}

/** 工作站变更：清空任务，重新按工作站筛选 */
function handleWorkstationConfirm(item: MdWorkstationVO) {
  selectedWorkstation.value = item
  formData.value.workstationId = item.id
  formData.value.taskId = undefined
  selectedTask.value = undefined
}

/** 任务变更：自动填充关联字段 */
async function handleTaskConfirm(task: ProTaskVO) {
  selectedTask.value = task
  formData.value.taskId = task.id
  formData.value.routeId = task.routeId
  formData.value.processId = task.processId
  formData.value.workstationId = task.workstationId
  formData.value.itemId = task.itemId
  productInfo.value = {
    itemCode: task.itemCode || '',
    itemName: task.itemName || '',
    unitMeasureName: task.unitMeasureName || '',
    itemSpecification: task.itemSpecification || '',
  }
  await loadCheckFlag(task.routeId, task.processId)
}

/** 加载工序质检标识 */
async function loadCheckFlag(routeId?: number, processId?: number) {
  if (!routeId || !processId) {
    checkFlag.value = true
    return
  }
  try {
    const routeProcess = await getRouteProcessByRouteAndProcess(routeId, processId)
    checkFlag.value = routeProcess?.checkFlag ?? false
  } catch {
    checkFlag.value = true
  }
}

/** 合格/不良变更 */
function handleQuantityChanged() {
  formData.value.feedbackQuantity = Number(formData.value.qualifiedQuantity || 0) + Number(formData.value.unqualifiedQuantity || 0)
}

/** 废品明细变更 */
function handleScrapChanged() {
  formData.value.unqualifiedQuantity = Number(formData.value.laborScrapQuantity || 0)
    + Number(formData.value.materialScrapQuantity || 0)
    + Number(formData.value.otherScrapQuantity || 0)
  handleQuantityChanged()
}

/** 对齐数量字段 */
function alignQuantity(data: ProFeedbackSaveReqVO) {
  if (checkFlag.value) {
    data.uncheckQuantity = data.feedbackQuantity
    data.qualifiedQuantity = 0
    data.unqualifiedQuantity = 0
    data.laborScrapQuantity = 0
    data.materialScrapQuantity = 0
    data.otherScrapQuantity = 0
  } else {
    data.feedbackQuantity = Number(data.qualifiedQuantity || 0) + Number(data.unqualifiedQuantity || 0)
    data.uncheckQuantity = 0
  }
}

/** 设置表单数据 */
function setFormData(data: ProFeedbackVO) {
  formData.value = {
    id: data.id,
    code: data.code,
    type: data.type,
    feedbackTime: data.feedbackTime,
    workstationId: data.workstationId,
    routeId: data.routeId,
    processId: data.processId,
    workOrderId: data.workOrderId,
    taskId: data.taskId,
    itemId: data.itemId,
    expireDate: data.expireDate,
    feedbackQuantity: data.feedbackQuantity || 0,
    qualifiedQuantity: data.qualifiedQuantity || 0,
    unqualifiedQuantity: data.unqualifiedQuantity || 0,
    uncheckQuantity: data.uncheckQuantity || 0,
    laborScrapQuantity: data.laborScrapQuantity || 0,
    materialScrapQuantity: data.materialScrapQuantity || 0,
    otherScrapQuantity: data.otherScrapQuantity || 0,
    feedbackUserId: data.feedbackUserId,
    approveUserId: data.approveUserId,
    status: data.status,
    remark: data.remark || '',
  }
  productInfo.value = {
    itemCode: data.itemCode || '',
    itemName: data.itemName || '',
    unitMeasureName: data.unitMeasureName || '',
    itemSpecification: data.itemSpecification || '',
  }
}

/** 构造保存参数 */
function buildSubmitData(): ProFeedbackSaveReqVO {
  const data: ProFeedbackSaveReqVO = {
    id: formData.value.id,
    code: formData.value.code,
    type: formData.value.type,
    feedbackTime: formData.value.feedbackTime,
    workstationId: formData.value.workstationId,
    routeId: formData.value.routeId,
    processId: formData.value.processId,
    workOrderId: formData.value.workOrderId,
    taskId: formData.value.taskId,
    itemId: formData.value.itemId,
    expireDate: formData.value.expireDate,
    feedbackQuantity: formData.value.feedbackQuantity,
    qualifiedQuantity: formData.value.qualifiedQuantity,
    unqualifiedQuantity: formData.value.unqualifiedQuantity,
    uncheckQuantity: formData.value.uncheckQuantity,
    laborScrapQuantity: formData.value.laborScrapQuantity,
    materialScrapQuantity: formData.value.materialScrapQuantity,
    otherScrapQuantity: formData.value.otherScrapQuantity,
    feedbackUserId: formData.value.feedbackUserId,
    approveUserId: formData.value.approveUserId,
    status: formData.value.status,
    remark: formData.value.remark,
  }
  alignQuantity(data)
  return data
}

/** 保存 */
async function handleSave() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (formData.value.id) {
      await updateFeedback(data)
      toast.success('修改成功')
      setFormData(await getFeedback(formData.value.id))
    } else {
      const id = await createFeedback(data)
      toast.success('新增成功')
      setFormData(await getFeedback(id))
      formMode.value = 'update'
    }
    originalFormSnapshot.value = JSON.stringify(formData.value)
    uni.$emit('mes:pro:feedback:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交报工 */
async function handleSubmitFeedback() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  try {
    await dialog.confirm({ title: '提交报工单', msg: '确认提交该报工单？提交后将不能修改。' })
  } catch {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (!formData.value.id) {
      const id = await createFeedback(data)
      formData.value.id = id
    } else if (JSON.stringify(formData.value) !== originalFormSnapshot.value) {
      await updateFeedback(data)
    }
    if (formData.value.id) {
      await submitFeedback(formData.value.id)
    }
    toast.success('报工单已提交')
    uni.$emit('mes:pro:feedback:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 3 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 审批通过 */
async function handleApprove() {
  if (!formData.value.id) {
    return
  }
  try {
    await dialog.confirm({ title: '审批通过', msg: '确认通过该报工单？' })
  } catch {
    return
  }
  formLoading.value = true
  try {
    const finished = await approveFeedback(formData.value.id)
    toast.success(finished ? '报工单已审批完成' : '报工成功，请等待质量检验完成')
    uni.$emit('mes:pro:feedback:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 审批不通过 */
async function handleReject() {
  if (!formData.value.id) {
    return
  }
  try {
    await dialog.confirm({ title: '审批不通过', msg: '确认驳回该报工单？' })
  } catch {
    return
  }
  formLoading.value = true
  try {
    await rejectFeedback(formData.value.id)
    toast.success('报工单已驳回')
    uni.$emit('mes:pro:feedback:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 加载详情 */
async function loadDetail() {
  if (!currentId.value) {
    return
  }
  const detail = await getFeedback(currentId.value)
  setFormData(detail)
  await loadCheckFlag(detail.routeId, detail.processId)
  if (detail.workOrderId) {
    selectedWorkOrder.value = await getWorkOrder(detail.workOrderId)
  }
  if (detail.taskId) {
    selectedTask.value = await getTask(detail.taskId)
  }
  originalFormSnapshot.value = JSON.stringify(formData.value)
}

/** 初始化新增默认值 */
function initCreate() {
  resetFormContext()
  const userId = userStore.userInfo?.userId
  if (userId && userId !== -1) {
    formData.value.feedbackUserId = userId
  }
  formData.value.feedbackTime = Date.now()
  originalFormSnapshot.value = JSON.stringify(formData.value)
}

/** 加载页面数据 */
async function loadPageData() {
  formMode.value = routeMode.value
  if (currentId.value) {
    await loadDetail()
  } else {
    initCreate()
  }
}

onMounted(async () => {
  await loadPageData()
})

watch([currentId, routeMode], () => {
  loadPageData()
})
</script>
