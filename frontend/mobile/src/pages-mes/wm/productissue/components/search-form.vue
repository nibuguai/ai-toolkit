<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
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
          领料单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入领料单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          领料单名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入领料单名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          领料日期
        </view>
        <wd-calendar v-model="issueDateRange" type="daterange" placeholder="请选择领料日期范围" />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          单据状态
        </view>
        <wd-picker
          v-model="formData.status"
          :columns="statusOptions"
          label-key="label"
          value-key="value"
          placeholder="请选择单据状态"
          clearable
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
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——① wd-picker（工作站）改 yd-search-picker（:columns + all-option）；② wd-calendar 日期范围改全局 yd-search-date-range；③ wd-popup 去掉 transition="fade" :duration="0"
import type { WmProductIssueQueryParams } from '@/api/mes/wm/productissue'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: WmProductIssueQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const issueDateRange = ref<[string, string]>() // 领料日期范围
const statusOptions = getIntDictOptions(DICT_TYPE.MES_WM_PRODUCT_ISSUE_STATUS) // 状态选项
const formData = reactive({
  code: '',
  name: '',
  status: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (issueDateRange.value?.length === 2) {
    conditions.push('领料日期')
  }
  if (formData.status != null) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_WM_PRODUCT_ISSUE_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索生产领料'
})

/** 构造搜索参数 */
function buildParams() {
  const params: WmProductIssueQueryParams = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.name) {
    params.name = formData.name
  }
  if (formData.status != null) {
    params.status = formData.status
  }
  const range = formatDateRange(issueDateRange.value)
  if (range) {
    params.issueDate = range
  }
  return params
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildParams())
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.name = ''
  formData.status = undefined
  issueDateRange.value = undefined
  visible.value = false
  emit('reset')
}
</script>
