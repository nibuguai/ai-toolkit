<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <yd-search-picker v-model="formData.channelId" label="所属频道" :columns="channelColumns" :all-value="0" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          标题
        </view>
        <wd-input v-model="formData.title" placeholder="请输入素材标题" clearable />
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { getSimpleChannelList } from '@/api/im/manager/channel'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { getWotPickerDisplay } from '@/utils/wot'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const channelColumns = ref<{ label: string, value: number }[]>([{ label: '全部', value: 0 }]) // 频道选项（0 表示全部）
const formData = reactive({
  channelId: 0, // 0 表示全部
  title: undefined as string | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.channelId) {
    conditions.push(`频道:${getWotPickerDisplay(channelColumns.value, formData.channelId, { valueKey: 'value', labelKey: 'label', placeholder: '' })}`)
  }
  if (formData.title) {
    conditions.push(`标题:${formData.title}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索素材'
})

/** 加载频道选项 */
async function loadChannelOptions() {
  const list = await getSimpleChannelList()
  channelColumns.value = [
    { label: '全部', value: 0 },
    ...list.map(item => ({ label: item.name, value: item.id })),
  ]
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    channelId: formData.channelId || undefined,
    title: formData.title,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.channelId = 0
  formData.title = undefined
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(() => {
  loadChannelOptions()
})
</script>
