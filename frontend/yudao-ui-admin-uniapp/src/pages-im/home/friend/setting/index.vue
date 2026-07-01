<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="设置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <scroll-view class="min-h-0 flex-1 bg-[#ededed]" scroll-y>
      <!-- 备注 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="编辑备注" :value="friend?.displayName || '未设置'" is-link center @click="editRemark" />
        </wd-cell-group>
      </view>

      <!-- 开关项 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="消息免打扰" center>
            <wd-switch v-model="silent" size="40rpx" @change="onSilentChange" />
          </wd-cell>
          <wd-cell title="置顶聊天" center>
            <wd-switch v-model="pinned" size="40rpx" @change="onPinnedChange" />
          </wd-cell>
        </wd-cell-group>
      </view>

      <!-- 黑名单 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="加入黑名单" center>
            <wd-switch v-model="blocked" size="40rpx" @change="onBlockedChange" />
          </wd-cell>
        </wd-cell-group>
      </view>

      <!-- 删除好友 -->
      <view class="mt-20rpx bg-white">
        <view class="py-30rpx text-center text-32rpx text-[#fa5151]" @click="handleDelete">
          删除好友
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { ImFriendRespVO } from '@/api/im/friend'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { blockFriend, deleteFriend, getFriend, unblockFriend, updateFriend } from '@/api/im/friend'
import { delay, navigateBackPlus } from '@/utils'

const props = defineProps<{
  friendUserId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const friend = ref<ImFriendRespVO>() // 好友资料
const silent = ref(false) // 消息免打扰
const pinned = ref(false) // 置顶
const blocked = ref(false) // 黑名单

/** 好友编号 */
const friendUserId = computed(() => Number(props.friendUserId))

/** 加载好友资料 */
async function loadFriend() {
  if (!friendUserId.value) {
    return
  }
  friend.value = await getFriend(friendUserId.value)
  silent.value = !!friend.value?.silent
  pinned.value = !!friend.value?.pinned
  blocked.value = !!friend.value?.blocked
}

/** 返回 */
function handleBack() {
  navigateBackPlus('/pages-im/home/friend/index')
}

/** 编辑备注 */
function editRemark() {
  uni.showModal({
    title: '编辑备注',
    editable: true,
    content: friend.value?.displayName || '',
    placeholderText: '请输入备注名',
    success: async ({ confirm, content }) => {
      if (!confirm) {
        return
      }
      await updateFriend({ friendUserId: friendUserId.value, displayName: content || '' })
      await loadFriend()
      toast.success('已保存')
    },
  })
}

/** 切换免打扰 */
async function onSilentChange() {
  try {
    await updateFriend({ friendUserId: friendUserId.value, silent: silent.value })
  } catch {
    silent.value = !silent.value
  }
}

/** 切换置顶 */
async function onPinnedChange() {
  try {
    await updateFriend({ friendUserId: friendUserId.value, pinned: pinned.value })
  } catch {
    pinned.value = !pinned.value
  }
}

/** 切换黑名单 */
async function onBlockedChange() {
  try {
    await (blocked.value ? blockFriend(friendUserId.value) : unblockFriend(friendUserId.value))
  } catch {
    blocked.value = !blocked.value
  }
}

/** 删除好友 */
function handleDelete() {
  uni.showModal({
    title: '提示',
    content: '确定删除该好友吗？',
    success: async ({ confirm }) => {
      if (!confirm) {
        return
      }
      await deleteFriend(friendUserId.value, false)
      toast.success('已删除')
      delay(() => navigateBackPlus('/pages-im/home/friend/index'))
    },
  })
}

onMounted(() => {
  loadFriend()
})
</script>
