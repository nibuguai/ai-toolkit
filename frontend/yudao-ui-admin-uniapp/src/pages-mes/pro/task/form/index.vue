<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell v-if="taskDetail?.code" title="任务编码" :value="taskDetail.code" />
          <wd-cell v-if="taskDetail?.name" title="任务名称" :value="taskDetail.name" />
          <wd-cell v-if="taskDetail?.workOrderCode" title="工单" :value="`${taskDetail.workOrderCode} / ${taskDetail.workOrderName || '-'}`" />
          <wd-cell v-if="taskDetail?.processName" title="工序" :value="taskDetail.processName" />
          <wd-form-item title="工作站" title-width="220rpx" prop="workstationId" is-link :value="selectedWorkstationText" placeholder="请选择工作站" @click="openWorkstationSelector" />
          <wd-form-item title="排产数量" title-width="220rpx" prop="quantity" center>
            <wd-input-number v-model="formData.quantity" :min="0.01" :precision="2" :disabled="readonly" />
          </wd-form-item>
          <wd-form-item title="开始时间" title-width="220rpx" prop="startTime">
            <wd-datetime-picker v-model="formData.startTime" type="datetime" placeholder="请选择开始时间" :disabled="readonly" />
          </wd-form-item>
          <wd-form-item title="生产时长" title-width="220rpx" prop="duration" center>
            <wd-input-number v-model="formData.duration" :min="1" :precision="0" :disabled="readonly" />
          </wd-form-item>
          <wd-cell title="预计完成" :value="formatDateTime(formData.endTime) || '-'" />
          <wd-form-item title="甘特颜色" title-width="220rpx" prop="colorCode">
            <wd-input v-model="formData.colorCode" placeholder="#00AEF3" clearable :disabled="readonly" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable :disabled="readonly" />
          </wd-form-item>
          <wd-cell v-if="taskDetail?.status != null" title="任务状态">
            <TaskStatusTag :value="taskDetail.status" />
          </wd-cell>
          <wd-cell v-if="taskDetail?.producedQuantity != null" title="已生产数量" :value="taskDetail.producedQuantity" />
          <wd-cell v-if="taskDetail?.qualifyQuantity != null" title="合格品数量" :value="taskDetail.qualifyQuantity" />
          <wd-cell v-if="taskDetail?.unqualifyQuantity != null" title="不良品数量" :value="taskDetail.unqualifyQuantity" />
        </wd-cell-group>
      </wd-form>
      <view class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f7faff] p-20rpx text-24rpx text-[#666]">
        生产任务编码和任务名称由后端根据工单、工序、产品和数量自动生成，移动端仅维护排产工作站、数量和时间。
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions v-if="!readonly">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </MesFooterActions>

    <WorkstationSelector ref="workstationSelectorRef" @confirm="handleWorkstationConfirm" />
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdWorkstationVO } from '@/api/mes/md/workstation'
import type { ProTaskCreateReqVO, ProTaskUpdateReqVO, ProTaskVO } from '@/api/mes/pro/task'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, onMounted, ref, watch } from 'vue'
import { getWorkstation } from '@/api/mes/md/workstation'
import { createTask, getTask, updateTask } from '@/api/mes/pro/task'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import TaskStatusTag from '../components/task-status-tag.vue'
import WorkstationSelector from '../components/workstation-selector.vue'

interface TaskFormData {
  id?: number
  workOrderId?: number
  workstationId?: number
  routeId?: number
  processId?: number
  itemId?: number
  quantity?: number
  startTime?: number | string
  duration?: number
  endTime?: number | string
  colorCode: string
  remark: string
}

const props = defineProps<{
  id?: number | string
  workOrderId?: number | string
  routeId?: number | string
  processId?: number | string
  itemId?: number | string
  colorCode?: string
  readonly?: boolean | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<FormInstance>() // 表单组件引用
const workstationSelectorRef = ref<InstanceType<typeof WorkstationSelector>>() // 工作站选择器
const formLoading = ref(false) // 表单提交状态
const taskDetail = ref<ProTaskVO>() // 编辑详情
const selectedWorkstation = ref<MdWorkstationVO>() // 当前工作站
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/pro/task/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前任务编号
const readonly = computed(() => getRouteQueryValue('readonly') === true || getRouteQueryValue('readonly') === 'true')
const currentColorCode = computed(() => String(getRouteQueryValue('colorCode') || '#00AEF3')) // 当前甘特颜色
const getTitle = computed(() => readonly.value ? '生产任务详情' : currentId.value ? '编辑生产任务' : '新增生产任务')
const formData = ref<TaskFormData>(getDefaultFormData())
const formSchema = createFormSchema({
  workstationId: [{ required: true, message: '工作站不能为空' }],
  quantity: [{ required: true, message: '排产数量不能为空' }],
  startTime: [{ required: true, message: '开始时间不能为空' }],
  duration: [{ required: true, message: '生产时长不能为空' }],
})
const selectedWorkstationText = computed(() => {
  if (selectedWorkstation.value) {
    return `${selectedWorkstation.value.code} / ${selectedWorkstation.value.name}`
  }
  return formData.value.workstationId ? `工作站 #${formData.value.workstationId}` : ''
})

/** 默认表单数据 */
function getDefaultFormData(): TaskFormData {
  return {
    workOrderId: undefined,
    routeId: undefined,
    processId: undefined,
    itemId: undefined,
    quantity: 1,
    startTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    duration: 1,
    endTime: undefined,
    colorCode: '#00AEF3',
    remark: '',
  }
}

/** 创建态路由参数回填 */
function getCreateFormData(): TaskFormData {
  return {
    ...getDefaultFormData(),
    workOrderId: getRouteQueryNumber('workOrderId'),
    routeId: getRouteQueryNumber('routeId'),
    processId: getRouteQueryNumber('processId'),
    itemId: getRouteQueryNumber('itemId'),
    colorCode: currentColorCode.value,
  }
}

/** 返回上一页 */
function handleBack() {
  const workOrderId = taskDetail.value?.workOrderId || formData.value.workOrderId
  navigateBackPlus(workOrderId ? `/pages-mes/pro/task/detail/index?id=${workOrderId}&mode=schedule` : '/pages-mes/pro/task/index')
}

/** 计算结束时间 */
function calculateEndTime() {
  if (!formData.value.startTime || !formData.value.duration) {
    formData.value.endTime = undefined
    return
  }
  const start = dayjs(formData.value.startTime)
  if (!start.isValid()) {
    formData.value.endTime = undefined
    return
  }
  formData.value.endTime = start.add(Number(formData.value.duration) * 8, 'hour').format('YYYY-MM-DD HH:mm:ss')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    calculateEndTime()
    return
  }
  const detail = await getTask(currentId.value)
  taskDetail.value = detail
  formData.value = {
    id: detail.id,
    workOrderId: detail.workOrderId,
    workstationId: detail.workstationId,
    routeId: detail.routeId,
    processId: detail.processId,
    itemId: detail.itemId,
    quantity: detail.quantity,
    startTime: detail.startTime ? dayjs(detail.startTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
    duration: detail.duration || 1,
    endTime: detail.endTime,
    colorCode: detail.colorCode || '#00AEF3',
    remark: detail.remark || '',
  }
  if (detail.workstationId) {
    selectedWorkstation.value = await getWorkstation(detail.workstationId)
  }
  calculateEndTime()
}

/** 初始化页面数据 */
async function initPage() {
  if (!currentId.value) {
    taskDetail.value = undefined
    selectedWorkstation.value = undefined
    formData.value = getCreateFormData()
    calculateEndTime()
    return
  }
  if (formData.value.id !== currentId.value) {
    taskDetail.value = undefined
    selectedWorkstation.value = undefined
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开工作站选择器 */
function openWorkstationSelector() {
  if (readonly.value) {
    return
  }
  workstationSelectorRef.value?.open(formData.value.workstationId)
}

/** 选择工作站 */
function handleWorkstationConfirm(item: MdWorkstationVO) {
  selectedWorkstation.value = item
  formData.value.workstationId = item.id
}

/** 构造提交数据 */
function buildSubmitData(): ProTaskCreateReqVO | ProTaskUpdateReqVO {
  const data = {
    workOrderId: Number(formData.value.workOrderId),
    workstationId: Number(formData.value.workstationId),
    routeId: Number(formData.value.routeId),
    processId: Number(formData.value.processId),
    itemId: Number(formData.value.itemId),
    quantity: Number(formData.value.quantity),
    startTime: formData.value.startTime,
    duration: Number(formData.value.duration),
    endTime: formData.value.endTime,
    colorCode: formData.value.colorCode || '#00AEF3',
    remark: formData.value.remark || undefined,
  }
  if (formData.value.id) {
    return { ...data, id: formData.value.id }
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
    if (formData.value.id) {
      await updateTask(data)
      toast.success('修改成功')
    } else {
      await createTask(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:pro:task:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

watch(() => formData.value.startTime, calculateEndTime)
watch(() => formData.value.duration, calculateEndTime)

onMounted(() => {
  initPage()
})

/** 页面显示时刷新 */
onShow(() => {
  initPage()
})

watch([currentId, readonly, currentColorCode], () => {
  initPage()
})
</script>
