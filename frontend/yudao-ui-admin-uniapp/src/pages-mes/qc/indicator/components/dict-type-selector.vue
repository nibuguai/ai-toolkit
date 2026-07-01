<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 72vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="visible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          选择字典类型
        </view>
        <wd-button size="small" type="primary" :disabled="!selected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="keyword" placeholder="搜索字典名称或类型" clearable />
      </view>

      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
        <view class="p-24rpx">
          <view
            v-for="item in filteredList"
            :key="item.type"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="selected?.type === item.type ? 'ring-2 ring-[#1677ff]' : ''"
            @click="selected = item"
          >
            <view class="text-30rpx text-[#333] font-semibold">
              {{ item.name || '-' }}
            </view>
            <view class="mt-8rpx text-24rpx text-[#999]">
              {{ item.type || '-' }}
            </view>
            <view v-if="item.remark" class="mt-12rpx text-26rpx text-[#666]">
              {{ item.remark }}
            </view>
          </view>

          <view v-if="filteredList.length === 0 && !loading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选字典类型" />
          </view>
          <view v-if="loading" class="flex justify-center py-24rpx">
            <wd-loading />
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { DictType } from '@/api/system/dict/type'
import { computed, ref } from 'vue'
import { getSimpleDictTypeList } from '@/api/system/dict/type'

const emit = defineEmits<{
  confirm: [item: DictType]
}>()

const visible = ref(false) // 弹层显示状态
const loading = ref(false) // 列表加载状态
const list = ref<DictType[]>([]) // 字典类型列表
const selected = ref<DictType>() // 当前选中
const keyword = ref('') // 搜索关键词

const filteredList = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  if (!value) {
    return list.value
  }
  return list.value.filter(item =>
    item.name.toLowerCase().includes(value) || item.type.toLowerCase().includes(value),
  )
})

/** 打开选择器 */
function open(currentType?: string) {
  visible.value = true
  keyword.value = ''
  selected.value = undefined
  loadList().then(() => {
    selected.value = list.value.find(item => item.type === currentType)
  })
}

/** 加载字典类型列表 */
async function loadList() {
  if (list.value.length > 0) {
    return
  }
  loading.value = true
  try {
    list.value = await getSimpleDictTypeList()
  } finally {
    loading.value = false
  }
}

/** 确认选择 */
function handleConfirm() {
  if (!selected.value) {
    return
  }
  emit('confirm', selected.value)
  visible.value = false
}

defineExpose({ open })
</script>
