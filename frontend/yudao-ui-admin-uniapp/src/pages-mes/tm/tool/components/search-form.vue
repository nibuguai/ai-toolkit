<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工具编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入工具编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工具名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入工具名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          品牌
        </view>
        <wd-input v-model="formData.brand" placeholder="请输入品牌" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          型号规格
        </view>
        <wd-input v-model="formData.specification" placeholder="请输入型号规格" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_TM_TOOL_STATUS)" :key="dict.value" :value="dict.value">
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
import type { TmToolQueryParams } from '@/api/mes/tm/tool'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{ search: [data: TmToolQueryParams], reset: [] }>()
const visible = ref(false)
const formData = reactive<TmToolQueryParams>({ code: '', name: '', brand: '', specification: '', status: undefined })
const placeholder = computed(() => {
  const c: string[] = []
  if (formData.code) {
    c.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    c.push(`名称:${formData.name}`)
  }
  if (formData.brand) {
    c.push(`品牌:${formData.brand}`)
  }
  if (formData.specification) {
    c.push(`规格:${formData.specification}`)
  }
  if (formData.status != null) {
    c.push(`状态:${getDictLabel(DICT_TYPE.MES_TM_TOOL_STATUS, formData.status)}`)
  }
  return c.length > 0 ? c.join(' | ') : '搜索工具'
})

function handleSearch() {
  visible.value = false
  const p: TmToolQueryParams = {}
  if (formData.code) {
    p.code = formData.code
  }
  if (formData.name) {
    p.name = formData.name
  }
  if (formData.brand) {
    p.brand = formData.brand
  }
  if (formData.specification) {
    p.specification = formData.specification
  }
  if (formData.status != null) {
    p.status = formData.status
  }
  emit('search', p)
}

function handleReset() {
  formData.code = ''
  formData.name = ''
  formData.brand = ''
  formData.specification = ''
  formData.status = undefined
  visible.value = false
  emit('reset')
}

function resetFields() {
  formData.code = ''
  formData.name = ''
  formData.brand = ''
  formData.specification = ''
  formData.status = undefined
}

defineExpose({ resetFields })
</script>
