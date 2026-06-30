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
          工单编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入工单编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工单名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入工单名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          来源单据
        </view>
        <wd-input v-model="formData.orderSourceCode" placeholder="请输入来源单据编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          需求日期
        </view>
        <wd-calendar v-model="formData.requestDate" type="daterange" placeholder="请选择需求日期范围" />
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
// TODO @YunaiV：搜索风格对齐 system/infra——wd-calendar 日期范围改全局 yd-search-date-range
import type { ProWorkOrderQueryParams } from '@/api/mes/pro/workorder'
import { computed, reactive, ref } from 'vue'
import { formatDateRange } from '@/utils/date'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

interface SearchFormData {
  code?: string
  name?: string
  orderSourceCode?: string
  requestDate?: [number, number]
}

const emit = defineEmits<{
  search: [data: Partial<ProWorkOrderQueryParams>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<SearchFormData>({
  code: undefined,
  name: undefined,
  orderSourceCode: undefined,
  requestDate: undefined,
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.orderSourceCode) {
    conditions.push(`来源:${formData.orderSourceCode}`)
  }
  if (formData.requestDate?.length === 2) {
    conditions.push('需求日期:已选')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索待排产工单'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    orderSourceCode: formData.orderSourceCode || undefined,
    requestDate: formatDateRange(formData.requestDate),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.orderSourceCode = undefined
  formData.requestDate = undefined
  visible.value = false
  emit('reset')
}

defineExpose({ handleReset })
</script>
