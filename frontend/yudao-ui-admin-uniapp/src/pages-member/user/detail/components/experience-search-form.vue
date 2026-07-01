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
          业务类型
        </view>
        <view class="yd-search-form-date-range-picker" @click="pickerVisible.bizType = true">
          {{ getWotPickerDisplay(bizTypeOptions, formData.bizType, { placeholder: '请选择业务类型' }) }}
        </view>
        <wd-picker
          v-model:visible="pickerVisible.bizType"
          :model-value="[formData.bizType]"
          :columns="bizTypeOptions"
          @confirm="({ value }) => formData.bizType = value[0]"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          标题
        </view>
        <wd-input v-model="formData.title" placeholder="请输入标题" clearable />
      </view>
      <yd-search-date-range v-model="formData.createTime" label="创建时间" />
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
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import { getWotPickerDisplay } from '@/utils/wot'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const pickerVisible = ref<Record<string, boolean>>({})
const bizTypeOptions = computed(() => [
  { label: '全部', value: -1 },
  ...getIntDictOptions(DICT_TYPE.MEMBER_EXPERIENCE_BIZ_TYPE),
])
const formData = reactive({
  bizType: -1,
  title: undefined as string | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.bizType !== -1) {
    conditions.push(`业务类型:${getDictLabel(DICT_TYPE.MEMBER_EXPERIENCE_BIZ_TYPE, formData.bizType)}`)
  }
  if (formData.title) {
    conditions.push(`标题:${formData.title}`)
  }
  if (formData.createTime[0] && formData.createTime[1]) {
    conditions.push(`创建:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索成长值记录'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    bizType: formData.bizType === -1 ? undefined : formData.bizType,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.bizType = -1
  formData.title = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
