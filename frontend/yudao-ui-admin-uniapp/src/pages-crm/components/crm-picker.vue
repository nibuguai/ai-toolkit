<!-- CRM 通用单选选择器：按 source 加载对应业务数据（客户/联系人/商机/合同/产品/产品分类/商机阶段/回款计划）的下拉选项，支持表单项 / 单元格 / 自定义插槽三种展示形态 -->
<template>
  <view v-if="useDefaultSlot" @click="handleOpen">
    <slot />
  </view>
  <wd-form-item
    v-else-if="label || prop"
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
import type { Business } from '@/api/crm/business'
import type { Contact } from '@/api/crm/contact'
import type { ProductCategory } from '@/api/crm/product/category'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleBusinessList } from '@/api/crm/business'
import { getBusinessStatusSimpleList, getBusinessStatusTypeSimpleList } from '@/api/crm/business/status'
import { getSimpleContactList } from '@/api/crm/contact'
import { getContractSimpleList } from '@/api/crm/contract'
import { getCustomerSimpleList } from '@/api/crm/customer'
import { getProductSimpleList } from '@/api/crm/product'
import { getProductCategoryList } from '@/api/crm/product/category'
import { getReceivablePlanSimpleList } from '@/api/crm/receivable/plan'

type CrmPickerSource
  = | 'business'
    | 'businessStatus'
    | 'businessStatusType'
    | 'contact'
    | 'contract'
    | 'customer'
    | 'product'
    | 'productCategory'
    | 'receivablePlan'

interface PickerOption {
  id: number | string
  name: string
  raw?: Record<string, any>
}

const props = withDefaults(defineProps<{
  labelWidth?: string
  modelValue?: number | string
  source: CrmPickerSource
  label?: string
  placeholder?: string
  prop?: string
  params?: Record<string, any>
  disabled?: boolean
  useDefaultSlot?: boolean
  optionFilter?: (raw: Record<string, any>) => boolean
}>(), {
  labelWidth: '200rpx',
  label: '',
  placeholder: '请选择',
  prop: '',
  params: () => ({}),
  disabled: false,
  useDefaultSlot: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | string | undefined): void
  (e: 'confirm', option?: PickerOption): void
}>()

const options = ref<PickerOption[]>([]) // 选择器数据
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
  () => [props.source, JSON.stringify(props.params || {})],
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
  loading.value = true
  try {
    const resolved = await resolveOptions()
    // 选项过滤：无 raw 的特殊项（如「顶级分类」）始终保留
    options.value = props.optionFilter
      ? resolved.filter(item => !item.raw || props.optionFilter!(item.raw))
      : resolved
  } finally {
    loading.value = false
  }
}

/** 按来源解析选项 */
async function resolveOptions() {
  switch (props.source) {
    case 'customer':
      return mapOptions(await getCustomerSimpleList())
    case 'contact':
      return mapOptions(filterByCustomer(await getSimpleContactList()))
    case 'business':
      return mapOptions(filterByCustomer(await getSimpleBusinessList()))
    case 'contract':
      return loadContractOptions()
    case 'product':
      return mapOptions(await getProductSimpleList())
    case 'productCategory': {
      // 产品归类场景（不传 params）取全部分类、无「顶级分类」；父级分类场景传 { parentId: 0 } 仅取顶级分类并提供「顶级分类」（对齐 PC 两级结构）
      const categoryOptions = flattenCategoryOptions(await getProductCategoryList(props.params || {}))
      return props.params?.parentId === 0
        ? [{ id: 0, name: '顶级分类' }, ...categoryOptions]
        : categoryOptions
    }
    case 'businessStatusType':
      return mapOptions(await getBusinessStatusTypeSimpleList())
    case 'businessStatus':
      return loadBusinessStatusOptions()
    case 'receivablePlan':
      return loadReceivablePlanOptions()
    default:
      return []
  }
}

/** 加载合同选项 */
async function loadContractOptions() {
  const customerId = Number(props.params?.customerId)
  if (!customerId) {
    return []
  }
  return mapOptions(await getContractSimpleList(customerId))
}

/** 加载商机阶段选项 */
async function loadBusinessStatusOptions() {
  const typeId = Number(props.params?.typeId || props.params?.statusTypeId)
  if (!typeId) {
    return []
  }
  return mapOptions(await getBusinessStatusSimpleList(typeId))
}

/** 加载回款计划选项 */
async function loadReceivablePlanOptions() {
  const customerId = Number(props.params?.customerId)
  const contractId = Number(props.params?.contractId)
  if (!customerId || !contractId) {
    return []
  }
  const list = await getReceivablePlanSimpleList(customerId, contractId)
  return list.map(item => ({
    id: item.id!,
    name: item.period ? `第 ${item.period} 期` : `${item.id}`,
    raw: item as Record<string, any>,
  }))
}

/** 过滤当前客户下的数据 */
function filterByCustomer<T extends Business | Contact>(list: T[]) {
  const customerId = props.params?.customerId
  if (!customerId) {
    return list
  }
  return list.filter(item => `${item.customerId}` === `${customerId}`)
}

/** 转换通用选项 */
function mapOptions<T extends { id?: number, name?: string }>(list: T[]) {
  return list
    .filter(item => item.id !== undefined)
    .map(item => ({
      id: item.id!,
      name: item.name || `${item.id}`,
      raw: item as Record<string, any>,
    }))
}

/** 展平产品分类 */
function flattenCategoryOptions(list: ProductCategory[], level = 0): PickerOption[] {
  const result: PickerOption[] = []
  list.forEach((item) => {
    if (item.id !== undefined) {
      result.push({
        id: item.id,
        name: `${'  '.repeat(level)}${item.name}`,
        raw: item,
      })
    }
    if (item.children?.length) {
      result.push(...flattenCategoryOptions(item.children, level + 1))
    }
  })
  return result
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
