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
    v-model="selectedId"
    v-model:visible="visible"
    :title="placeholder"
    :columns="groupList"
    value-key="id"
    label-key="name"
    type="radio"
    filterable
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { MemberGroup } from '@/api/member/group'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleMemberGroupList } from '@/api/member/group'

const props = withDefaults(defineProps<{
  label?: string
  labelWidth?: string
  modelValue?: number
  placeholder?: string
  prop?: string
}>(), {
  label: '',
  labelWidth: '180rpx',
  placeholder: '请选择用户分组',
  prop: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const groupList = ref<MemberGroup[]>([])
const selectedId = ref<number | string>('')
const visible = ref(false) // 选择弹窗显示状态

const selectedLabel = computed(() => getGroupName(Number(selectedId.value)))

/** 获取分组名称 */
function getGroupName(id?: number) {
  if (!id) {
    return ''
  }
  return groupList.value.find(item => item.id === id)?.name || ''
}

/** 选择确认 */
function handleConfirm({ value }: { value: number | string }) {
  emit('update:modelValue', value ? Number(value) : undefined)
}

watch(
  () => props.modelValue,
  (value) => {
    selectedId.value = value ?? ''
  },
  { immediate: true },
)

/** 初始化 */
onMounted(async () => {
  groupList.value = await getSimpleMemberGroupList()
})

defineExpose({
  getGroupName,
})
</script>
