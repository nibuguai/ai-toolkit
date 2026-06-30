<!-- 支付应用选择器：自加载应用列表的下拉选择 -->
<template>
  <yd-search-picker
    :model-value="modelValue"
    label="支付应用"
    :columns="appList"
    label-key="name"
    value-key="id"
    all-option
    :all-value="0"
    placeholder="请选择支付应用"
    @update:model-value="handleChange"
  />
</template>

<script lang="ts" setup>
import type { PayApp } from '@/api/pay/app'
import { onMounted, ref } from 'vue'
import { getPayAppList } from '@/api/pay/app'

const props = defineProps<{
  modelValue?: number | string // 选中的应用编号（0 表示全部）
}>()
const emit = defineEmits<{
  'update:modelValue': [value: number | string]
  'change': [name: string] // 选中应用名（搜索 placeholder 用），全部时为空串
}>()

const appList = ref<PayApp[]>([]) // 应用选项

onMounted(async () => {
  appList.value = await getPayAppList().catch(() => [])
})

/** 选中应用编号变化：同步 v-model + 抛出应用名 */
function handleChange(value: number | string) {
  emit('update:modelValue', value)
  const name = Number(value) > 0 ? appList.value.find(item => item.id === Number(value))?.name || '' : ''
  emit('change', name)
}
</script>
