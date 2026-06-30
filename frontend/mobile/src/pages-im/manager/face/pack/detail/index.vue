<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="表情包详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="封面" center>
          <wd-img
            v-if="formData?.icon"
            :src="formData.icon"
            width="96rpx"
            height="96rpx"
            radius="12rpx"
            mode="aspectFill"
            enable-preview
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="名称" :value="formData?.name || '-'" />
        <wd-cell title="排序" :value="formData?.sort ?? '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 表情管理入口 -->
      <wd-cell-group border class="mt-20rpx">
        <wd-cell
          title="表情列表"
          label="管理该表情包下的所有表情"
          is-link
          @click="handleManageItems"
        />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['im:manager:face-pack:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['im:manager:face-pack:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerFacePackVO } from '@/api/im/manager/face/pack'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteManagerFacePack, getManagerFacePack } from '@/api/im/manager/face/pack'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<ImManagerFacePackVO>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/face/pack/index')
}

/** 加载表情包详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getManagerFacePack(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 管理表情 */
function handleManageItems() {
  uni.navigateTo({
    url: `/pages-im/manager/face/item/index?packId=${props.id}`,
  })
}

/** 编辑表情包 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-im/manager/face/pack/form/index?id=${props.id}`,
  })
}

/** 删除表情包 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该表情包吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteManagerFacePack(Number(props.id))
    toast.success('删除成功')
    uni.$emit('im:manager:face-pack:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
