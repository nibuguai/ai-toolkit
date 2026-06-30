<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工序编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入工序编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工序名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入工序名称" clearable />
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
import type { ProProcessQueryParams } from '@/api/mes/pro/process'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{ search: [data: Partial<ProProcessQueryParams>], reset: [] }>()
const visible = ref(false)
const formData = reactive<Partial<ProProcessQueryParams>>({ code: '', name: '', status: undefined })
const placeholder = computed(() => {
  const c: string[] = []
  if (formData.code) {
    c.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    c.push(`名称:${formData.name}`)
  }
  if (formData.status != null) {
    c.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return c.length > 0 ? c.join(' | ') : '搜索生产工序'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  const p: Partial<ProProcessQueryParams> = {}
  if (formData.code) {
    p.code = formData.code
  }
  if (formData.name) {
    p.name = formData.name
  }
  if (formData.status != null) {
    p.status = formData.status
  }
  emit('search', p)
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.name = ''
  formData.status = undefined
  visible.value = false
  emit('reset')
}

/** 重置搜索字段 */
function resetFields() {
  formData.code = ''
  formData.name = ''
  formData.status = undefined
}

defineExpose({ resetFields })
</script>
