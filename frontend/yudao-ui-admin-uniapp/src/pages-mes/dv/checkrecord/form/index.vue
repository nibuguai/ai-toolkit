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
          <wd-form-item title="设备" title-width="200rpx" prop="machineryId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openMachinerySelector">
              <text :class="selectedMachineryText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedMachineryText || '请选择设备' }}
              </text>
              <wd-icon name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="点检方案" title-width="200rpx" prop="planId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openPlanSelector">
              <text :class="selectedPlanText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedPlanText || '请选择点检方案' }}
              </text>
              <wd-icon name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="点检人" title-width="200rpx" prop="userId">
            <UserPicker
              v-model="formData.userId"
              type="radio"
              placeholder="请选择点检人"
              use-default-slot
              @confirm="handleUserConfirm"
            >
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx">
                <text :class="selectedUserName ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedUserName || '请选择点检人' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </UserPicker>
          </wd-form-item>
          <wd-form-item
            title="点检时间"
            title-width="200rpx"
            prop="checkTime"
            is-link
            placeholder="请选择点检时间"
            :value="formatDateTime(formData.checkTime)"
            @click="pickerVisible.checkTime = true"
          />
          <wd-datetime-picker
            v-model="formData.checkTime"
            v-model:visible="pickerVisible.checkTime"
            title="请选择点检时间"
            type="datetime"
          />
          <wd-form-item v-if="currentId" title="状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_DV_CHECK_RECORD_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
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
      <CheckRecordLineList v-if="currentId" :record-id="currentId" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions>
      <view
        class="flex-1 rounded-8rpx bg-[#1677ff] py-20rpx text-center text-white"
        :class="formLoading ? 'opacity-60' : ''"
        @click="handleSubmit"
      >
        {{ formLoading ? '保存中...' : '保存' }}
      </view>
      <view
        v-if="canSubmit"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="submitLoading ? 'opacity-60' : ''"
        @click="handleSubmitRecord"
      >
        {{ submitLoading ? '提交中...' : '提交' }}
      </view>
    </MesFooterActions>

    <MachinerySelector ref="machinerySelectorRef" @confirm="handleMachineryConfirm" />
    <CheckPlanSelector ref="planSelectorRef" @confirm="handlePlanConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { User } from '@/api/system/user'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DvCheckPlanVO } from '@/api/mes/dv/checkplan'
import type { DvMachineryVO } from '@/api/mes/dv/machinery'
import type { DvCheckRecordCreateReqVO } from '@/api/mes/dv/checkrecord'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createCheckRecord, getCheckRecord, submitCheckRecord, updateCheckRecord } from '@/api/mes/dv/checkrecord'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesDvCheckRecordStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import UserPicker from '@/components/system-select/user-picker.vue'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import CheckPlanSelector from '../../checkplan/components/checkplan-selector.vue'
import MachinerySelector from '../../machinery/components/machinery-selector.vue'
import CheckRecordLineList from '../components/check-record-line-list.vue'

interface DvCheckRecordFormData extends DvCheckRecordCreateReqVO {
  id?: number
  status?: number
}

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/dv/checkrecord/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前编辑编号
const getTitle = computed(() => currentId.value ? '编辑点检记录' : '新增点检记录')
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const formData = ref<DvCheckRecordFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  machineryId: [{ required: true, message: '设备不能为空' }],
  planId: [{ required: true, message: '点检方案不能为空' }],
  checkTime: [{ required: true, message: '点检时间不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const machinerySelectorRef = ref<InstanceType<typeof MachinerySelector>>() // 设备选择器引用
const planSelectorRef = ref<InstanceType<typeof CheckPlanSelector>>() // 方案选择器引用
const selectedMachinery = ref<DvMachineryVO>() // 当前选择设备
const selectedPlan = ref<DvCheckPlanVO>() // 当前选择方案
const selectedUserName = ref('') // 当前选择点检人
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const canSubmit = computed(() => (
  currentId.value
  && formData.value.status === MesDvCheckRecordStatusEnum.DRAFT
))
const selectedMachineryText = computed(() => {
  return selectedMachinery.value
    ? `${selectedMachinery.value.code || '-'} ${selectedMachinery.value.name || ''}`.trim()
    : ''
})
const selectedPlanText = computed(() => {
  return selectedPlan.value
    ? `${selectedPlan.value.code || '-'} ${selectedPlan.value.name || ''}`.trim()
    : ''
})

/** 默认表单数据 */
function getDefaultFormData() {
  return {
    planId: undefined,
    machineryId: undefined,
    checkTime: undefined,
    userId: undefined,
    status: undefined,
    remark: '',
  } as DvCheckRecordFormData
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/checkrecord/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getCheckRecord(currentId.value)
  formData.value = {
    id: data.id,
    planId: data.planId,
    machineryId: data.machineryId,
    checkTime: data.checkTime,
    userId: data.userId,
    status: data.status,
    remark: data.remark || '',
  }
  selectedMachinery.value = {
    id: data.machineryId,
    code: data.machineryCode || '',
    name: data.machineryName || '',
    brand: data.machineryBrand || '',
    specification: data.machinerySpecification || '',
    status: undefined,
  } as DvMachineryVO
  selectedPlan.value = {
    id: data.planId,
    code: data.planCode || '',
    name: data.planName || '',
    type: undefined,
    cycleType: undefined,
    cycleCount: 0,
    status: undefined,
  } as DvCheckPlanVO
  selectedUserName.value = data.nickname || ''
}

/** 初始化页面数据 */
async function initPage() {
  if (!currentId.value) {
    formData.value = getDefaultFormData()
    selectedMachinery.value = undefined
    selectedPlan.value = undefined
    selectedUserName.value = ''
    return
  }
  if (!formData.value.id || formData.value.id !== currentId.value) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开设备选择器 */
function openMachinerySelector() {
  machinerySelectorRef.value?.open()
}

/** 打开方案选择器 */
function openPlanSelector() {
  planSelectorRef.value?.open()
}

/** 确认选择设备 */
function handleMachineryConfirm(item: DvMachineryVO) {
  selectedMachinery.value = item
  formData.value.machineryId = item.id
}

/** 确认选择方案 */
function handlePlanConfirm(item: DvCheckPlanVO) {
  selectedPlan.value = item
  formData.value.planId = item.id
}

/** 确认选择点检人 */
function handleUserConfirm(users: User[]) {
  selectedUserName.value = users[0]?.nickname || ''
}

/** 构造提交数据 */
function buildSubmitData() {
  const data: DvCheckRecordCreateReqVO = {
    planId: formData.value.planId,
    machineryId: formData.value.machineryId,
    checkTime: formData.value.checkTime,
    userId: formData.value.userId,
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
      await updateCheckRecord({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      await createCheckRecord(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:dv:checkrecord:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 提交点检记录 */
async function handleSubmitRecord() {
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
      msg: '确认提交该点检记录？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateCheckRecord({ ...buildSubmitData(), id: currentId.value })
    await submitCheckRecord(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:dv:checkrecord:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})

onShow(() => {
  initPage()
})

watch(currentId, () => {
  initPage()
})
</script>
