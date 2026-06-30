<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="currentTab.title"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    >
      <template #right>
        <view class="pr-8rpx" @click="handleAdd">
          <wd-icon name="plus" size="44rpx" color="#333" />
        </view>
      </template>
    </wd-navbar>

    <!-- 内容区：消息 / 通讯录 两个视图常驻 -->
    <view class="min-h-0 flex-1">
      <ConversationView v-show="activeTab === 'message'" :active="activeTab === 'message'" />
      <FriendView v-show="activeTab === 'contact'" :active="activeTab === 'contact'" />
    </view>

    <!-- 底部 tab 栏 -->
    <wd-tabbar
      v-model="activeTab"
      :active-color="activeColor"
      inactive-color="#8a8a8a"
      safe-area-inset-bottom
      bordered
    >
      <wd-tabbar-item
        v-for="tab in tabs"
        :key="tab.key"
        :name="tab.key"
        :title="tab.title"
        :icon="tab.icon"
        :value="tab.key === 'message' ? messageBadge : undefined"
      />
    </wd-tabbar>
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import { useImConversations } from '../composables/useImConversations'
import { connectImWebSocket } from '../composables/useImWebSocket'
import ConversationView from './components/conversation-view.vue'
import FriendView from './components/friend-view.vue'

type TabKey = 'message' | 'contact'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const activeColor = '#1677ff' // 选中色
const tabs: { key: TabKey, title: string, icon: string }[] = [
  { key: 'message', title: '消息', icon: 'message' },
  { key: 'contact', title: '通讯录', icon: 'user' },
] // 底部 tab 配置
const activeTab = ref<TabKey>('message') // 当前 tab

const { conversations } = useImConversations()

/** 当前 tab 信息 */
const currentTab = computed(() => tabs.find(tab => tab.key === activeTab.value) || tabs[0])

/** 未读总数 */
const totalUnread = computed(() => conversations.value.reduce((sum, item) => sum + (item.unreadCount || 0), 0))

/** 消息 tab 徽标（无未读时不展示） */
const messageBadge = computed<number | string | undefined>(() => {
  if (totalUnread.value <= 0) {
    return undefined
  }
  return totalUnread.value > 99 ? '99+' : totalUnread.value
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages/index/index')
}

/** 右上角新增：添加好友 / 创建群聊 */
function handleAdd() {
  uni.showActionSheet({
    itemList: ['添加好友', '创建群聊'],
    success: ({ tapIndex }) => {
      uni.navigateTo({
        url: tapIndex === 0 ? '/pages-im/home/friend/apply/index' : '/pages-im/home/group/form/index',
      })
    },
  })
}

/** 进入 IM 即建立实时连接（幂等） */
onShow(() => {
  connectImWebSocket()
})
</script>
