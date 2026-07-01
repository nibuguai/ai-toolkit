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
    :columns="pickerColumns"
    value-key="id"
    label-key="name"
    type="radio"
    filterable
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { MemberLevel } from '@/api/member/level'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleMemberLevelList } from '@/api/member/level'

const props = withDefaults(defineProps<{
  label?: string
  labelWidth?: string
  modelValue?: number
  placeholder?: string
  prop?: string
  clearable?: boolean
}>(), {
  label: '',
  labelWidth: '180rpx',
  placeholder: '请选择用户等级',
  prop: '',
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const levelList = ref<MemberLevel[]>([])
const selectedId = ref<number | string>('')
const visible = ref(false) // 选择弹窗显示状态

const selectedLabel = computed(() => getLevelName(Number(selectedId.value)))
const pickerColumns = computed(() => { // 等级选项；可清空时插入“无（取消等级）”项，对齐 PC el-select clearable
  return props.clearable ? [{ id: 0, name: '无（取消等级）' }, ...levelList.value] : levelList.value
})

/** 获取等级名称 */
function getLevelName(id?: number) {
  if (!id) {
    return ''
  }
  return levelList.value.find(item => item.id === id)?.name || ''
}

/** 选择确认 */
function handleConfirm({ value }: { value: number | string }) {
  const id = Number(value) // 部分端会把哨兵「无」回传成字符串 "0"，统一转数值后用 > 0 判定，避免误提交 levelId=0
  emit('update:modelValue', id > 0 ? id : undefined)
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
  levelList.value = await getSimpleMemberLevelList()
})

defineExpose({
  getLevelName,
})
</script>
