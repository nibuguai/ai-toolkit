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
          任务编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入任务编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          任务名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入任务名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          盘点类型
        </view>
        <wd-radio-group v-model="formData.type" type="button">
          <wd-radio :value="undefined">
            全部
          </wd-radio>
          <wd-radio v-for="dict in stockTakingTypeOptions" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          盘点日期
        </view>
        <wd-calendar
          v-model="formData.takingDate"
          type="daterange"
          placeholder="请选择盘点日期"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          单据状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio :value="undefined">
            全部
          </wd-radio>
          <wd-radio v-for="dict in statusOptions" :key="dict.value" :value="dict.value">
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
import type { StockTakingTaskQueryParams } from '@/api/mes/wm/stocktaking/task'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'

interface SearchFormData {
  code?: string
  name?: string
  type?: number
  takingDate?: string[]
  status?: number
}

const emit = defineEmits<{
  search: [data: StockTakingTaskQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<SearchFormData>({
  code: undefined,
  name: undefined,
  type: undefined,
  takingDate: undefined,
  status: undefined,
}) // 搜索表单数据
const stockTakingTypeOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_TYPE))
const statusOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_TASK_STATUS))

const placeholder = computed(() => { // 搜索条件摘要
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.type != null) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_WM_STOCK_TAKING_TYPE, formData.type)}`)
  }
  if (formData.status != null) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_WM_STOCK_TAKING_TASK_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索盘点任务'
})

/** 构造搜索参数 */
function buildSearchParams(): StockTakingTaskQueryParams {
  return {
    pageNo: 1,
    pageSize: 10,
    code: formData.code || undefined,
    name: formData.name || undefined,
    type: formData.type,
    takingDate: formatDateRange(formData.takingDate),
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
  formData.takingDate = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
