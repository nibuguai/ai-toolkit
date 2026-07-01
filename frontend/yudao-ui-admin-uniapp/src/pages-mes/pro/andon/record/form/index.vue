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
        <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
          呼叫信息
        </view>
        <wd-cell-group border>
          <wd-form-item
            title="工作站"
            title-width="220rpx"
            prop="workstationId"
            :is-link="isCreateMode"
            :value="selectedWorkstationText"
            placeholder="请选择工作站"
            @click="openWorkstationSelector"
          />
          <UserPicker
            v-if="isCreateMode"
            v-model="formData.userId"
            label="发起人"
            label-width="220rpx"
            prop="userId"
            type="radio"
            placeholder="请选择发起人"
          />
          <wd-cell v-else title="发起人" :value="detailData?.userNickname || '-'" />
          <wd-form-item
            title="生产工单"
            title-width="220rpx"
            prop="workOrderId"
            :is-link="isCreateMode"
            :value="selectedWorkOrderText"
            placeholder="请选择已确认工单（可选）"
            @click="openWorkOrderSelector"
          />
          <wd-form-item
            title="工序"
            title-width="220rpx"
            prop="processId"
            :is-link="isCreateMode"
            :value="selectedProcessText"
            placeholder="请选择工序（可选）"
            @click="openProcessSelector"
          />
          <wd-form-item
            v-if="isCreateMode"
            title="呼叫原因"
            title-width="220rpx"
            prop="configId"
            is-link
            :value="selectedConfigText"
            placeholder="请选择呼叫原因"
            @click="openConfigSelector"
          />
          <wd-cell v-else title="呼叫原因" :value="detailData?.reason || '-'" />
          <wd-cell title="级别">
            <dict-tag v-if="formData.level != null" :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="formData.level" />
            <text v-else>由呼叫原因自动带出</text>
          </wd-cell>
          <wd-cell v-if="detailData?.status != null" title="处置状态">
            <dict-tag :type="DICT_TYPE.MES_PRO_ANDON_STATUS" :value="detailData.status" />
          </wd-cell>
        </wd-cell-group>

        <template v-if="isUpdateMode">
          <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
            处置信息
          </view>
          <wd-cell-group border>
            <wd-form-item title="处置时间" title-width="220rpx" prop="handleTime">
              <wd-datetime-picker
                v-model="formData.handleTime"
                type="datetime"
                placeholder="请选择处置时间"
              />
            </wd-form-item>
            <UserPicker
              v-model="formData.handlerUserId"
              label="处置人"
              label-width="220rpx"
              prop="handlerUserId"
              type="radio"
              placeholder="请选择处置人"
            />
          </wd-cell-group>
        </template>

        <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
          备注
        </view>
        <wd-cell-group border>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="300"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions content-class="flex gap-16rpx">
      <wd-button v-if="isCreateMode" class="flex-1" type="primary" :loading="formLoading" @click="handleCreate">
        确定
      </wd-button>
      <wd-button v-if="isUpdateMode" class="flex-1" type="primary" :loading="formLoading" @click="handleSave">
        保存
      </wd-button>
      <wd-button v-if="isUpdateMode" class="flex-1" type="success" :loading="formLoading" @click="handleFinish">
        已处置
      </wd-button>
    </MesFooterActions>

    <WorkstationSelector ref="workstationSelectorRef" @confirm="handleWorkstationConfirm" />
    <WorkOrderSelector ref="workOrderSelectorRef" @confirm="handleWorkOrderConfirm" />
    <ProcessSelector ref="processSelectorRef" @confirm="handleProcessConfirm" />
    <AndonConfigSelector ref="configSelectorRef" @confirm="handleConfigConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdWorkstationVO } from '@/api/mes/md/workstation'
import type { ProAndonConfigVO } from '@/api/mes/pro/andon/config'
import type { ProAndonRecordCreateReqVO, ProAndonRecordVO } from '@/api/mes/pro/andon/record'
import type { ProProcessVO } from '@/api/mes/pro/process'
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createAndonRecord, getAndonRecord, updateAndonRecord } from '@/api/mes/pro/andon/record'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import AndonConfigSelector from '../components/andon-config-selector.vue'
import ProcessSelector from '../components/process-selector.vue'
import WorkOrderSelector from '../../../card/components/workorder-selector.vue'
import WorkstationSelector from '../../../task/components/workstation-selector.vue'

type FormMode = 'create' | 'update'

interface AndonRecordFormData {
  id?: number
  configId?: number
  workstationId?: number
  userId?: number
  workOrderId?: number
  processId?: number
  reason?: string
  level?: number
  handleTime?: string | number
  handlerUserId?: number
  remark?: string
}

const props = withDefaults(defineProps<{
  id?: number | string
  mode?: FormMode
}>(), {
  id: undefined,
  mode: 'create',
})

const MesProAndonStatusEnum = {
  ACTIVE: 0,
  HANDLED: 1,
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
const detailData = ref<ProAndonRecordVO>() // 原始详情
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/pro/andon/record/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const routeMode = computed(() => (getRouteQueryValue('mode') as FormMode) || 'create')
const formData = ref<AndonRecordFormData>(getDefaultFormData()) // 表单数据
const selectedWorkstation = ref<MdWorkstationVO>() // 已选工作站
const selectedWorkOrder = ref<ProWorkOrderVO>() // 已选工单
const selectedProcess = ref<ProProcessVO>() // 已选工序
const selectedConfig = ref<ProAndonConfigVO>() // 已选安灯配置
const workstationSelectorRef = ref<InstanceType<typeof WorkstationSelector>>() // 工作站选择器
const workOrderSelectorRef = ref<InstanceType<typeof WorkOrderSelector>>() // 工单选择器
const processSelectorRef = ref<InstanceType<typeof ProcessSelector>>() // 工序选择器
const configSelectorRef = ref<InstanceType<typeof AndonConfigSelector>>() // 安灯配置选择器
const isCreateMode = computed(() => routeMode.value === 'create' || !currentId.value)
const isUpdateMode = computed(() => routeMode.value === 'update' && !!currentId.value)
const getTitle = computed(() => isCreateMode.value ? '新增安灯呼叫' : '处置安灯呼叫')
const selectedWorkstationText = computed(() => {
  if (selectedWorkstation.value) {
    return `${selectedWorkstation.value.code || '-'} / ${selectedWorkstation.value.name || '-'}`
  }
  return detailData.value
    ? `${detailData.value.workstationCode || '-'} / ${detailData.value.workstationName || '-'}`
    : ''
})
const selectedWorkOrderText = computed(() => {
  if (selectedWorkOrder.value) {
    return `${selectedWorkOrder.value.code || '-'} / ${selectedWorkOrder.value.name || '-'}`
  }
  return detailData.value?.workOrderCode || ''
})
const selectedProcessText = computed(() => {
  if (selectedProcess.value) {
    return `${selectedProcess.value.code || '-'} / ${selectedProcess.value.name || '-'}`
  }
  return detailData.value?.processName || ''
})
const selectedConfigText = computed(() => selectedConfig.value?.reason || formData.value.reason || '')
const formSchema = createFormSchema(() => ({
  workstationId: [{ required: isCreateMode.value, message: '工作站不能为空' }],
  userId: [{ required: isCreateMode.value, message: '发起人不能为空' }],
  configId: [{ required: isCreateMode.value, message: '呼叫原因不能为空' }],
}))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/andon/record/index')
}

/** 默认表单数据 */
function getDefaultFormData(): AndonRecordFormData {
  return {
    userId: userStore.userInfo?.userId,
  }
}

/** 重置表单上下文 */
function resetFormContext() {
  detailData.value = undefined
  formData.value = getDefaultFormData()
  selectedWorkstation.value = undefined
  selectedWorkOrder.value = undefined
  selectedProcess.value = undefined
  selectedConfig.value = undefined
}

/** 打开工作站选择器 */
function openWorkstationSelector() {
  if (!isCreateMode.value) {
    return
  }
  workstationSelectorRef.value?.open(formData.value.workstationId)
}

/** 打开工单选择器 */
function openWorkOrderSelector() {
  if (!isCreateMode.value) {
    return
  }
  workOrderSelectorRef.value?.open(formData.value.workOrderId)
}

/** 打开工序选择器 */
function openProcessSelector() {
  if (!isCreateMode.value) {
    return
  }
  processSelectorRef.value?.open(formData.value.processId)
}

/** 打开安灯配置选择器 */
function openConfigSelector() {
  if (!isCreateMode.value) {
    return
  }
  configSelectorRef.value?.open(formData.value.configId)
}

/** 选择工作站 */
function handleWorkstationConfirm(item: MdWorkstationVO) {
  selectedWorkstation.value = item
  formData.value.workstationId = item.id
}

/** 选择工单 */
function handleWorkOrderConfirm(item: ProWorkOrderVO) {
  selectedWorkOrder.value = item
  formData.value.workOrderId = item.id
}

/** 选择工序 */
function handleProcessConfirm(item: ProProcessVO) {
  selectedProcess.value = item
  formData.value.processId = item.id
}

/** 选择呼叫原因 */
function handleConfigConfirm(item: ProAndonConfigVO) {
  selectedConfig.value = item
  formData.value.configId = item.id
  formData.value.reason = item.reason
  formData.value.level = item.level
}

/** 加载详情 */
async function getDetail() {
  resetFormContext()
  if (!currentId.value || isCreateMode.value) {
    return
  }
  detailData.value = await getAndonRecord(currentId.value)
  formData.value = {
    id: detailData.value.id,
    workstationId: detailData.value.workstationId,
    userId: detailData.value.userId,
    workOrderId: detailData.value.workOrderId,
    processId: detailData.value.processId,
    configId: detailData.value.configId,
    reason: detailData.value.reason,
    level: detailData.value.level,
    handleTime: detailData.value.handleTime || Date.now(),
    handlerUserId: detailData.value.handlerUserId || userStore.userInfo?.userId,
    remark: detailData.value.remark,
  }
}

/** 校验表单 */
async function validateForm() {
  const result = await formRef.value?.validate()
  return !(result && !result.valid)
}

/** 新增呼叫 */
async function handleCreate() {
  if (!await validateForm()) {
    return
  }
  formLoading.value = true
  try {
    const data: ProAndonRecordCreateReqVO = {
      configId: formData.value.configId!,
      workstationId: formData.value.workstationId!,
      userId: formData.value.userId!,
      workOrderId: formData.value.workOrderId,
      processId: formData.value.processId,
      remark: formData.value.remark || undefined,
    }
    await createAndonRecord(data)
    toast.success('新增成功')
    uni.$emit('mes:pro:andon:record:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 保存处置信息 */
async function handleSave() {
  if (!formData.value.id) {
    return
  }
  formLoading.value = true
  try {
    await updateAndonRecord({
      id: formData.value.id,
      handleTime: formData.value.handleTime,
      handlerUserId: formData.value.handlerUserId,
      remark: formData.value.remark || undefined,
      status: MesProAndonStatusEnum.ACTIVE,
    })
    toast.success('保存成功')
    uni.$emit('mes:pro:andon:record:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 标记已处置 */
async function handleFinish() {
  if (!formData.value.id) {
    return
  }
  if (!formData.value.handleTime) {
    toast.warning('标记已处置时，处置时间不能为空')
    return
  }
  if (!formData.value.handlerUserId) {
    toast.warning('标记已处置时，处置人不能为空')
    return
  }
  try {
    await dialog.confirm({ title: '处置确认', msg: '确定要将该安灯呼叫标记为已处置吗？' })
  } catch {
    return
  }
  formLoading.value = true
  try {
    await updateAndonRecord({
      id: formData.value.id,
      handleTime: formData.value.handleTime,
      handlerUserId: formData.value.handlerUserId,
      remark: formData.value.remark || undefined,
      status: MesProAndonStatusEnum.HANDLED,
    })
    toast.success('处置成功')
    uni.$emit('mes:pro:andon:record:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})

watch([currentId, routeMode], () => {
  getDetail()
})
</script>
