<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          类型编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入类型编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          类型名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入类型名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          保养维护类型
        </view>
        <wd-radio-group v-model="formData.maintenType" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_TM_MAINTEN_TYPE)" :key="dict.value" :value="dict.value">
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
import type { TmToolTypeQueryParams } from '@/api/mes/tm/tool/type'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{ search: [data: TmToolTypeQueryParams], reset: [] }>()
const visible = ref(false)
const formData = reactive<TmToolTypeQueryParams>({ code: '', name: '', maintenType: undefined })
const placeholder = computed(() => {
  const c: string[] = []
  if (formData.code) {
    c.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    c.push(`名称:${formData.name}`)
  }
  if (formData.maintenType != null) {
    c.push(`保养:${getDictLabel(DICT_TYPE.MES_TM_MAINTEN_TYPE, formData.maintenType)}`)
  }
  return c.length > 0 ? c.join(' | ') : '搜索工具类型'
})

function handleSearch() {
  visible.value = false
  const p: TmToolTypeQueryParams = {}
  if (formData.code) {
    p.code = formData.code
  }
  if (formData.name) {
    p.name = formData.name
  }
  if (formData.maintenType != null) {
    p.maintenType = formData.maintenType
  }
  emit('search', p)
}

function handleReset() {
  formData.code = ''
  formData.name = ''
  formData.maintenType = undefined
  visible.value = false
  emit('reset')
}

function resetFields() {
  formData.code = ''
  formData.name = ''
  formData.maintenType = undefined
}

defineExpose({ resetFields })
</script>
