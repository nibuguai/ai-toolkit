<template>
  <!--
    MES 列表卡片包装器
    A. 左滑删除：非选择模式下左滑露出删除按钮
    B. 长按多选：长按进入选择模式，显示复选框
  -->
  <wd-swipe-action :disabled="selecting || !canDelete">
    <view
      class="mes-list-card relative mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      :class="{ 'ring-2 ring-[#1677ff]': selected }"
      @click="handleCardClick"
      @longpress="handleCardLongPress"
    >
      <!-- 选择模式下的复选框 -->
      <view
        v-if="selecting"
        class="absolute left-20rpx top-1/2 z-10"
        style="transform: translateY(-50%);"
        @click.stop="emit('toggle-select', itemId)"
      >
        <wd-checkbox :model-value="selected" @change="emit('toggle-select', itemId)" />
      </view>

      <!-- 选择模式下面板左移为复选框留空 -->
      <view :class="selecting ? 'pl-80rpx' : ''">
        <slot />
      </view>
    </view>

    <!-- 左滑露出的删除按钮 -->
    <template v-if="!selecting && canDelete" #right>
      <view
        class="h-full flex items-center justify-center px-36rpx"
        style="background: linear-gradient(135deg, #f56c6c, #e85d5d);"
        @click.stop="emit('swipe-delete', item)"
      >
        <wd-icon name="delete-outline" size="36rpx" custom-style="color: #fff;" />
        <text class="ml-8rpx text-28rpx text-white">删除</text>
      </view>
    </template>
  </wd-swipe-action>
</template>

<script lang="ts" setup>
/**
 * MES 列表卡片包装器
 *
 * 提供统一的左滑删除 + 长按多选交互。
 *
 * Events:
 *   @click         卡片点击（跳详情）
 *   @longpress     长按进入选择模式
 *   @toggle-select 切换选中状态
 *   @swipe-delete  左滑删除
 */
defineOptions({ name: 'MesListCard' })

const props = withDefaults(defineProps<{
  item: Record<string, any> // 记录对象
  itemId: number | string // 主键值
  selecting?: boolean // 是否处于选择模式
  selected?: boolean // 当前项是否选中
  canDelete?: boolean // 是否有删除权限
}>(), {
  selecting: false,
  selected: false,
  canDelete: true,
})

const emit = defineEmits<{
  'click': [item: Record<string, any>]
  'longpress': [itemId: number | string]
  'toggle-select': [itemId: number | string]
  'swipe-delete': [item: Record<string, any>]
}>()

/** 卡片点击 */
function handleCardClick() {
  if (props.selecting) {
    emit('toggle-select', props.itemId)
  } else {
    emit('click', props.item)
  }
}

/** 长按进入选择模式 */
function handleCardLongPress() {
  if (props.selecting || !props.canDelete) {
    return
  }
  emit('longpress', props.itemId)
}
</script>
