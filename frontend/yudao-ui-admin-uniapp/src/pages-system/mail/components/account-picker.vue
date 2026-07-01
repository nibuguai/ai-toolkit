<template>
  <!-- 邮箱账号选择器：自加载账号列表 -->
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :prop="prop"
    :columns="list"
    label-key="mail"
    value-key="id"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { MailAccount } from '@/api/system/mail/account'
import { onMounted, ref } from 'vue'
import { getSimpleMailAccountList } from '@/api/system/mail/account'

withDefaults(defineProps<{
  modelValue?: number // 选中的账号编号
  label?: string // 字段标题
  prop?: string // wd-form 校验字段名
}>(), {
  label: '邮箱账号',
  prop: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'change': [value: number]
}>()

const list = ref<MailAccount[]>([]) // 邮箱账号列表

/** 选中账号（同步 v-model + 抛 change） */
function handleConfirm(value: number) {
  emit('update:modelValue', value)
  emit('change', value)
}

/** 初始化：加载账号列表 */
onMounted(async () => {
  list.value = await getSimpleMailAccountList()
})
</script>
