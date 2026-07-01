<template>
  <!-- 短信渠道选择器：自加载渠道列表 -->
  <yd-form-picker
    :model-value="modelValue"
    :label="label"
    :prop="prop"
    :columns="list"
    label-key="signature"
    value-key="id"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { SmsChannel } from '@/api/system/sms/channel'
import { onMounted, ref } from 'vue'
import { getSimpleSmsChannelList } from '@/api/system/sms/channel'

withDefaults(defineProps<{
  modelValue?: number // 选中的渠道编号
  label?: string // 字段标题
  prop?: string // wd-form 校验字段名
}>(), {
  label: '短信渠道',
  prop: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'change': [value: number]
}>()

const list = ref<SmsChannel[]>([]) // 短信渠道列表

/** 选中渠道（同步 v-model + 抛 change） */
function handleConfirm(value: number) {
  emit('update:modelValue', value)
  emit('change', value)
}

/** 初始化：加载渠道列表 */
onMounted(async () => {
  list.value = await getSimpleSmsChannelList()
})
</script>
