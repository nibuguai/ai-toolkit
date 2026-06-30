<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <!-- TODO @YunaiV：本 wd-popup 去掉 transition="fade" :duration="0"，对齐 system/infra（基线不带这俩属性） -->
  <wd-popup
    v-model="visible"
    position="top"
    transition="fade"
    :duration="0"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          保养计划
        </view>
        <MesSearchSelectorField
          :model-value="selectedPlanText"
          placeholder="请选择保养计划"
          clearable
          @click="openPlanSelector"
          @clear="clearPlan"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          设备
        </view>
        <MesSearchSelectorField
          :model-value="selectedMachineryText"
          placeholder="请选择设备"
          clearable
          @click="openMachinerySelector"
          @clear="clearMachinery"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          保养人
        </view>
        <UserPicker
          ref="userPickerRef"
          v-model="formData.userId"
          type="radio"
          placeholder="请选择保养人"
          use-default-slot
          @confirm="handleUserConfirm"
        >
          <MesSearchSelectorField
            :model-value="selectedUserName"
            placeholder="请选择保养人"
            clearable
            @clear="clearUser"
          />
        </UserPicker>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          保养时间
        </view>
        <wd-calendar
          v-model="maintenTimeRange"
          type="daterange"
          placeholder="请选择保养时间范围"
        />
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>

  <CheckPlanSelector
    ref="planSelectorRef"
    title="选择保养计划"
    :type="MesDvSubjectTypeEnum.MAINTENANCE"
    @confirm="handlePlanConfirm"
  />
  <MachinerySelector ref="machinerySelectorRef" @confirm="handleMachineryConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——wd-calendar 日期范围改全局 yd-search-date-range；业务选择器（Selector/MesSearchSelectorField）后续评估收敛为 yd-search-picker
import type { User } from '@/api/system/user'
import type { DvCheckPlanVO } from '@/api/mes/dv/checkplan'
import type { DvMachineryVO } from '@/api/mes/dv/machinery'
import type { DvMaintenRecordQueryParams } from '@/api/mes/dv/maintenrecord'
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { MesDvSubjectTypeEnum } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'
import UserPicker from '@/components/system-select/user-picker.vue'
import MesSearchSelectorField from '@/pages-mes/components/mes-search-selector-field.vue'
import CheckPlanSelector from '../../checkplan/components/checkplan-selector.vue'
import MachinerySelector from '../../machinery/components/machinery-selector.vue'

const emit = defineEmits<{
  search: [data: DvMaintenRecordQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const userPickerRef = ref<InstanceType<typeof UserPicker>>() // 用户选择器
const planSelectorRef = ref<InstanceType<typeof CheckPlanSelector>>() // 保养计划选择器
const machinerySelectorRef = ref<InstanceType<typeof MachinerySelector>>() // 设备选择器
const selectedPlan = ref<DvCheckPlanVO>() // 已选计划
const selectedMachinery = ref<DvMachineryVO>() // 已选设备
const selectedUserName = ref('') // 已选保养人名称
const maintenTimeRange = ref<[string, string]>() // 保养时间范围
const formData = reactive({
  planId: undefined as number | undefined,
  machineryId: undefined as number | undefined,
  userId: undefined as number | undefined,
}) // 搜索表单数据
const selectedPlanText = computed(() => {
  return selectedPlan.value
    ? `${selectedPlan.value.code || '-'} / ${selectedPlan.value.name || '-'}`
    : ''
})
const selectedMachineryText = computed(() => {
  return selectedMachinery.value
    ? `${selectedMachinery.value.code || '-'} / ${selectedMachinery.value.name || '-'}`
    : ''
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (selectedPlan.value) {
    conditions.push(`计划:${selectedPlan.value.code || selectedPlan.value.name}`)
  }
  if (selectedMachinery.value) {
    conditions.push(`设备:${selectedMachinery.value.code || selectedMachinery.value.name}`)
  }
  if (selectedUserName.value) {
    conditions.push(`保养人:${selectedUserName.value}`)
  }
  if (maintenTimeRange.value?.length === 2) {
    conditions.push('保养时间')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索保养记录'
})

/** 打开计划选择器 */
function openPlanSelector() {
  planSelectorRef.value?.open()
}

/** 打开设备选择器 */
function openMachinerySelector() {
  machinerySelectorRef.value?.open()
}

/** 选择计划 */
function handlePlanConfirm(item: DvCheckPlanVO) {
  selectedPlan.value = item
  formData.planId = item.id
}

/** 选择设备 */
function handleMachineryConfirm(item: DvMachineryVO) {
  selectedMachinery.value = item
  formData.machineryId = item.id
}

/** 选择保养人 */
function handleUserConfirm(users: User[]) {
  selectedUserName.value = users[0]?.nickname || ''
}

/** 清空计划 */
function clearPlan() {
  selectedPlan.value = undefined
  formData.planId = undefined
}

/** 清空设备 */
function clearMachinery() {
  selectedMachinery.value = undefined
  formData.machineryId = undefined
}

/** 清空保养人 */
function clearUser() {
  selectedUserName.value = ''
  formData.userId = undefined
}

/** 构造搜索参数 */
function buildParams() {
  const params: DvMaintenRecordQueryParams = {}
  if (formData.planId != null) {
    params.planId = formData.planId
  }
  if (formData.machineryId != null) {
    params.machineryId = formData.machineryId
  }
  if (formData.userId != null) {
    params.userId = formData.userId
  }
  const range = formatDateRange(maintenTimeRange.value)
  if (range) {
    params.maintenTime = range
  }
  return params
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildParams())
}

/** 重置字段 */
function resetFields() {
  formData.planId = undefined
  formData.machineryId = undefined
  formData.userId = undefined
  selectedPlan.value = undefined
  selectedMachinery.value = undefined
  selectedUserName.value = ''
  maintenTimeRange.value = undefined
}

/** 重置按钮操作 */
function handleReset() {
  resetFields()
  visible.value = false
  emit('reset')
}

defineExpose({ resetFields })
</script>
