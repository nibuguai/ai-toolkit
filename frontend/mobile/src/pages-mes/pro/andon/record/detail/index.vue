<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 安灯呼叫记录详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
        呼叫信息
      </view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id ? String(formData.id) : '-'" />
        <wd-cell title="工作站编码" :value="formData?.workstationCode || '-'" />
        <wd-cell title="工作站名称" :value="formData?.workstationName || '-'" />
        <wd-cell title="生产工单" :value="formData?.workOrderCode || '-'" />
        <wd-cell title="工序名称" :value="formData?.processName || '-'" />
        <wd-cell title="发起人" :value="formData?.userNickname || '-'" />
        <wd-cell title="发起时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="呼叫原因" :value="formData?.reason || '-'" />
        <wd-cell title="级别">
          <dict-tag v-if="formData?.level != null" :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="formData.level" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="处置状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_PRO_ANDON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
      </wd-cell-group>

      <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
        处置信息
      </view>
      <wd-cell-group border>
        <wd-cell title="处置时间" :value="formatDateTime(formData?.handleTime) || '-'" />
        <wd-cell title="处置人" :value="formData?.handlerUserNickname || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="hasActiveActions" content-class="yd-detail-footer-actions">
      <wd-button
        v-if="canUpdate"
        class="flex-1"
        type="success"
        @click="handleDispose"
      >
        处置
      </wd-button>
      <wd-button
        v-if="canDelete"
        class="flex-1"
        type="danger"
        :loading="deleting"
        @click="handleDelete"
      >
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { ProAndonRecordVO } from '@/api/mes/pro/andon/record'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteAndonRecord, getAndonRecord } from '@/api/mes/pro/andon/record'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | string
}>()

const MesProAndonStatusEnum = {
  ACTIVE: 0,
  HANDLED: 1,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<ProAndonRecordVO>() // 详情数据
const deleting = ref(false) // 删除状态
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/pro/andon/record/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const canUpdate = computed(() => hasAccessByCodes(['mes:pro-andon-record:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:pro-andon-record:delete']))
const hasActiveActions = computed(() => {
  return formData.value?.status === MesProAndonStatusEnum.ACTIVE && (canUpdate.value || canDelete.value)
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/andon/record/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    formData.value = undefined
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getAndonRecord(currentId.value)
    if (!detailData) {
      uni.showToast({ icon: 'none', title: '详情不存在，已返回列表' })
      // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 2 处 setTimeout(() => handleBack())）
      setTimeout(() => handleBack(), 300)
      return
    }
    formData.value = detailData
  } finally {
    toast.close()
  }
}

/** 处置 */
function handleDispose() {
  if (!currentId.value) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/pro/andon/record/form/index?id=${currentId.value}&mode=update` })
}

/** 删除 */
async function handleDelete() {
  if (!currentId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${formData.value.reason || formData.value.id}」安灯呼叫记录吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteAndonRecord(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:pro:andon:record:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})

watch(currentId, () => {
  getDetail()
})
</script>
