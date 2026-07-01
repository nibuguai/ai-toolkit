<template>
  <!-- 搜索框入口 -->
  <view class="bg-white px-24rpx py-16rpx" @click="openSearch">
    <view class="flex items-center rounded-36rpx bg-[#f5f5f5] px-24rpx py-14rpx text-28rpx text-[#999]">
      <wd-icon name="search" size="32rpx" />
      <text class="ml-12rpx min-w-0 flex-1 truncate">
        {{ placeholder }}
      </text>
    </view>
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
          项目编码
        </view>
        <wd-input
          v-model="formData.code"
          placeholder="请输入项目编码"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          项目名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入项目名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          项目类型
        </view>
        <wd-radio-group v-model="formData.type" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_SUBJECT_TYPE)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :value="dict.value">
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
import type { DvSubjectQueryParams } from '@/api/mes/dv/subject'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: DvSubjectQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<DvSubjectQueryParams>({
  code: '',
  name: '',
  type: undefined,
  status: undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`项目编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`项目名称:${formData.name}`)
  }
  if (formData.type != null) {
    conditions.push(`项目类型:${getDictLabel(DICT_TYPE.MES_DV_SUBJECT_TYPE, formData.type)}`)
  }
  if (formData.status != null) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索点检项目'
})

/** 打开搜索弹窗 */
function openSearch() {
  visible.value = true
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  const params: DvSubjectQueryParams = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.name) {
    params.name = formData.name
  }
  if (formData.type != null) {
    params.type = formData.type
  }
  if (formData.status != null) {
    params.status = formData.status
  }
  emit('search', params)
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.name = ''
  formData.type = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
