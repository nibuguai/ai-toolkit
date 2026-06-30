<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          供应商编码
        </view><wd-input v-model="formData.code" placeholder="请输入供应商编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          供应商名称
        </view><wd-input v-model="formData.name" placeholder="请输入供应商名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          供应商简称
        </view><wd-input v-model="formData.nickname" placeholder="请输入供应商简称" clearable />
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
import type { MdVendorQueryParams } from '@/api/mes/md/vendor'
import { computed, reactive, ref } from 'vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{ search: [data: MdVendorQueryParams], reset: [] }>()
const visible = ref(false)
const formData = reactive({ code: '', name: '', nickname: '', status: -1 })
const placeholder = computed(() => {
  const c: string[] = []
  if (formData.code)
    c.push(`编码:${formData.code}`)
  if (formData.name)
    c.push(`名称:${formData.name}`)
  if (formData.nickname)
    c.push(`简称:${formData.nickname}`)
  if (formData.status !== -1)
    c.push(`状态:${getIntDictOptions(DICT_TYPE.COMMON_STATUS).find(d => d.value === formData.status)?.label || formData.status}`)
  return c.length > 0 ? c.join(' | ') : '搜索供应商'
})
function handleSearch() {
  visible.value = false
  const p: MdVendorQueryParams = {}
  if (formData.code)
    p.code = formData.code
  if (formData.name)
    p.name = formData.name
  if (formData.nickname)
    p.nickname = formData.nickname
  if (formData.status !== -1)
    p.status = formData.status
  emit('search', p)
}
function handleReset() {
  formData.code = ''
  formData.name = ''
  formData.nickname = ''
  formData.status = -1
  visible.value = false
  emit('reset')
}
function resetFields() {
  formData.code = ''
  formData.name = ''
  formData.nickname = ''
  formData.status = -1
}
defineExpose({ resetFields })
</script>
