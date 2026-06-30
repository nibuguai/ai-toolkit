<template>
  <wd-form-item
    :title="label"
    :title-width="labelWidth"
    :prop="prop || undefined"
    :is-link="!disabled"
    :value="selectedLabel"
    :placeholder="placeholder"
    @click="openPicker"
  />

  <view v-if="visible" class="entity-picker-mask" @click="handleCancel">
    <view class="entity-picker-panel" @click.stop>
      <view class="entity-picker-header">
        <text class="entity-picker-title">{{ placeholder }}</text>
        <wd-icon name="close" size="36rpx" @click="handleCancel" />
      </view>
      <wd-search v-model="keyword" placeholder="搜索" hide-cancel placeholder-left />
      <scroll-view scroll-y class="entity-picker-list">
        <view
          v-for="item in filteredColumns"
          :key="String(item[valueKey])"
          class="entity-picker-option"
          @click="handleToggle(item)"
        >
          <text class="entity-picker-option-label">{{ item[labelKey] }}</text>
          <wd-icon v-if="isSelected(item)" name="check" size="36rpx" color="#4d80f0" />
        </view>
        <view v-if="filteredColumns.length === 0" class="entity-picker-empty">暂无数据</view>
      </scroll-view>
      <view class="entity-picker-footer">
        <wd-button type="primary" block @click="handleConfirm">确认</wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: number | number[] | string
  columns: Record<string, any>[]
  label: string
  placeholder?: string
  prop?: string
  labelKey?: string
  valueKey?: string
  labelWidth?: string
  type?: 'checkbox' | 'radio'
  disabled?: boolean
}>(), {
  placeholder: '请选择',
  prop: '',
  labelKey: 'name',
  valueKey: 'id',
  labelWidth: '200rpx',
  type: 'radio',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | number[] | string | undefined): void
}>()

const visible = ref(false) // 选择弹窗显示状态
const keyword = ref('') // 搜索关键字
const innerValue = ref<any>(props.type === 'checkbox' ? [] : '') // 当前选中值
const draftValue = ref<any>(props.type === 'checkbox' ? [] : '') // 待确认选中值

const filteredColumns = computed(() => {
  const keywordText = keyword.value.trim().toLowerCase()
  if (!keywordText) {
    return props.columns
  }
  return props.columns.filter((item) => {
    const labelText = String(item[props.labelKey] ?? '').toLowerCase()
    return labelText.includes(keywordText)
  })
})

const selectedLabel = computed(() => {
  const value = innerValue.value
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return ''
    }
    return value
      .map(itemValue => findLabel(itemValue))
      .filter(Boolean)
      .join('、')
  }
  return findLabel(value)
})

/** 查找选项展示文本 */
function findLabel(value: any) {
  if (value === undefined || value === null || value === '') {
    return ''
  }
  const item = props.columns.find(option => String(option[props.valueKey]) === String(value))
  return item?.[props.labelKey] || String(value)
}

/** 打开选择弹窗 */
function openPicker() {
  if (props.disabled) return
  draftValue.value = Array.isArray(innerValue.value) ? [...innerValue.value] : innerValue.value
  keyword.value = ''
  visible.value = true
}

/** 取消选择 */
function handleCancel() {
  visible.value = false
}

/** 判断是否选中 */
function isSelected(item: Record<string, any>) {
  const value = item[props.valueKey]
  if (props.type === 'checkbox') {
    return Array.isArray(draftValue.value) && draftValue.value.some(itemValue => String(itemValue) === String(value))
  }
  return String(draftValue.value) === String(value)
}

/** 切换选项 */
function handleToggle(item: Record<string, any>) {
  const value = item[props.valueKey]
  if (props.type === 'checkbox') {
    const values = Array.isArray(draftValue.value) ? [...draftValue.value] : []
    const index = values.findIndex(itemValue => String(itemValue) === String(value))
    if (index >= 0) {
      values.splice(index, 1)
    } else {
      values.push(value)
    }
    draftValue.value = values
    return
  }
  draftValue.value = value
}

/** 确认选择 */
function handleConfirm() {
  innerValue.value = Array.isArray(draftValue.value) ? [...draftValue.value] : draftValue.value
  const value = innerValue.value
  emit('update:modelValue', value === '' ? undefined : value)
  visible.value = false
}

watch(
  () => props.modelValue,
  (value) => {
    if (props.type === 'checkbox') {
      innerValue.value = Array.isArray(value) ? value : []
    } else {
      innerValue.value = value ?? ''
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.entity-picker-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  background: rgb(0 0 0 / 45%);
}

.entity-picker-panel {
  width: 100%;
  max-height: 72vh;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
  border-radius: 24rpx 24rpx 0 0;
  background: #fff;
}

.entity-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx 12rpx;
}

.entity-picker-title {
  color: #333;
  font-size: 32rpx;
  font-weight: 600;
}

.entity-picker-list {
  max-height: 50vh;
}

.entity-picker-option {
  display: flex;
  min-height: 96rpx;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx;
  border-bottom: 1rpx solid #f2f3f5;
}

.entity-picker-option-label {
  min-width: 0;
  flex: 1;
  color: #333;
  font-size: 28rpx;
}

.entity-picker-empty {
  padding: 80rpx 32rpx;
  color: #999;
  font-size: 28rpx;
  text-align: center;
}

.entity-picker-footer {
  padding: 20rpx 32rpx 28rpx;
}
</style>
