<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="私聊消息详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="发送人" :value="formData?.senderNickname || (formData ? `用户 ${formData.senderId}` : '-')" />
        <wd-cell title="接收人" :value="formData?.receiverNickname || (formData ? `用户 ${formData.receiverId}` : '-')" />
        <wd-cell title="消息类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.IM_CONTENT_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.IM_MESSAGE_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="发送时间" :value="formatDateTime(formData?.sendTime) || '-'" />
      </wd-cell-group>

      <!-- 消息内容 -->
      <view class="mt-20rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#999]">
          消息内容
        </view>
        <!-- TODO @AI：消息内容的展示，是不是抽成一个 components 组件，在 /Users/yunai/Java/yudao-ui-admin-uniapp-next-v4/src/pages-im/manager/message；因为去聊也要复用； -->
        <!-- TODO @AI：参考 pc 尽量渲染出来；渲染不出来，应该提示去 pc 看呀； -->
        <image
          v-if="imageUrl"
          :src="imageUrl"
          class="max-w-full rounded-12rpx"
          mode="widthFix"
          @click="previewImage"
        />
        <view v-else class="text-28rpx text-[#333] leading-44rpx">
          {{ contentSummary }}
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerPrivateMessageVO } from '@/api/im/manager/message/private'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getManagerPrivateMessage } from '@/api/im/manager/message/private'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { getImageUrl, getMessageSummary } from '@/pages-im/utils/message'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formData = ref<ImManagerPrivateMessageVO>() // 详情数据

/** 图片消息地址 */
// TODO @AI：这种简单的图片，不用搞个方法把。。。
const imageUrl = computed(() => formData.value ? getImageUrl(formData.value.content) : '')

/** 内容摘要 */
const contentSummary = computed(() => formData.value ? getMessageSummary(formData.value.type, formData.value.content) : '-')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/message/private/index')
}

/** 预览图片 */
// TODO @AI：图片是不是可以使用 wd-image 这种组件？
function previewImage() {
  if (imageUrl.value) {
    uni.previewImage({ urls: [imageUrl.value] })
  }
}

/** 加载私聊消息详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getManagerPrivateMessage(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
