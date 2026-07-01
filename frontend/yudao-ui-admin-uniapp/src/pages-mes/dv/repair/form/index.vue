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
          <wd-form-item title="维修单编码" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入维修单编码"
              />
              <wd-button v-if="isEditable" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="维修单名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              :disabled="isHeaderReadonly"
              placeholder="请输入维修单名称"
            />
          </wd-form-item>
          <wd-form-item title="设备" title-width="200rpx" prop="machineryId">
            <view
              class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx"
              :class="isHeaderReadonly ? 'opacity-70' : ''"
              @click.stop="openMachinerySelector"
            >
              <text :class="selectedMachineryText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedMachineryText || '请选择设备' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item
            title="报修日期"
            title-width="200rpx"
            prop="requireDate"
            is-link
            placeholder="请选择报修日期"
            :value="formatDateTime(formData.requireDate)"
            @click="openDatePicker('requireDate')"
          />
          <wd-datetime-picker
            v-model="formData.requireDate"
            v-model:visible="pickerVisible.requireDate"
            title="请选择报修日期"
            type="datetime"
          />
          <wd-form-item
            v-if="showFinishFields"
            title="维修完成日期"
            title-width="200rpx"
            prop="finishDate"
            is-link
            placeholder="请选择维修完成日期"
            :value="formatDateTime(formData.finishDate)"
            @click="openDatePicker('finishDate')"
          />
          <wd-datetime-picker
            v-model="formData.finishDate"
            v-model:visible="pickerVisible.finishDate"
            title="请选择维修完成日期"
            type="datetime"
          />
          <wd-form-item v-if="showConfirmFields" title="维修人" title-width="200rpx" prop="acceptedUserId">
            <UserPicker
              v-model="formData.acceptedUserId"
              type="radio"
              placeholder="请选择维修人"
              use-default-slot
              :disabled="true"
              @confirm="handleAcceptedUserConfirm"
            >
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx opacity-70">
                <text :class="acceptedUserName ? 'text-[#333]' : 'text-[#999]'">
                  {{ acceptedUserName || '待系统回填' }}
                </text>
              </view>
            </UserPicker>
          </wd-form-item>
          <wd-form-item v-if="showDetailFields" title="维修结果" title-width="200rpx" prop="result">
            <dict-tag v-if="formData.result != null" :type="DICT_TYPE.MES_DV_REPAIR_RESULT" :value="formData.result" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item
            v-if="showDetailFields"
            title="验收日期"
            title-width="200rpx"
            prop="confirmDate"
            :value="formatDateTime(formData.confirmDate) || '-'"
          />
          <wd-form-item v-if="showDetailFields" title="验收人" title-width="200rpx" prop="confirmUserId">
            <UserPicker
              v-model="formData.confirmUserId"
              type="radio"
              placeholder="请选择验收人"
              use-default-slot
              :disabled="true"
              @confirm="handleConfirmUserConfirm"
            >
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx opacity-70">
                <text :class="confirmUserName ? 'text-[#333]' : 'text-[#999]'">
                  {{ confirmUserName || '待系统回填' }}
                </text>
              </view>
            </UserPicker>
          </wd-form-item>
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_DV_REPAIR_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
              :disabled="isHeaderReadonly"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <RepairLineList v-if="currentId" :repair-id="currentId" :readonly="isHeaderReadonly" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions>
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
        @click="handleSubmitRepair"
      >
        {{ submitLoading ? '提交中...' : '提交' }}
      </view>
      <view
        v-if="isConfirm"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="confirmLoading ? 'opacity-60' : ''"
        @click="handleConfirmRepair"
      >
        {{ confirmLoading ? '提交中...' : '完成维修' }}
      </view>
      <view
        v-if="isFinish"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="finishLoading ? 'opacity-60' : ''"
        @click="handleFinishRepair(MesDvRepairResultEnum.PASS)"
      >
        验收通过
      </view>
      <view
        v-if="isFinish"
        class="flex-1 rounded-8rpx bg-[#faad14] py-20rpx text-center text-white"
        :class="finishLoading ? 'opacity-60' : ''"
        @click="handleFinishRepair(MesDvRepairResultEnum.FAIL)"
      >
        不通过
      </view>
    </MesFooterActions>

    <MachinerySelector ref="machinerySelectorRef" @confirm="handleMachineryConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { User } from '@/api/system/user'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DvMachineryVO } from '@/api/mes/dv/machinery'
import type { DvRepairCreateReqVO } from '@/api/mes/dv/repair'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { confirmRepair, createRepair, finishRepair, getRepair, submitRepair, updateRepair } from '@/api/mes/dv/repair'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesDvRepairResultEnum, MesDvRepairStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import UserPicker from '@/components/system-select/user-picker.vue'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import MachinerySelector from '../../machinery/components/machinery-selector.vue'
import RepairLineList from '../components/repair-line-list.vue'

type RepairFormMode = 'create' | 'update' | 'confirm' | 'finish'

interface DvRepairFormData extends DvRepairCreateReqVO {
  id?: number
  finishDate?: string | number
  confirmDate?: string | number
  result?: number
  acceptedUserId?: number
  confirmUserId?: number
  status?: number
}

const props = defineProps<{
  id?: number | string
  mode?: RepairFormMode
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/dv/repair/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const routeMode = computed(() => getRouteQueryValue('mode') as RepairFormMode | undefined) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const formMode = ref<RepairFormMode>('create') // 当前表单模式
const formData = ref<DvRepairFormData>(getDefaultFormData()) // 表单数据
const getTitle = computed(() => {
  const titles: Record<RepairFormMode, string> = {
    create: '新增维修工单',
    update: '编辑维修工单',
    confirm: '完成维修',
    finish: '验收维修工单',
  }
  return titles[formMode.value]
})
const isEditable = computed(() => formMode.value === 'create' || formMode.value === 'update')
const isConfirm = computed(() => formMode.value === 'confirm')
const isFinish = computed(() => formMode.value === 'finish')
const isHeaderReadonly = computed(() => isConfirm.value || isFinish.value)
const showFinishFields = computed(() => isConfirm.value || isFinish.value || (formData.value.status != null && formData.value.status >= MesDvRepairStatusEnum.CONFIRMED))
const showConfirmFields = computed(() => isConfirm.value || isFinish.value || (formData.value.status != null && formData.value.status >= MesDvRepairStatusEnum.APPROVING))
const showDetailFields = computed(() => isFinish.value || (formData.value.status != null && formData.value.status >= MesDvRepairStatusEnum.FINISHED))
const canSubmit = computed(() => currentId.value && formData.value.status === MesDvRepairStatusEnum.PREPARE && isEditable.value)
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const confirmLoading = ref(false) // 完成维修状态
const finishLoading = ref(false) // 验收状态
const codeLoading = ref(false) // 编码生成状态
const formSchema = createFormSchema({
  code: [{ required: true, message: '维修单编码不能为空' }],
  name: [{ required: true, message: '维修单名称不能为空' }],
  machineryId: [{ required: true, message: '设备不能为空' }],
  requireDate: [{ required: true, message: '报修日期不能为空' }],
  finishDate: [{ required: () => isConfirm.value, message: '维修完成日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const machinerySelectorRef = ref<InstanceType<typeof MachinerySelector>>() // 设备选择器引用
const selectedMachinery = ref<DvMachineryVO>() // 当前选择设备
const acceptedUserName = ref('') // 维修人名称
const confirmUserName = ref('') // 验收人名称
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const selectedMachineryText = computed(() => {
  return selectedMachinery.value
    ? `${selectedMachinery.value.code || '-'} ${selectedMachinery.value.name || ''}`.trim()
    : ''
})

/** 默认表单数据 */
function getDefaultFormData() {
  return {
    code: '',
    name: '',
    machineryId: undefined,
    requireDate: undefined,
    finishDate: undefined,
    confirmDate: undefined,
    result: undefined,
    acceptedUserId: undefined,
    confirmUserId: undefined,
    status: undefined,
    remark: '',
  } as DvRepairFormData
}

/** 刷新当前路由参数 */
function refreshRouteState() {
  currentId.value = routeId.value
  const routeModeValue = routeMode.value
  if (routeModeValue === 'confirm' || routeModeValue === 'finish') {
    formMode.value = routeModeValue
    return
  }
  formMode.value = currentId.value ? 'update' : 'create'
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/repair/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getRepair(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name,
    machineryId: data.machineryId,
    requireDate: data.requireDate,
    finishDate: data.finishDate,
    confirmDate: data.confirmDate,
    result: data.result,
    acceptedUserId: data.acceptedUserId,
    confirmUserId: data.confirmUserId,
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
  acceptedUserName.value = data.acceptedUserNickname || ''
  confirmUserName.value = data.confirmUserNickname || ''
}

/** 初始化页面数据 */
async function initPage() {
  const oldId = currentId.value
  refreshRouteState()
  if (!currentId.value) {
    formData.value = getDefaultFormData()
    selectedMachinery.value = undefined
    acceptedUserName.value = ''
    confirmUserName.value = ''
    return
  }
  if (oldId !== currentId.value || !formData.value.id) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开日期选择 */
function openDatePicker(key: 'requireDate' | 'finishDate') {
  if ((key === 'requireDate' && isHeaderReadonly.value) || (key === 'finishDate' && !isConfirm.value)) {
    return
  }
  pickerVisible.value[key] = true
}

/** 打开设备选择器 */
function openMachinerySelector() {
  if (isHeaderReadonly.value) {
    return
  }
  machinerySelectorRef.value?.open()
}

/** 确认选择设备 */
function handleMachineryConfirm(item: DvMachineryVO) {
  selectedMachinery.value = item
  formData.value.machineryId = item.id
}

/** 确认维修人 */
function handleAcceptedUserConfirm(users: User[]) {
  acceptedUserName.value = users[0]?.nickname || ''
}

/** 确认验收人 */
function handleConfirmUserConfirm(users: User[]) {
  confirmUserName.value = users[0]?.nickname || ''
}

/** 生成维修单编码 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.DV_REPAIR_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData() {
  const data: DvRepairCreateReqVO = {
    code: formData.value.code,
    name: formData.value.name,
    machineryId: formData.value.machineryId,
    requireDate: formData.value.requireDate,
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
      await updateRepair({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      await createRepair(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:dv:repair:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 提交维修工单 */
async function handleSubmitRepair() {
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
      msg: '确认提交该维修工单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateRepair({ ...buildSubmitData(), id: currentId.value })
    await submitRepair(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:dv:repair:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 确认维修完成 */
async function handleConfirmRepair() {
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
      msg: '确认完成维修？完成后将进入待验收状态。',
    })
  } catch {
    return
  }
  confirmLoading.value = true
  try {
    await confirmRepair({
      id: currentId.value,
      finishDate: formData.value.finishDate,
    })
    toast.success('操作成功')
    uni.$emit('mes:dv:repair:reload')
    delay(handleBack)
  } finally {
    confirmLoading.value = false
  }
}

/** 完成验收 */
async function handleFinishRepair(result: number) {
  if (!currentId.value || finishLoading.value) {
    return
  }
  const label = result === MesDvRepairResultEnum.PASS ? '通过' : '不通过'
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认验收${label}该维修工单？`,
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishRepair(currentId.value, result)
    toast.success(`验收${label}`)
    uni.$emit('mes:dv:repair:reload')
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
