<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工作站编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入工作站编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工作站名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入工作站名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
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
import type { MdWorkstationQueryParams } from '@/api/mes/md/workstation'
import { computed, reactive, ref } from 'vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{ search: [data: MdWorkstationQueryParams], reset: [] }>()
const visible = ref(false)
const formData = reactive({ code: '', name: '', status: -1 })
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code)
    conditions.push(`编码:${formData.code}`)
  if (formData.name)
    conditions.push(`名称:${formData.name}`)
  if (formData.status !== -1) {
    const label = getIntDictOptions(DICT_TYPE.COMMON_STATUS).find(d => d.value === formData.status)?.label
    conditions.push(`状态:${label || formData.status}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索工作站'
})

function handleSearch() {
  visible.value = false
  const params: MdWorkstationQueryParams = {}
  if (formData.code)
    params.code = formData.code
  if (formData.name)
    params.name = formData.name
  if (formData.status !== -1)
    params.status = formData.status
  emit('search', params)
}

function handleReset() {
  formData.code = ''
  formData.name = ''
  formData.status = -1
  visible.value = false
  emit('reset')
}

function resetFields() {
  formData.code = ''
  formData.name = ''
  formData.status = -1
}

defineExpose({ resetFields })
</script>
