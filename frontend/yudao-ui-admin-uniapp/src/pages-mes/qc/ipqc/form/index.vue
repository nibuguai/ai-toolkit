<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="检验单编号" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="检验单名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入检验单名称" clearable />
          </wd-form-item>
          <wd-form-item title="检验类型" title-width="220rpx" prop="type">
            <wd-radio-group v-model="formData.type" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_IPQC_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>

          <template v-if="isFromPendingTask">
            <wd-cell title="来源单据类型">
              <dict-tag v-if="formData.sourceDocType != null" :type="DICT_TYPE.MES_QC_SOURCE_DOC_TYPE" :value="formData.sourceDocType" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="来源单据编号" :value="formData.sourceDocCode || '-'" />
          </template>

          <wd-form-item title="生产工单" title-width="220rpx" prop="workOrderId">
            <view class="w-full py-8rpx text-28rpx" :class="isFromPendingTask ? 'text-[#999]' : 'text-[#333]'" @click="openWorkOrderSelector">
              {{ selectedWorkOrderText || (isFromPendingTask ? '由待检任务带入' : '请选择生产工单') }}
            </view>
          </wd-form-item>
          <wd-form-item title="工位" title-width="220rpx" prop="workstationId">
            <view class="w-full py-8rpx text-28rpx" :class="isFromPendingTask ? 'text-[#999]' : 'text-[#333]'" @click="openWorkstationSelector">
              {{ selectedWorkstationText || (isFromPendingTask ? '由待检任务带入' : '请选择工位') }}
            </view>
          </wd-form-item>
          <wd-form-item title="生产任务" title-width="220rpx" prop="taskId">
            <view class="w-full py-8rpx text-28rpx" :class="isFromPendingTask ? 'text-[#999]' : 'text-[#333]'" @click="openTaskSelector">
              {{ selectedTaskText || (isFromPendingTask ? '由待检任务带入' : '请选择生产任务') }}
            </view>
          </wd-form-item>
          <wd-cell title="工序" :value="formData.processName || '-'" />
          <wd-cell title="产品物料" :value="selectedItemText || '-'" />
          <wd-cell v-if="formData.itemSpecification || formData.unitName" title="规格单位" :value="`${formData.itemSpecification || '-'} / ${formData.unitName || '-'}`" />

          <wd-form-item title="检测数量" title-width="220rpx" prop="checkQuantity" center>
            <wd-input-number v-model="formData.checkQuantity" :min="0" :precision="2" :disabled="isFromPendingTask" />
          </wd-form-item>
          <wd-form-item title="合格数量" title-width="220rpx" prop="qualifiedQuantity" center>
            <wd-input-number v-model="formData.qualifiedQuantity" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="不合格数量" title-width="220rpx" prop="unqualifiedQuantity" center>
            <wd-input-number v-model="formData.unqualifiedQuantity" :min="0" :precision="2" />
          </wd-form-item>
          <template v-if="Number(formData.unqualifiedQuantity || 0) > 0">
            <wd-form-item title="工废数量" title-width="220rpx" prop="laborScrapQuantity" center>
              <wd-input-number v-model="formData.laborScrapQuantity" :min="0" :precision="2" />
            </wd-form-item>
            <wd-form-item title="料废数量" title-width="220rpx" prop="materialScrapQuantity" center>
              <wd-input-number v-model="formData.materialScrapQuantity" :min="0" :precision="2" />
            </wd-form-item>
            <wd-form-item title="其他废品" title-width="220rpx" prop="otherScrapQuantity" center>
              <wd-input-number v-model="formData.otherScrapQuantity" :min="0" :precision="2" />
            </wd-form-item>
          </template>
          <UserPicker v-model="formData.inspectorUserId" label="检测人员" label-width="220rpx" prop="inspectorUserId" type="radio" placeholder="请选择检测人员" />
          <wd-form-item title="检测日期" title-width="220rpx" prop="inspectDate">
            <wd-datetime-picker v-model="formData.inspectDate" type="date" placeholder="请选择检测日期" />
          </wd-form-item>
          <wd-form-item title="检测结果" title-width="220rpx" prop="checkResult">
            <wd-radio-group v-model="formData.checkResult" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_CHECK_RESULT)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <view class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#8a5a00]">
        保存时需满足“合格数量 + 不合格数量 = 检测数量”，且废品数量合计不能超过不合格数量。检验项和检测结果当前为只读展示，维护请进入检验单详情页。
      </view>
      <template v-if="currentId">
        <QcLineSection type="ipqc" :order-id="currentId" :qc-type="MesQcTypeEnum.IPQC" />
        <QcIndicatorResultSection :qc-id="currentId" :qc-type="MesQcTypeEnum.IPQC" />
      </template>
      <view v-else class="mx-24rpx mt-20rpx rounded-12rpx bg-[#f6ffed] p-20rpx text-24rpx text-[#389e0d]">
        新增检验单保存后，可在详情页查看检验项、检测结果和缺陷记录。
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions>
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
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
import type { ProTaskVO } from '@/api/mes/pro/task'
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import type { QcIpqcCreateReqVO, QcIpqcUpdateReqVO } from '@/api/mes/qc/ipqc'
import UserPicker from '@/components/system-select/user-picker.vue'
import TaskSelector from '@/pages-mes/pro/feedback/components/task-selector.vue'
import WorkOrderSelector from '@/pages-mes/pro/card/components/workorder-selector.vue'
import WorkstationSelector from '@/pages-mes/pro/task/components/workstation-selector.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createIpqc, getIpqc, updateIpqc } from '@/api/mes/qc/ipqc'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import QcIndicatorResultSection from '../../components/qc-indicator-result-section.vue'
import QcLineSection from '../../components/qc-line-section.vue'

interface QcIpqcFormData {
  id?: number
  code: string
  name: string
  type?: number
  sourceDocType?: number
  sourceDocId?: number
  sourceLineId?: number
  sourceDocCode: string
  workOrderId?: number
  workOrderCode: string
  workOrderName: string
  taskId?: number
  taskCode: string
  workstationId?: number
  workstationCode: string
  workstationName: string
  processId?: number
  processName: string
  itemId?: number
  itemCode: string
  itemName: string
  itemSpecification: string
  unitName: string
  checkQuantity?: number
  qualifiedQuantity?: number
  unqualifiedQuantity?: number
  laborScrapQuantity?: number
  materialScrapQuantity?: number
  otherScrapQuantity?: number
  inspectorUserId?: number
  inspectDate?: string
  checkResult?: number
  remark: string
}

const props = defineProps<{
  id?: number | string
  name?: string
  sourceDocType?: number | string
  sourceDocId?: number | string
  sourceLineId?: number | string
  sourceDocCode?: string
  itemId?: number | string
  itemCode?: string
  itemName?: string
  itemSpecification?: string
  unitName?: string
  workOrderId?: number | string
  workOrderCode?: string
  workOrderName?: string
  workstationId?: number | string
  workstationCode?: string
  workstationName?: string
  processId?: number | string
  processName?: string
  taskId?: number | string
  taskCode?: string
  quantity?: number | string
  recordTime?: string
}>()

const MesAutoCodeRuleCode = {
  QC_IPQC_CODE: 'QC_IPQC_CODE',
} as const

const MesProTaskStatusEnum = {
  PREPARE: 0,
} as const
const MesQcTypeEnum = {
  IPQC: 2,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/qc/ipqc/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑过程检验单（IPQC）' : '新增过程检验单（IPQC）')
const formLoading = ref(false) // 表单提交状态
const workOrderSelectorRef = ref<InstanceType<typeof WorkOrderSelector>>() // 工单选择器引用
const workstationSelectorRef = ref<InstanceType<typeof WorkstationSelector>>() // 工位选择器引用
const taskSelectorRef = ref<InstanceType<typeof TaskSelector>>() // 任务选择器引用
const formData = ref<QcIpqcFormData>({
  code: '',
  name: '',
  sourceDocCode: '',
  workOrderCode: '',
  workOrderName: '',
  taskCode: '',
  workstationCode: '',
  workstationName: '',
  processName: '',
  itemCode: '',
  itemName: '',
  itemSpecification: '',
  unitName: '',
  checkQuantity: 0,
  qualifiedQuantity: 0,
  unqualifiedQuantity: 0,
  laborScrapQuantity: 0,
  materialScrapQuantity: 0,
  otherScrapQuantity: 0,
  inspectDate: '',
  remark: '',
}) // 表单数据
const isFromPendingTask = computed(() => !currentId.value && formData.value.sourceDocId != null)
const selectedWorkOrderText = computed(() => {
  if (!formData.value.workOrderId) {
    return ''
  }
  return `${formData.value.workOrderCode || '-'} / ${formData.value.workOrderName || '-'}`
})
const selectedWorkstationText = computed(() => {
  if (!formData.value.workstationId) {
    return ''
  }
  return `${formData.value.workstationCode || '-'} / ${formData.value.workstationName || '-'}`
})
const selectedTaskText = computed(() => {
  if (!formData.value.taskId) {
    return ''
  }
  return `${formData.value.taskCode || formData.value.taskId}`
})
const selectedItemText = computed(() => {
  if (!formData.value.itemId) {
    return ''
  }
  return `${formData.value.itemCode || '-'} / ${formData.value.itemName || '-'}`
})
const formSchema = createFormSchema({
  code: [{ required: true, message: '检验单编号不能为空' }],
  name: [{ required: true, message: '检验单名称不能为空' }],
  type: [{ required: true, message: '检验类型不能为空' }],
  workOrderId: [{ required: true, message: '生产工单不能为空' }],
  workstationId: [{ required: true, message: '工位不能为空' }],
  checkQuantity: [
    { required: true, message: '检测数量不能为空' },
    { validator: value => Number(value) >= 0 || '检测数量不能小于 0' },
    { validator: () => validateQuantitySum() },
  ],
  qualifiedQuantity: [
    { required: true, message: '合格数量不能为空' },
    { validator: value => Number(value) >= 0 || '合格数量不能小于 0' },
    { validator: () => validateQuantitySum() },
  ],
  unqualifiedQuantity: [
    { required: true, message: '不合格数量不能为空' },
    { validator: value => Number(value) >= 0 || '不合格数量不能小于 0' },
    { validator: () => validateQuantitySum() },
    { validator: () => validateScrapSum() },
  ],
  laborScrapQuantity: [
    { required: true, message: '工废数量不能为空' },
    { validator: value => Number(value) >= 0 || '工废数量不能小于 0' },
    { validator: () => validateScrapSum() },
  ],
  materialScrapQuantity: [
    { required: true, message: '料废数量不能为空' },
    { validator: value => Number(value) >= 0 || '料废数量不能小于 0' },
    { validator: () => validateScrapSum() },
  ],
  otherScrapQuantity: [
    { required: true, message: '其他废品数量不能为空' },
    { validator: value => Number(value) >= 0 || '其他废品数量不能小于 0' },
    { validator: () => validateScrapSum() },
  ],
  inspectorUserId: [{ required: true, message: '检测人员不能为空' }],
  inspectDate: [{ required: true, message: '检测日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 解码 URL 文本参数 */
function decodeText(value?: string) {
  if (!value) {
    return ''
  }
  let result = value
  for (let i = 0; i < 3 && result.includes('%'); i++) {
    try {
      const decoded = decodeURIComponent(result)
      if (decoded === result) {
        break
      }
      result = decoded
    } catch {
      break
    }
  }
  return result
}

/** 校验数量合计 */
function validateQuantitySum() {
  const checkQuantity = Number(formData.value.checkQuantity || 0)
  const qualifiedQuantity = Number(formData.value.qualifiedQuantity || 0)
  const unqualifiedQuantity = Number(formData.value.unqualifiedQuantity || 0)
  return checkQuantity === qualifiedQuantity + unqualifiedQuantity || '检测数量必须等于合格数量与不合格数量之和'
}

/** 校验废品合计 */
function validateScrapSum() {
  const unqualifiedQuantity = Number(formData.value.unqualifiedQuantity || 0)
  const scrapSum = Number(formData.value.laborScrapQuantity || 0)
    + Number(formData.value.materialScrapQuantity || 0)
    + Number(formData.value.otherScrapQuantity || 0)
  return scrapSum <= unqualifiedQuantity || '废品数量合计不能超过不合格数量'
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/ipqc/index')
}

/** 生成检验单编号 */
async function handleGenerateCode() {
  formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.QC_IPQC_CODE)
}

/** 打开工单选择器 */
function openWorkOrderSelector() {
  if (isFromPendingTask.value) {
    return
  }
  workOrderSelectorRef.value?.open(formData.value.workOrderId)
}

/** 确认工单 */
function handleWorkOrderConfirm(workOrder: ProWorkOrderVO) {
  formData.value.workOrderId = workOrder.id
  formData.value.workOrderCode = workOrder.code || ''
  formData.value.workOrderName = workOrder.name || ''
  formData.value.itemId = workOrder.productId
  formData.value.itemCode = workOrder.productCode || ''
  formData.value.itemName = workOrder.productName || ''
  formData.value.itemSpecification = workOrder.productSpecification || ''
  formData.value.unitName = workOrder.unitMeasureName || ''
  formData.value.taskId = undefined
  formData.value.taskCode = ''
}

/** 打开工位选择器 */
function openWorkstationSelector() {
  if (isFromPendingTask.value) {
    return
  }
  workstationSelectorRef.value?.open(formData.value.workstationId)
}

/** 确认工位 */
function handleWorkstationConfirm(workstation: MdWorkstationVO) {
  formData.value.workstationId = workstation.id
  formData.value.workstationCode = workstation.code || ''
  formData.value.workstationName = workstation.name || ''
  formData.value.processId = workstation.processId
  formData.value.processName = workstation.processName || ''
  formData.value.taskId = undefined
  formData.value.taskCode = ''
}

/** 打开任务选择器 */
function openTaskSelector() {
  if (isFromPendingTask.value) {
    return
  }
  if (!formData.value.workOrderId) {
    toast.warning('请先选择生产工单')
    return
  }
  taskSelectorRef.value?.open(formData.value.taskId)
}

/** 确认生产任务 */
function handleTaskConfirm(task: ProTaskVO) {
  formData.value.taskId = task.id
  formData.value.taskCode = task.code || ''
  formData.value.workOrderId = task.workOrderId
  formData.value.workOrderCode = task.workOrderCode || formData.value.workOrderCode
  formData.value.workOrderName = task.workOrderName || formData.value.workOrderName
  formData.value.workstationId = task.workstationId
  formData.value.workstationCode = task.workstationCode || formData.value.workstationCode
  formData.value.workstationName = task.workstationName || formData.value.workstationName
  formData.value.processId = task.processId
  formData.value.processName = task.processName || ''
  formData.value.itemId = task.itemId
  formData.value.itemCode = task.itemCode || ''
  formData.value.itemName = task.itemName || ''
  formData.value.itemSpecification = task.itemSpecification || ''
  formData.value.unitName = task.unitMeasureName || ''
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const detail = await getIpqc(currentId.value)
  formData.value = {
    ...formData.value,
    ...detail,
    sourceDocCode: detail.sourceDocCode || '',
    workOrderCode: detail.workOrderCode || '',
    workOrderName: detail.workOrderName || '',
    taskCode: detail.taskCode || '',
    workstationCode: detail.workstationCode || '',
    workstationName: detail.workstationName || '',
    processName: detail.processName || '',
    itemCode: detail.itemCode || '',
    itemName: detail.itemName || '',
    itemSpecification: detail.itemSpecification || '',
    unitName: detail.unitName || '',
    laborScrapQuantity: detail.laborScrapQuantity ?? 0,
    materialScrapQuantity: detail.materialScrapQuantity ?? 0,
    otherScrapQuantity: detail.otherScrapQuantity ?? 0,
    inspectDate: detail.inspectDate ? String(detail.inspectDate) : '',
    remark: detail.remark || '',
  }
}

/** 应用待检任务预填 */
function applyPendingInspectPreset() {
  if (currentId.value) {
    return
  }
  formData.value.name = decodeText(getRouteQueryValue('name') as string) || formData.value.name
  formData.value.sourceDocType = getRouteQueryNumber('sourceDocType')
  formData.value.sourceDocId = getRouteQueryNumber('sourceDocId')
  formData.value.sourceLineId = getRouteQueryNumber('sourceLineId')
  formData.value.sourceDocCode = decodeText(getRouteQueryValue('sourceDocCode') as string) || formData.value.sourceDocCode
  formData.value.itemId = getRouteQueryNumber('itemId')
  formData.value.itemCode = decodeText(getRouteQueryValue('itemCode') as string) || formData.value.itemCode
  formData.value.itemName = decodeText(getRouteQueryValue('itemName') as string) || formData.value.itemName
  formData.value.itemSpecification = decodeText(getRouteQueryValue('itemSpecification') as string) || formData.value.itemSpecification
  formData.value.unitName = decodeText(getRouteQueryValue('unitName') as string) || formData.value.unitName
  formData.value.workOrderId = getRouteQueryNumber('workOrderId')
  formData.value.workOrderCode = decodeText(getRouteQueryValue('workOrderCode') as string) || formData.value.workOrderCode
  formData.value.workOrderName = decodeText(getRouteQueryValue('workOrderName') as string) || formData.value.workOrderName
  formData.value.workstationId = getRouteQueryNumber('workstationId')
  formData.value.workstationCode = decodeText(getRouteQueryValue('workstationCode') as string) || formData.value.workstationCode
  formData.value.workstationName = decodeText(getRouteQueryValue('workstationName') as string) || formData.value.workstationName
  formData.value.processId = getRouteQueryNumber('processId')
  formData.value.processName = decodeText(getRouteQueryValue('processName') as string) || formData.value.processName
  formData.value.taskId = getRouteQueryNumber('taskId')
  formData.value.taskCode = decodeText(getRouteQueryValue('taskCode') as string) || formData.value.taskCode
  formData.value.checkQuantity = getRouteQueryNumber('quantity') ?? formData.value.checkQuantity
  formData.value.inspectDate = decodeText(getRouteQueryValue('recordTime') as string) || formData.value.inspectDate
}

/** 构造提交数据 */
function buildSubmitData(): QcIpqcCreateReqVO | QcIpqcUpdateReqVO {
  const data: QcIpqcCreateReqVO = {
    code: formData.value.code,
    name: formData.value.name,
    type: Number(formData.value.type),
    sourceDocType: formData.value.sourceDocType,
    sourceDocId: formData.value.sourceDocId,
    sourceLineId: formData.value.sourceLineId,
    workOrderId: Number(formData.value.workOrderId),
    taskId: formData.value.taskId,
    workstationId: Number(formData.value.workstationId),
    processId: formData.value.processId,
    itemId: formData.value.itemId,
    checkQuantity: Number(formData.value.checkQuantity || 0),
    qualifiedQuantity: Number(formData.value.qualifiedQuantity || 0),
    unqualifiedQuantity: Number(formData.value.unqualifiedQuantity || 0),
    laborScrapQuantity: Number(formData.value.laborScrapQuantity || 0),
    materialScrapQuantity: Number(formData.value.materialScrapQuantity || 0),
    otherScrapQuantity: Number(formData.value.otherScrapQuantity || 0),
    inspectorUserId: Number(formData.value.inspectorUserId),
    inspectDate: dayjs(formData.value.inspectDate).format('YYYY-MM-DD HH:mm:ss'),
    checkResult: formData.value.checkResult,
    remark: formData.value.remark || undefined,
  }
  if (currentId.value) {
    return { ...data, id: currentId.value }
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
      await updateIpqc(data as QcIpqcUpdateReqVO)
      toast.success('修改成功')
    } else {
      await createIpqc(data as QcIpqcCreateReqVO)
      toast.success('新增成功')
    }
    uni.$emit('mes:qc:ipqc:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

watch(() => formData.value.unqualifiedQuantity, (value) => {
  if (!Number(value || 0)) {
    formData.value.laborScrapQuantity = 0
    formData.value.materialScrapQuantity = 0
    formData.value.otherScrapQuantity = 0
  }
})

/** 初始化 */
onMounted(() => {
  applyPendingInspectPreset()
  getDetail()
})
</script>
