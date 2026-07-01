<template>
  <view class="yd-detail-footer">
    <view :class="contentClass">
      <slot />
    </view>
  </view>
</template>

<script lang="ts" setup>
/**
 * MES 底部操作栏外壳
 *
 * 只统一底部固定栏和按钮排列；按钮显隐、loading、disabled、权限和业务动作仍由页面维护。
 */
withDefaults(defineProps<{
  contentClass?: string
}>(), {
  contentClass: 'flex gap-24rpx text-28rpx',
})
</script>
