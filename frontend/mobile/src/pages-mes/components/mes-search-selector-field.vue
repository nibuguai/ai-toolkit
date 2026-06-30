<template>
  <view class="mes-search-selector-field" @click="emit('click')">
    <text v-if="modelValue" class="min-w-0 flex-1 truncate text-[#333]">
      {{ modelValue }}
    </text>
    <text v-else class="min-w-0 flex-1 truncate text-[#999]">
      {{ placeholder }}
    </text>
    <wd-icon
      v-if="clearable && modelValue"
      name="close-circle"
      size="30rpx"
      custom-style="color: #c0c4cc;"
      @click.stop="emit('clear')"
    />
  </view>
</template>

<script lang="ts" setup>
/**
 * MES 搜索选择器展示行
 *
 * 只统一搜索弹窗中的选择器展示、点击和清空入口；
 * 真实选择器打开、确认和回填仍由页面负责。
 */
withDefaults(defineProps<{
  modelValue?: string
  placeholder: string
  clearable?: boolean
}>(), {
  modelValue: '',
  clearable: false,
})

const emit = defineEmits<{
  click: []
  clear: []
}>()
</script>

<style lang="scss" scoped>
.mes-search-selector-field {
  min-height: 72rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 24rpx;
  border-radius: 8rpx;
  background: #f7f8fa;
  font-size: 28rpx;
}
</style>
