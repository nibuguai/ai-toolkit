<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用户
        </view>
        <UserPicker
          ref="userPickerRef"
          v-model="formData.userId"
          type="radio"
          placeholder="请选择用户"
          use-default-slot
          @confirm="handleUserConfirm"
        >
          <MesSearchSelectorField
            :model-value="selectedUserName"
            placeholder="请选择用户"
            clearable
            @clear="clearUser"
          />
        </UserPicker>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工作站
        </view>
        <MesSearchSelectorField
          :model-value="selectedWorkstationText"
          placeholder="请选择工作站"
          clearable
          @click="openWorkstationSelector"
          @clear="clearWorkstation"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          操作类型
        </view>
        <wd-radio-group v-model="formData.type" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORK_RECORD_TYPE)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          操作时间
        </view>
        <wd-calendar
          v-model="createTimeRange"
          type="daterange"
          placeholder="请选择操作时间范围"
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

  <WorkstationSelector ref="workstationSelectorRef" @confirm="handleWorkstationConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——wd-radio-group 状态/类型筛选改 yd-search-picker（配 dict-kind + all-option）；wd-calendar 日期范围改全局 yd-search-date-range；业务选择器（Selector/MesSearchSelectorField）后续评估收敛为 yd-search-picker
import type { User } from '@/api/system/user'
import type { MdWorkstationVO } from '@/api/mes/md/workstation'
import type { ProWorkRecordLogQueryParams } from '@/api/mes/pro/workrecord'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'
import UserPicker from '@/components/system-select/user-picker.vue'
import MesSearchSelectorField from '@/pages-mes/components/mes-search-selector-field.vue'
import WorkstationSelector from '@/pages-mes/pro/task/components/workstation-selector.vue'

const emit = defineEmits<{
  search: [data: Partial<ProWorkRecordLogQueryParams>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const createTimeRange = ref<[string, string]>() // 操作时间范围
const userPickerRef = ref<InstanceType<typeof UserPicker>>() // 用户选择器
const workstationSelectorRef = ref<InstanceType<typeof WorkstationSelector>>() // 工作站选择器
const selectedUserName = ref('') // 已选用户名称
const selectedWorkstation = ref<MdWorkstationVO>() // 已选工作站
const formData = reactive({
  userId: undefined as number | undefined,
  workstationId: undefined as number | undefined,
  type: undefined as number | undefined,
}) // 搜索表单数据
const selectedWorkstationText = computed(() => {
  return selectedWorkstation.value
    ? `${selectedWorkstation.value.code || '-'} / ${selectedWorkstation.value.name || '-'}`
    : ''
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (selectedUserName.value) {
    conditions.push(`用户:${selectedUserName.value}`)
  }
  if (selectedWorkstation.value) {
    conditions.push(`工作站:${selectedWorkstation.value.code || selectedWorkstation.value.name}`)
  }
  if (formData.type != null) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_PRO_WORK_RECORD_TYPE, formData.type)}`)
  }
  if (createTimeRange.value?.length === 2) {
    conditions.push('操作时间')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索工作记录'
})

/** 打开工作站选择器 */
function openWorkstationSelector() {
  workstationSelectorRef.value?.open(formData.workstationId)
}

/** 选择用户 */
function handleUserConfirm(users: User[]) {
  selectedUserName.value = users[0]?.nickname || ''
}

/** 选择工作站 */
function handleWorkstationConfirm(item: MdWorkstationVO) {
  selectedWorkstation.value = item
  formData.workstationId = item.id
}

/** 清空用户 */
function clearUser() {
  selectedUserName.value = ''
  formData.userId = undefined
}

/** 清空工作站 */
function clearWorkstation() {
  selectedWorkstation.value = undefined
  formData.workstationId = undefined
}

/** 构造搜索参数 */
function buildParams(): Partial<ProWorkRecordLogQueryParams> {
  const params: Partial<ProWorkRecordLogQueryParams> = {}
  if (formData.userId != null) {
    params.userId = formData.userId
  }
  if (formData.workstationId != null) {
    params.workstationId = formData.workstationId
  }
  if (formData.type != null) {
    params.type = formData.type
  }
  const range = formatDateRange(createTimeRange.value)
  if (range) {
    params.createTime = range
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
  formData.userId = undefined
  formData.workstationId = undefined
  formData.type = undefined
  selectedUserName.value = ''
  selectedWorkstation.value = undefined
  createTimeRange.value = undefined
}

/** 重置按钮操作 */
function handleReset() {
  resetFields()
  visible.value = false
  emit('reset')
}

defineExpose({ resetFields })
</script>
