<!-- ERP 通用单选选择器：按 source 加载 ERP 基础资料选项，支持表单项 / 单元格 / 自定义插槽三种展示形态 -->
<template>
  <view v-if="useDefaultSlot" @click="handleOpen">
    <slot />
  </view>
  <wd-form-item
    v-else-if="formItem || label || prop"
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    is-link
    :value="selectedLabel"
    :placeholder="placeholder"
    @click="handleOpen"
  />
  <wd-cell
    v-else
    is-link
    :value="selectedLabel"
    :placeholder="placeholder"
    @click="handleOpen"
  />

  <wd-select-picker
    v-model="selectedId"
    v-model:visible="visible"
    :title="label || placeholder"
    :columns="options"
    value-key="id"
    label-key="name"
    type="radio"
    filterable
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import type { ErpOptionKey } from '@/pages-erp/config/options'
import { computed, onMounted, ref, watch } from 'vue'
import { erpOptionLoaders } from '@/pages-erp/config/options'
import { normalizeOptions } from '@/pages-erp/utils/erp'

interface ErpPickerOption {
  id: number | string
  name: string
  raw?: Record<string, any>
}

const props = withDefaults(defineProps<{
  labelWidth?: string
  modelValue?: number | string
  source: ErpOptionKey
  label?: string
  placeholder?: string
  prop?: string
  formItem?: boolean
  disabled?: boolean
  useDefaultSlot?: boolean
  optionFilter?: (raw: Record<string, any>) => boolean
}>(), {
  labelWidth: '200rpx',
  label: '',
  placeholder: '请选择',
  prop: '',
  formItem: false,
  disabled: false,
  useDefaultSlot: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | string | undefined): void
  (e: 'confirm', option?: ErpPickerOption): void
}>()

const options = ref<ErpPickerOption[]>([]) // 选择器数据
const selectedId = ref<number | string>(props.modelValue ?? '')
const visible = ref(false) // 选择器显示状态
const loading = ref(false) // 数据加载状态

const selectedLabel = computed(() => {
  if (selectedId.value === '' || selectedId.value === undefined || selectedId.value === null) {
    return ''
  }
  const selected = options.value.find(item => `${item.id}` === `${selectedId.value}`)
  return selected?.name || String(selectedId.value)
})

watch(
  () => props.modelValue,
  (value) => {
    selectedId.value = value ?? ''
  },
  { immediate: true },
)

watch(
  () => props.source,
  () => {
    loadOptions()
  },
)

/** 打开选择器 */
function handleOpen() {
  if (props.disabled) {
    return
  }
  visible.value = true
  if (options.value.length === 0 && !loading.value) {
    loadOptions()
  }
}

/** 加载选择器数据 */
async function loadOptions() {
  const loader = erpOptionLoaders[props.source]
  if (!loader) {
    options.value = []
    return
  }
  loading.value = true
  try {
    const resolved = normalizeOptions(await loader()).map(item => ({
      id: item.id,
      name: item.name,
      raw: item,
    }))
    options.value = props.optionFilter
      ? resolved.filter(item => !item.raw || props.optionFilter!(item.raw))
      : resolved
  } finally {
    loading.value = false
  }
}

/** 选择确认 */
function handleConfirm({ value }: { value: any }) {
  const selected = options.value.find(item => `${item.id}` === `${value}`)
  emit('update:modelValue', value === '' || value === undefined || value === null ? undefined : value)
  emit('confirm', selected)
}

defineExpose({
  loadOptions,
  selectedLabel,
})

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
