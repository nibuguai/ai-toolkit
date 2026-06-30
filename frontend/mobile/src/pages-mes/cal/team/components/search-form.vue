<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

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
          班组编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入班组编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          班组名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入班组名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          班组类型
        </view>
        <wd-radio-group v-model="formData.calendarType" type="button">
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
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
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——wd-radio-group 状态/类型筛选改 yd-search-picker（配 dict-kind + all-option）
import type { CalTeamQueryParams } from '@/api/mes/cal/team'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Partial<CalTeamQueryParams>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Partial<CalTeamQueryParams>>({
  code: '',
  name: '',
  calendarType: undefined,
}) // 搜索表单数据

const placeholder = computed(() => { // 搜索摘要
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.calendarType != null) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_CAL_CALENDAR_TYPE, formData.calendarType)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索班组'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  const params: Partial<CalTeamQueryParams> = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.name) {
    params.name = formData.name
  }
  if (formData.calendarType != null) {
    params.calendarType = formData.calendarType
  }
  emit('search', params)
}

/** 重置按钮操作 */
function handleReset() {
  resetFields()
  visible.value = false
  emit('reset')
}

/** 重置搜索字段 */
function resetFields() {
  formData.code = ''
  formData.name = ''
  formData.calendarType = undefined
}

defineExpose({ resetFields })
</script>
