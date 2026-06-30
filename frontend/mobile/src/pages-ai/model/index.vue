<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI 模型配置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 功能入口 -->
    <view class="p-24rpx">
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

const menus = [ // 模型配置子模块入口
  { key: 'apiKey', name: 'API 密钥', desc: '平台密钥管理', icon: 'setting', color: '#1677ff', url: '/pages-ai/model/apiKey/index' },
  { key: 'model', name: '模型', desc: '聊天/向量等模型', icon: 'list', color: '#13c2c2', url: '/pages-ai/model/model/index' },
  { key: 'chatRole', name: '聊天角色', desc: '角色与提示词', icon: 'chat', color: '#722ed1', url: '/pages-ai/model/chatRole/index' },
  { key: 'tool', name: '工具', desc: '函数工具配置', icon: 'tools', color: '#fa8c16', url: '/pages-ai/model/tool/index' },
]

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/index/index')
}

/** 跳转子模块 */
function handleNavigate(url: string) {
  uni.navigateTo({ url })
}
</script>
