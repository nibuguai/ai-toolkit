<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          库区编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入库区编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          库区名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入库区名称" clearable />
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
import type { WmWarehouseLocationQueryParams } from '@/api/mes/wm/warehouse/location'
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: WmWarehouseLocationQueryParams]
  reset: []
}>()
const visible = ref(false)
const formData = reactive({ code: '', name: '' })
const placeholder = computed(() => {
  const c: string[] = []
  if (formData.code)
    c.push(`编码:${formData.code}`)
  if (formData.name)
    c.push(`名称:${formData.name}`)
  return c.length > 0 ? c.join(' | ') : '搜索库区'
})
function handleSearch() {
  visible.value = false
  const p: WmWarehouseLocationQueryParams = {}
  if (formData.code)
    p.code = formData.code
  if (formData.name)
    p.name = formData.name
  emit('search', p)
}
function handleReset() {
  formData.code = ''
  formData.name = ''
  visible.value = false
  emit('reset')
}
function resetFields() {
  formData.code = ''
  formData.name = ''
}
defineExpose({ resetFields })
</script>
