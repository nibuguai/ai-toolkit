<template>
  <wd-form-item
    v-if="label || prop"
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    is-link
    :value="selectedLabel"
    :placeholder="placeholder"
    @click="visible = true"
  />
  <view v-else @click="visible = true">
    <slot>
      <wd-cell is-link :value="selectedLabel" :placeholder="placeholder" />
    </slot>
  </view>

  <wd-select-picker
    v-model="selectedIds"
    v-model:visible="visible"
    :title="placeholder"
    :columns="tagList"
    value-key="id"
    label-key="name"
    type="checkbox"
    filterable
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { MemberTag } from '@/api/member/tag'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleMemberTagList } from '@/api/member/tag'

const props = withDefaults(defineProps<{
  label?: string
  labelWidth?: string
  modelValue?: number[]
  placeholder?: string
  prop?: string
}>(), {
  label: '',
  labelWidth: '180rpx',
  placeholder: '请选择用户标签',
  prop: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const tagList = ref<MemberTag[]>([])
const selectedIds = ref<number[]>([])
const visible = ref(false) // 选择弹窗显示状态

const selectedLabel = computed(() => {
  if (selectedIds.value.length === 0) {
    return ''
  }
  return selectedIds.value.map(id => getTagName(id)).filter(Boolean).join('、')
})

/** 获取标签名称 */
function getTagName(id?: number) {
  if (!id) {
    return ''
  }
  return tagList.value.find(item => item.id === id)?.name || ''
}

/** 选择确认 */
function handleConfirm({ value }: { value: Array<number | string> }) {
  emit('update:modelValue', value.map(Number))
}

watch(
  () => props.modelValue,
  (value) => {
    selectedIds.value = value || []
  },
  { immediate: true },
)

/** 初始化 */
onMounted(async () => {
  tagList.value = await getSimpleMemberTagList()
})

defineExpose({
  getTagName,
})
</script>
