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
          分类名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入分类名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
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
import type { MdItemTypeQueryParams } from '@/api/mes/md/item/type'
import { computed, reactive, ref } from 'vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: MdItemTypeQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  name: '',
  status: -1,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`分类名称:${formData.name}`)
  }
  if (formData.status !== -1) {
    const label = getIntDictOptions(DICT_TYPE.COMMON_STATUS).find(d => d.value === formData.status)?.label
    conditions.push(`状态:${label || formData.status}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索物料产品分类'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  const params: MdItemTypeQueryParams = {}
  if (formData.name)
    params.name = formData.name
  if (formData.status !== -1)
    params.status = formData.status
  emit('search', params)
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = ''
  formData.status = -1
  visible.value = false
  emit('reset')
}

/** 供外部调用重置 */
function resetFields() {
  formData.name = ''
  formData.status = -1
}

defineExpose({ resetFields })
</script>
