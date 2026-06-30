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
          发起人
        </view>
        <UserPicker v-model="formData.userId" type="radio" placeholder="请选择发起人" use-default-slot @confirm="handleUserConfirm">
          <MesSearchSelectorField
            :model-value="selectedUserName"
            placeholder="请选择发起人"
            clearable
            @clear="clearUser"
          />
        </UserPicker>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          处置人
        </view>
        <UserPicker v-model="formData.handlerUserId" type="radio" placeholder="请选择处置人" use-default-slot @confirm="handleHandlerConfirm">
          <MesSearchSelectorField
            :model-value="selectedHandlerName"
            placeholder="请选择处置人"
            clearable
            @clear="clearHandler"
          />
        </UserPicker>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          处置状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_ANDON_STATUS)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          发起时间
        </view>
        <wd-calendar v-model="createTimeRange" type="daterange" placeholder="请选择发起时间范围" />
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
import type { ProAndonRecordQueryParams } from '@/api/mes/pro/andon/record'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'
import UserPicker from '@/components/system-select/user-picker.vue'
import MesSearchSelectorField from '@/pages-mes/components/mes-search-selector-field.vue'
import WorkstationSelector from '@/pages-mes/pro/task/components/workstation-selector.vue'

const emit = defineEmits<{
  search: [data: Partial<ProAndonRecordQueryParams>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const createTimeRange = ref<[string, string]>() // 发起时间范围
const workstationSelectorRef = ref<InstanceType<typeof WorkstationSelector>>() // 工作站选择器
const selectedWorkstation = ref<MdWorkstationVO>() // 已选工作站
const selectedUserName = ref('') // 已选发起人
const selectedHandlerName = ref('') // 已选处置人
const formData = reactive({
  workstationId: undefined as number | undefined,
  userId: undefined as number | undefined,
  handlerUserId: undefined as number | undefined,
  status: undefined as number | undefined,
}) // 搜索表单数据
const selectedWorkstationText = computed(() => {
  return selectedWorkstation.value
    ? `${selectedWorkstation.value.code || '-'} / ${selectedWorkstation.value.name || '-'}`
    : ''
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (selectedWorkstation.value) {
    conditions.push(`工作站:${selectedWorkstation.value.code || selectedWorkstation.value.name}`)
  }
  if (selectedUserName.value) {
    conditions.push(`发起人:${selectedUserName.value}`)
  }
  if (selectedHandlerName.value) {
    conditions.push(`处置人:${selectedHandlerName.value}`)
  }
  if (formData.status != null) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_PRO_ANDON_STATUS, formData.status)}`)
  }
  if (createTimeRange.value?.length === 2) {
    conditions.push('发起时间')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索安灯呼叫记录'
})

/** 打开工作站选择器 */
function openWorkstationSelector() {
  workstationSelectorRef.value?.open(formData.workstationId)
}

/** 选择工作站 */
function handleWorkstationConfirm(item: MdWorkstationVO) {
  selectedWorkstation.value = item
  formData.workstationId = item.id
}

/** 选择发起人 */
function handleUserConfirm(users: User[]) {
  selectedUserName.value = users[0]?.nickname || ''
}

/** 选择处置人 */
function handleHandlerConfirm(users: User[]) {
  selectedHandlerName.value = users[0]?.nickname || ''
}

/** 清空工作站 */
function clearWorkstation() {
  selectedWorkstation.value = undefined
  formData.workstationId = undefined
}

/** 清空发起人 */
function clearUser() {
  selectedUserName.value = ''
  formData.userId = undefined
}

/** 清空处置人 */
function clearHandler() {
  selectedHandlerName.value = ''
  formData.handlerUserId = undefined
}

/** 构造搜索参数 */
function buildParams(): Partial<ProAndonRecordQueryParams> {
  const params: Partial<ProAndonRecordQueryParams> = {}
  if (formData.workstationId != null) {
    params.workstationId = formData.workstationId
  }
  if (formData.userId != null) {
    params.userId = formData.userId
  }
  if (formData.handlerUserId != null) {
    params.handlerUserId = formData.handlerUserId
  }
  if (formData.status != null) {
    params.status = formData.status
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
  formData.workstationId = undefined
  formData.userId = undefined
  formData.handlerUserId = undefined
  formData.status = undefined
  createTimeRange.value = undefined
  selectedWorkstation.value = undefined
  selectedUserName.value = ''
  selectedHandlerName.value = ''
}

/** 重置按钮操作 */
function handleReset() {
  resetFields()
  visible.value = false
  emit('reset')
}

defineExpose({ resetFields })
</script>
