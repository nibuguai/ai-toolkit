<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          仓库编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入仓库编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          仓库名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入仓库名称" clearable />
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
import type { WmWarehouseQueryParams } from '@/api/mes/wm/warehouse'
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: WmWarehouseQueryParams]
  reset: []
}>()
const visible = ref(false)
const formData = reactive({ code: '', name: '' })
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索仓库'
})

function handleSearch() {
  visible.value = false
  const params: WmWarehouseQueryParams = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.name) {
    params.name = formData.name
  }
  emit('search', params)
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
