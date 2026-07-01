<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI 工作台"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 功能入口 -->
    <view class="p-24rpx">
      <view class="mb-24rpx rounded-12rpx bg-white p-28rpx shadow-sm">
        <view class="text-36rpx text-[#1f2937] font-semibold">
          芋道 AI
        </view>
        <view class="mt-8rpx text-26rpx text-[#6b7280]">
          对话、创作与模型管理的移动端入口
        </view>
      </view>

      <view class="grid grid-cols-2 gap-20rpx">
        <view
          v-for="item in menus"
          :key="item.key"
          class="rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleNavigate(item.url)"
        >
          <view
            class="mb-22rpx h-72rpx w-72rpx flex items-center justify-center rounded-12rpx text-36rpx text-white"
            :style="{ backgroundColor: item.color }"
          >
            <wd-icon :name="item.icon" />
          </view>
          <view class="text-30rpx text-[#333] font-semibold">
            {{ item.name }}
          </view>
          <view class="mt-8rpx text-24rpx text-[#999]">
            {{ item.desc }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const menus = [
  { key: 'chat', name: 'AI 对话', desc: '角色对话与上下文', icon: 'chat', color: '#1677ff', url: '/pages-ai/chat/index' },
  { key: 'image', name: 'AI 绘图', desc: '提示词生成图片', icon: 'picture', color: '#13c2c2', url: '/pages-ai/image/index' },
  { key: 'music', name: 'AI 音乐', desc: '歌词与风格生成', icon: 'sound', color: '#f5222d', url: '/pages-ai/music/index' },
  { key: 'write', name: 'AI 写作', desc: '撰写与回复生成', icon: 'edit', color: '#722ed1', url: '/pages-ai/write/index' },
  { key: 'mindmap', name: '思维导图', desc: '结构化生成大纲', icon: 'share', color: '#fa8c16', url: '/pages-ai/mindmap/index' },
  { key: 'model', name: '模型配置', desc: '密钥、模型、角色', icon: 'setting', color: '#eb2f96', url: '/pages-ai/model/index' },
  { key: 'knowledge', name: '知识库', desc: '文档与分段管理', icon: 'folder', color: '#52c41a', url: '/pages-ai/knowledge/index' },
  { key: 'content', name: '生成记录', desc: '图片、音乐、写作', icon: 'list', color: '#2f54eb', url: '/pages-ai/content/index' },
  { key: 'workflow', name: 'AI 工作流', desc: '编排与测试入口', icon: 'tools', color: '#faad14', url: '/pages-ai/workflow/index' },
]

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 跳转功能页 */
function handleNavigate(url: string) {
  uni.navigateTo({ url })
}
</script>
