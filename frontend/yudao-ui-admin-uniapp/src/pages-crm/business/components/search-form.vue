<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          商机名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入商机名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          客户名称
        </view>
        <CrmPicker
          v-model="formData.customerId"
          source="customer"
          placeholder="请选择客户名称"
          @confirm="handleCustomerConfirm"
        />
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
import { computed, reactive, ref } from 'vue'
import CrmPicker from '@/pages-crm/components/crm-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Record<string, any>>({
  name: undefined,
  customerId: undefined,
}) // 搜索表单数据
const customerLabel = ref('') // 已选客户名称（占位回显用）
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.customerId) {
    conditions.push(`客户:${customerLabel.value || '已选'}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索商机'
}) // 搜索框占位：回显已选条件

/** 选中客户后记录名称用于回显 */
function handleCustomerConfirm(option?: { name?: string }) {
  customerLabel.value = option?.name || ''
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name,
    customerId: formData.customerId,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.customerId = undefined
  customerLabel.value = ''
  visible.value = false
  emit('reset')
}
</script>
