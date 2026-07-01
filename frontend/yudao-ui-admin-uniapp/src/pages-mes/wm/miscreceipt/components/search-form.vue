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
          入库单编号
        </view>
        <wd-input
          v-model="formData.code"
          placeholder="请输入入库单编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          入库单名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入入库单名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          杂项类型
        </view>
        <wd-radio-group v-model="formData.type" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_MISC_RECEIPT_TYPE)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          来源单据类型
        </view>
        <wd-input
          v-model="formData.sourceDocType"
          placeholder="请输入来源单据类型"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          来源单据编号
        </view>
        <wd-input
          v-model="formData.sourceDocCode"
          placeholder="请输入来源单据编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          入库日期
        </view>
        <wd-calendar
          v-model="formData.receiptDate"
          type="daterange"
          placeholder="请选择入库日期"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          单据状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_MISC_RECEIPT_STATUS)" :key="dict.value" :value="dict.value">
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
// TODO @YunaiV：搜索风格对齐 system/infra——① wd-radio-group 类型/状态筛选改 yd-search-picker（type/status，配 dict-kind + all-option）；② wd-calendar 日期范围改全局 yd-search-date-range
import type { WmMiscReceiptQueryParams } from '@/api/mes/wm/miscreceipt'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'

interface SearchFormData {
  code?: string
  name?: string
  type?: number
  sourceDocType?: string
  sourceDocCode?: string
  receiptDate?: string[]
  status?: number
}

const emit = defineEmits<{
  search: [data: WmMiscReceiptQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<SearchFormData>({
  code: undefined,
  name: undefined,
  type: undefined,
  sourceDocType: undefined,
  sourceDocCode: undefined,
  receiptDate: undefined,
  status: undefined,
}) // 搜索表单数据

const placeholder = computed(() => { // 搜索条件摘要
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.type != null) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_WM_MISC_RECEIPT_TYPE, formData.type)}`)
  }
  if (formData.sourceDocType) {
    conditions.push(`来源单据类型:${formData.sourceDocType}`)
  }
  if (formData.sourceDocCode) {
    conditions.push(`来源单据编号:${formData.sourceDocCode}`)
  }
  if (formData.status != null) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_WM_MISC_RECEIPT_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索其他入库'
})

/** 构造搜索参数 */
function buildSearchParams(): WmMiscReceiptQueryParams {
  return {
    pageNo: 1,
    pageSize: 10,
    code: formData.code || undefined,
    name: formData.name || undefined,
    type: formData.type,
    sourceDocType: formData.sourceDocType || undefined,
    sourceDocCode: formData.sourceDocCode || undefined,
    receiptDate: formatDateRange(formData.receiptDate),
    status: formData.status,
  }
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildSearchParams())
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.type = undefined
  formData.sourceDocType = undefined
  formData.sourceDocCode = undefined
  formData.receiptDate = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
