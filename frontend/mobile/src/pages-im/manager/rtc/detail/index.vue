<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="通话详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <!-- 通话信息 -->
      <wd-cell-group border>
        <wd-cell title="发起人" :value="call?.inviterNickname || (call ? `用户 ${call.inviterUserId}` : '-')" />
        <wd-cell title="会话类型">
          <dict-tag v-if="call?.conversationType != null" :type="DICT_TYPE.IM_RTC_CALL_CONVERSATION_TYPE" :value="call.conversationType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell v-if="call?.groupId" title="所属群" :value="call?.groupName || `群 ${call.groupId}`" />
        <wd-cell title="媒体类型">
          <dict-tag v-if="call?.mediaType != null" :type="DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE" :value="call.mediaType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="通话状态">
          <dict-tag v-if="call?.status != null" :type="DICT_TYPE.IM_RTC_CALL_STATUS" :value="call.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="结束原因">
          <dict-tag v-if="call?.endReason != null" :type="DICT_TYPE.IM_RTC_CALL_END_REASON" :value="call.endReason" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="通话时长" :value="formatCallDuration(call?.acceptTime, call?.endTime)" />
        <wd-cell title="发起时间" :value="formatDateTime(call?.startTime) || '-'" />
        <wd-cell title="接通时间" :value="formatDateTime(call?.acceptTime) || '-'" />
        <wd-cell title="结束时间" :value="formatDateTime(call?.endTime) || '-'" />
      </wd-cell-group>

      <!-- 参与者 -->
      <wd-cell-group border class="mt-20rpx">
        <view class="px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
          参与者（{{ participants.length }}）
        </view>
        <view v-if="participants.length === 0" class="px-24rpx pb-24rpx text-26rpx text-[#999]">
          暂无参与者
        </view>
        <view
          v-for="member in participants"
          :key="member.id"
          class="flex items-center justify-between border-t border-t-[#f2f3f5] px-24rpx py-16rpx"
        >
          <view class="min-w-0 flex-1">
            <view class="line-clamp-1 text-28rpx text-[#333]">
              {{ member.userNickname || `用户 ${member.userId}` }}
            </view>
            <view class="mt-4rpx text-22rpx text-[#999]">
              接通 {{ formatDateTime(member.acceptTime) || '-' }}
            </view>
          </view>
          <view class="flex items-center gap-12rpx">
            <dict-tag :type="DICT_TYPE.IM_RTC_PARTICIPANT_ROLE" :value="member.role" />
            <dict-tag :type="DICT_TYPE.IM_RTC_PARTICIPANT_STATUS" :value="member.status" />
          </view>
        </view>
      </wd-cell-group>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerRtcCallVO, ImManagerRtcParticipantVO } from '@/api/im/manager/rtc'
import { onMounted, ref } from 'vue'
import { getManagerRtcCallParticipantList } from '@/api/im/manager/rtc'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatCallDuration } from '../utils'

const props = defineProps<{
  id?: number | string
  snapshot?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const call = ref<ImManagerRtcCallVO>() // 通话信息（来自列表快照）
const participants = ref<ImManagerRtcParticipantVO[]>([]) // 参与者

/** 解析列表传入的通话快照 */
function parseSnapshot(raw?: string): ImManagerRtcCallVO | undefined {
  if (!raw) {
    return undefined
  }
  try {
    return JSON.parse(raw)
  } catch {
    try {
      return JSON.parse(decodeURIComponent(raw))
    } catch {
      return undefined
    }
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/rtc/index')
}

/** 加载参与者 */
async function loadParticipants() {
  if (!props.id) {
    return
  }
  participants.value = await getManagerRtcCallParticipantList(Number(props.id))
}

/** 初始化 */
onMounted(() => {
  call.value = parseSnapshot(props.snapshot)
  loadParticipants()
})
</script>
