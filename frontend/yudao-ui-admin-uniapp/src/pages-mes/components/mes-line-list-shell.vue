<template>
  <view class="mes-line-list-shell">
    <view class="mes-line-list-shell__header">
      <view class="mes-line-list-shell__title">
        {{ title }}
      </view>
      <slot name="action">
        <view v-if="readonly" class="mes-line-list-shell__readonly">
          只读
        </view>
        <view
          v-else-if="showAdd"
          class="mes-line-list-shell__add"
          @click="emit('add')"
        >
          {{ addText }}
        </view>
      </slot>
    </view>
    <view v-if="loading" class="mes-line-list-shell__state">
      加载中...
    </view>
    <view v-else-if="empty" class="mes-line-list-shell__state">
      {{ emptyText }}
    </view>
    <view v-else class="mes-line-list-shell__content" :class="contentClass">
      <slot />
    </view>
  </view>
</template>

<script lang="ts" setup>
/**
 * MES 明细列表外壳
 *
 * 只统一明细区标题、只读/新增入口、加载态、空态和内容间距；
 * 明细字段、编辑弹窗和业务接口仍由各业务组件显式维护。
 */
withDefaults(defineProps<{
  title: string
  loading?: boolean
  empty?: boolean
  emptyText?: string
  readonly?: boolean
  showAdd?: boolean
  addText?: string
  contentClass?: string
}>(), {
  loading: false,
  empty: false,
  emptyText: '暂无明细',
  readonly: false,
  showAdd: true,
  addText: '添加明细',
  contentClass: '',
})

const emit = defineEmits<{
  add: []
}>()
</script>

<style lang="scss" scoped>
.mes-line-list-shell {
  margin-top: 24rpx;
  background: #fff;
}

.mes-line-list-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.mes-line-list-shell__title {
  color: #333;
  font-size: 30rpx;
  font-weight: 600;
}

.mes-line-list-shell__readonly {
  color: #999;
  font-size: 24rpx;
}

.mes-line-list-shell__add {
  padding: 8rpx 20rpx;
  border: 1rpx solid #1677ff;
  border-radius: 8rpx;
  color: #1677ff;
  font-size: 24rpx;
}

.mes-line-list-shell__state {
  padding: 32rpx 24rpx;
  color: #999;
  font-size: 26rpx;
  text-align: center;
}

.mes-line-list-shell__content {
  padding: 8rpx 24rpx;
}
</style>
