<template>
  <view class="bg-white px-24rpx py-16rpx">
    <scroll-view scroll-x class="whitespace-nowrap">
      <view class="inline-flex items-center">
        <view class="flex items-center text-28rpx text-[#1890ff]" @click="handleClick(-1)">
          <text>顶级分类</text>
        </view>
        <template v-for="(item, index) in breadcrumbList" :key="item.id">
          <wd-icon name="arrow-right" size="12px" color="#999" custom-class="mx-8rpx" />
          <view
            class="flex items-center text-28rpx"
            :class="index < breadcrumbList.length - 1 ? 'text-[#1890ff]' : 'text-[#333]'"
            @click="handleClick(index)"
          >
            <text>{{ item.name }}</text>
          </view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

interface BreadcrumbItem {
  id: number
  name?: string
}

// 面包屑列表

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()
const breadcrumbList = ref<BreadcrumbItem[]>([]) // 面包屑列表

/** 点击面包屑项 */
function handleClick(index: number) {
  if (index === -1) {
    breadcrumbList.value = []
    emit('update:modelValue', 0)
    return
  }
  const target = breadcrumbList.value[index]
  breadcrumbList.value = breadcrumbList.value.slice(0, index + 1)
  emit('update:modelValue', target.id)
}

/** 进入下一层级 */
function enter(item: BreadcrumbItem) {
  breadcrumbList.value.push(item)
  emit('update:modelValue', item.id)
}

/** 返回上一级，返回 true 表示还能继续回退 */
function back(): boolean {
  if (breadcrumbList.value.length > 0) {
    breadcrumbList.value.pop()
    const parentId = breadcrumbList.value.length > 0 ? breadcrumbList.value[breadcrumbList.value.length - 1].id : 0
    emit('update:modelValue', parentId)
    return true
  }
  return false
}

/** 重置 */
function reset() {
  breadcrumbList.value = []
}

defineExpose({ enter, back, reset })
</script>
