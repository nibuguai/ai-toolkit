<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 生产报工详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="报工单号" :value="formData?.code || '-'" />
        <wd-cell title="报工类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_PRO_FEEDBACK_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_PRO_FEEDBACK_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="生产工单" :value="formData?.workOrderCode || '-'" />
        <wd-cell title="生产任务" :value="formData?.taskCode || '-'" />
        <wd-cell title="工作站" :value="formData?.workstationName || '-'" />
        <wd-cell title="工序" :value="formData?.processName || '-'" />
        <wd-cell title="是否质检" :value="formData?.checkFlag ? '是' : '否'" />
      </wd-cell-group>

      <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
        产品与数量
      </view>
      <wd-cell-group border>
        <wd-cell title="物料编码" :value="formData?.itemCode || '-'" />
        <wd-cell title="物料名称" :value="formData?.itemName || '-'" />
        <wd-cell title="规格型号" :value="formData?.itemSpecification || '-'" />
        <wd-cell title="单位" :value="formData?.unitMeasureName || '-'" />
        <wd-cell title="排产数量" :value="formatNumber(formData?.scheduledQuantity)" />
        <wd-cell title="报工数量" :value="formatNumber(formData?.feedbackQuantity)" />
        <wd-cell title="合格数量" :value="formatNumber(formData?.qualifiedQuantity)" />
        <wd-cell title="不良数量" :value="formatNumber(formData?.unqualifiedQuantity)" />
        <wd-cell title="待检数量" :value="formatNumber(formData?.uncheckQuantity)" />
        <wd-cell title="工废数量" :value="formatNumber(formData?.laborScrapQuantity)" />
        <wd-cell title="料废数量" :value="formatNumber(formData?.materialScrapQuantity)" />
        <wd-cell title="其他废品" :value="formatNumber(formData?.otherScrapQuantity)" />
      </wd-cell-group>

      <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
        人员与备注
      </view>
      <wd-cell-group border>
        <wd-cell title="报工人" :value="formData?.feedbackUserNickname || '-'" />
        <wd-cell title="报工时间" :value="formatDateTime(formData?.feedbackTime) || '-'" />
        <wd-cell title="审核人" :value="formData?.approveUserNickname || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <ItemConsumeList v-if="showTraceLists" :feedback-id="formData?.id" />
      <ProductProduceList v-if="showTraceLists" :feedback-id="formData?.id" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="showFooter" content-class="yd-detail-footer-actions">
      <wd-button v-if="canEdit" class="flex-1" type="warning" @click="handleEdit">
        编辑
      </wd-button>
      <wd-button v-if="canSubmit" class="flex-1" type="primary" :loading="submitting" @click="handleSubmitFeedback">
        提交
      </wd-button>
      <wd-button v-if="canApprove" class="flex-1" type="success" @click="handleApprove">
        审批
      </wd-button>
      <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { ProFeedbackVO } from '@/api/mes/pro/feedback'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteFeedback, getFeedback, submitFeedback } from '@/api/mes/pro/feedback'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { useUserStore } from '@/store/user'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ItemConsumeList from '../components/item-consume-list.vue'
import ProductProduceList from '../components/product-produce-list.vue'

const props = defineProps<{
  id?: number | string
}>()

const MesProFeedbackStatusEnum = {
  PREPARE: 0,
  APPROVING: 2,
  UNCHECK: 3,
  FINISHED: 4,
  CANCELED: 5,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const userStore = useUserStore()
const dialog = useDialog()
const toast = useToast()
const formData = ref<ProFeedbackVO>() // 详情数据
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/pro/feedback/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const currentUserId = computed(() => userStore.userInfo?.userId)
const canEdit = computed(() =>
  hasAccessByCodes(['mes:pro-feedback:update']) && formData.value?.status === MesProFeedbackStatusEnum.PREPARE,
)
const canSubmit = computed(() =>
  hasAccessByCodes(['mes:pro-feedback:update']) && formData.value?.status === MesProFeedbackStatusEnum.PREPARE,
)
const canDelete = computed(() =>
  hasAccessByCodes(['mes:pro-feedback:delete']) && formData.value?.status === MesProFeedbackStatusEnum.PREPARE,
)
const canApprove = computed(() =>
  hasAccessByCodes(['mes:pro-feedback:approve'])
  && formData.value?.status === MesProFeedbackStatusEnum.APPROVING
  && formData.value?.approveUserId === currentUserId.value,
)
const showFooter = computed(() => canEdit.value || canSubmit.value || canDelete.value || canApprove.value)
const showTraceLists = computed(() =>
  !!formData.value?.id
  && formData.value.status !== MesProFeedbackStatusEnum.PREPARE
  && formData.value.status !== MesProFeedbackStatusEnum.APPROVING,
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/feedback/index')
}

/** 数值展示 */
function formatNumber(value?: number) {
  return value == null ? '-' : `${value}`
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    formData.value = undefined
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getFeedback(currentId.value)
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

/** 编辑 */
function handleEdit() {
  if (!currentId.value) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/pro/feedback/form/index?id=${currentId.value}&mode=update`,
  })
}

/** 提交 */
async function handleSubmitFeedback() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提交报工单',
      msg: `确定提交「${formData.value.code || formData.value.id}」吗？提交后将不能修改。`,
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitFeedback(formData.value.id)
    toast.success('提交成功')
    uni.$emit('mes:pro:feedback:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 审批 */
function handleApprove() {
  if (!currentId.value) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/pro/feedback/form/index?id=${currentId.value}&mode=approve`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除报工单',
      msg: `确定删除「${formData.value.code || formData.value.id}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteFeedback(formData.value.id)
    toast.success('删除成功')
    uni.$emit('mes:pro:feedback:reload')
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
