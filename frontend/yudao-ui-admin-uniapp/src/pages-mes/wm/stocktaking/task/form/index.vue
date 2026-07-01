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
          <wd-form-item title="任务编码" title-width="220rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入任务编码"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="任务名称" title-width="220rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              :disabled="isHeaderReadonly"
              placeholder="请输入任务名称"
            />
          </wd-form-item>
          <wd-form-item
            title="盘点方案"
            title-width="220rpx"
            prop="planId"
            :is-link="!isHeaderReadonly"
            :value="planDisplayValue"
            placeholder="请选择盘点方案"
            @click="openPlanPicker"
          />
          <wd-form-item title="盘点类型" title-width="220rpx" prop="type">
            <dict-tag v-if="formData.type != null" :type="DICT_TYPE.MES_WM_STOCK_TAKING_TYPE" :value="formData.type" />
            <text v-else class="text-[#999]">选择方案后自动带出</text>
          </wd-form-item>
          <wd-form-item title="盘点日期" title-width="220rpx" prop="takingDate">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openDatePicker('takingDate')">
              <text :class="formatDate(formData.takingDate) ? 'text-[#333]' : 'text-[#999]'">
                {{ formatDate(formData.takingDate) || '请选择盘点日期' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.takingDate"
            v-model:visible="pickerVisible.takingDate"
            title="请选择盘点日期"
            type="date"
          />
          <wd-form-item title="动态开始时间" title-width="220rpx">
            <text>{{ formatDateTime(formData.startTime) || '-' }}</text>
          </wd-form-item>
          <wd-form-item title="动态结束时间" title-width="220rpx">
            <text>{{ formatDateTime(formData.endTime) || '-' }}</text>
          </wd-form-item>
          <UserPicker
            v-model="formData.userId"
            label="盘点人"
            label-width="220rpx"
            prop="userId"
            type="radio"
            placeholder="请选择盘点人"
            :disabled="isHeaderReadonly"
            @confirm="handleUserConfirm"
          />
          <wd-form-item title="是否盲盘" title-width="220rpx" prop="blindFlag" center>
            <wd-switch v-model="formData.blindFlag" :disabled="isHeaderReadonly" />
          </wd-form-item>
          <wd-form-item title="冻结库存" title-width="220rpx" prop="frozen" center>
            <wd-switch v-model="formData.frozen" :disabled="isHeaderReadonly" />
          </wd-form-item>
          <wd-form-item v-if="currentId" title="单据状态" title-width="220rpx">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_STOCK_TAKING_TASK_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
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

      <view v-if="currentId" class="px-24rpx">
        <TaskLineMaintain :task-id="currentId" :editable="canMaintainLines" />
        <TaskResultMaintain :task-id="currentId" :editable="isExecuteMode" />
      </view>
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx text-26rpx text-[#8c8c8c] leading-40rpx">
        请先保存盘点任务主表，保存后后端会按盘点方案生成盘点清单。
      </view>
      <view v-if="isExecuteMode" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#d46b08] leading-42rpx">
        当前为执行盘点入口，可维护盘点结果；提交、删除等写动作请谨慎确认。
      </view>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions v-if="!isHeaderReadonly">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </MesFooterActions>
  </view>

  <!-- 盘点方案选择 -->
  <wd-picker
    v-model:visible="planPickerVisible"
    :model-value="planPickerValue"
    :columns="planOptions"
    label-key="name"
    value-key="id"
    @confirm="handlePlanConfirm"
  />
</template>

<script lang="ts" setup>
import type { User } from '@/api/system/user'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type {
  StockTakingTaskCreateReqVO,
  StockTakingTaskVO,
} from '@/api/mes/wm/stocktaking/task'
import type { StockTakingPlanVO } from '@/api/mes/wm/stocktaking/plan'
import { onShow } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getStockTakingPlanPage } from '@/api/mes/wm/stocktaking/plan'
import { createStockTaking, getStockTaking, updateStockTaking } from '@/api/mes/wm/stocktaking/task'
import UserPicker from '@/components/system-select/user-picker.vue'
import { navigateBackPlus } from '@/utils'
import {
  CommonStatusEnum,
  DICT_TYPE,
  MesAutoCodeRuleCode,
  MesWmStockTakingTaskStatusEnum,
} from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import TaskLineMaintain from '../components/task-line-maintain.vue'
import TaskResultMaintain from '../components/task-result-maintain.vue'

interface StockTakingTaskFormData {
  id?: number
  code: string
  name: string
  takingDate?: string | number | Date
  type?: number
  userId?: number
  userNickname?: string
  planId?: number
  planCode?: string
  planName?: string
  blindFlag: boolean
  frozen: boolean
  startTime?: string | number | Date
  endTime?: string | number | Date
  status?: number
  remark?: string
}

const props = defineProps<{
  id?: number | string
  mode?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/wm/stocktaking/task/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const routeMode = computed(() => String(getRouteQueryValue('mode') || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref('') // 当前页面模式
const isExecuteMode = computed(() => currentMode.value === 'execute')
const getTitle = computed(() => {
  if (isExecuteMode.value) {
    return '执行盘点'
  }
  return currentId.value ? '编辑盘点任务' : '新增盘点任务'
})
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<StockTakingTaskFormData>(getDefaultFormData()) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const planOptions = ref<StockTakingPlanVO[]>([]) // 盘点方案选项
const planPickerVisible = ref(false) // 方案选择弹窗
const canMaintainLines = computed(() => {
  return currentId.value !== undefined
    && !isExecuteMode.value
    && formData.value.status === MesWmStockTakingTaskStatusEnum.PREPARE
})
const isHeaderReadonly = computed(() => {
  if (isExecuteMode.value) {
    return true
  }
  return currentId.value !== undefined && formData.value.status !== MesWmStockTakingTaskStatusEnum.PREPARE
})
const planDisplayValue = computed(() => {
  if (formData.value.planCode && formData.value.planName) {
    return `${formData.value.planCode} / ${formData.value.planName}`
  }
  return formData.value.planName || formData.value.planCode || ''
})
const planPickerValue = computed(() => formData.value.planId === undefined ? [] : [formData.value.planId])
const formSchema = createFormSchema({
  code: [{ required: true, message: '任务编码不能为空' }],
  name: [{ required: true, message: '任务名称不能为空' }],
  planId: [{ required: true, message: '盘点方案不能为空' }],
  type: [{ required: true, message: '盘点类型不能为空' }],
  takingDate: [{ required: true, message: '盘点日期不能为空' }],
  userId: [{ required: true, message: '盘点人不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData(): StockTakingTaskFormData {
  return {
    code: '',
    name: '',
    takingDate: undefined,
    type: undefined,
    userId: undefined,
    userNickname: '',
    planId: undefined,
    planCode: '',
    planName: '',
    blindFlag: false,
    frozen: false,
    startTime: undefined,
    endTime: undefined,
    status: MesWmStockTakingTaskStatusEnum.PREPARE,
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
  navigateBackPlus('/pages-mes/wm/stocktaking/task/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data: StockTakingTaskVO = await getStockTaking(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code || '',
    name: data.name || '',
    takingDate: data.takingDate,
    type: data.type,
    userId: data.userId,
    userNickname: data.userNickname || '',
    planId: data.planId,
    planCode: data.planCode || '',
    planName: data.planName || '',
    blindFlag: Boolean(data.blindFlag),
    frozen: Boolean(data.frozen),
    startTime: data.startTime,
    endTime: data.endTime,
    status: data.status,
    remark: data.remark || '',
  }
}

/** 加载可用盘点方案 */
async function loadPlanOptions() {
  const data = await getStockTakingPlanPage({
    pageNo: 1,
    pageSize: 100,
    status: CommonStatusEnum.ENABLE,
  })
  planOptions.value = data.list
}

/** 初始化页面数据 */
async function initPage() {
  const oldId = currentId.value
  refreshRouteState()
  await loadPlanOptions()
  if (!currentId.value) {
    formData.value = getDefaultFormData()
    return
  }
  if (oldId !== currentId.value || !formData.value.id) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开日期选择器 */
function openDatePicker(key: string) {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value[key] = true
}

/** 打开方案选择 */
function openPlanPicker() {
  if (isHeaderReadonly.value) {
    return
  }
  planPickerVisible.value = true
}

/** 确认方案选择 */
function handlePlanConfirm({ value }: { value: Array<number | string> }) {
  const planId = Number(value[0])
  const plan = planOptions.value.find(item => item.id === planId)
  if (!plan) {
    return
  }
  formData.value.planId = plan.id
  formData.value.planCode = plan.code
  formData.value.planName = plan.name
  formData.value.type = plan.type
  formData.value.startTime = plan.startTime
  formData.value.endTime = plan.endTime
  formData.value.blindFlag = Boolean(plan.blindFlag)
  formData.value.frozen = Boolean(plan.frozen)
  if (!formData.value.name) {
    formData.value.name = plan.name
  }
}

/** 确认盘点人 */
function handleUserConfirm(users: User[]) {
  formData.value.userNickname = users[0]?.nickname || ''
}

/** 生成任务编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_STOCK_TAKING_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData(): StockTakingTaskCreateReqVO {
  if (!formData.value.type || !formData.value.userId || !formData.value.planId) {
    throw new Error('盘点任务必填字段不完整')
  }
  return {
    code: formData.value.code,
    name: formData.value.name,
    takingDate: formData.value.takingDate,
    type: formData.value.type,
    userId: formData.value.userId,
    planId: formData.value.planId,
    blindFlag: formData.value.blindFlag,
    frozen: formData.value.frozen,
    startTime: formData.value.startTime,
    endTime: formData.value.endTime,
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
    if (currentId.value) {
      await updateStockTaking({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      const id = await createStockTaking(data)
      currentId.value = id
      formData.value.id = id
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:stocktaking:task:reload')
    await getDetail()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})

/** 页面显示时刷新 */
onShow(() => {
  initPage()
})

watch([routeId, routeMode], () => {
  initPage()
})
</script>
