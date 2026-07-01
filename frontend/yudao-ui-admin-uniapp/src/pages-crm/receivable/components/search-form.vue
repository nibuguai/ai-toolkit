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
          客户名称
        </view>
        <CrmPicker v-model="formData.customerId" source="customer" placeholder="请选择客户名称" @confirm="handleCustomerConfirm" />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          回款编号
        </view>
        <wd-input v-model="formData.no" placeholder="请输入回款编号" clearable />
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
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import CrmPicker from '@/pages-crm/components/crm-picker.vue'

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Record<string, any>>({
  customerId: undefined,
  no: undefined,
}) // 搜索表单数据
const customerLabel = ref('') // 已选客户名称（占位回显用）
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.customerId) {
    conditions.push(`客户:${customerLabel.value || '已选'}`)
  }
  if (formData.no) {
    conditions.push(`编号:${formData.no}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索回款'
}) // 搜索框占位：回显已选条件

/** 选中客户后记录名称用于回显 */
function handleCustomerConfirm(option?: { name?: string }) {
  customerLabel.value = option?.name || ''
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    customerId: formData.customerId,
    no: formData.no,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.customerId = undefined
  formData.no = undefined
  customerLabel.value = ''
  visible.value = false
  emit('reset')
}
</script>
