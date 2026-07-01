<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 生产领料详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="领料单编号" :value="formData?.code || '-'" />
        <wd-cell title="领料单名称" :value="formData?.name || '-'" />
        <wd-cell title="生产工单" :value="formData?.workOrderCode || '-'" />
        <wd-cell title="工作站编码" :value="formData?.workstationCode || '-'" />
        <wd-cell title="工作站名称" :value="formData?.workstationName || '-'" />
        <wd-cell title="客户编号" :value="formData?.clientCode || '-'" />
        <wd-cell title="客户名称" :value="formData?.clientName || '-'" />
        <wd-cell title="领料日期" :value="formatDateTime(formData?.issueDate) || '-'" />
        <wd-cell title="需求时间" :value="formatDateTime(formData?.requiredTime) || '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_PRODUCT_ISSUE_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <ProductIssueLineList v-if="currentId" :issue-id="currentId" readonly />

      <view v-if="hasFooter" class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-20rpx text-28rpx text-[#333] font-semibold">
          领料操作
        </view>
        <view class="flex flex-wrap gap-16rpx text-28rpx">
          <view v-if="canUpdatePrepare" class="min-w-180rpx flex-1 rounded-8rpx bg-[#1677ff] py-20rpx text-center text-white" @click="handleEdit">
            编辑
          </view>
          <view v-if="canDeletePrepare" class="min-w-180rpx flex-1 rounded-8rpx bg-[#f56c6c] py-20rpx text-center text-white" :class="deleting ? 'opacity-60' : ''" @click="handleDelete">
            {{ deleting ? '删除中...' : '删除' }}
          </view>
          <view v-if="canSubmitPrepare" class="min-w-180rpx flex-1 rounded-8rpx bg-[#faad14] py-20rpx text-center text-white" :class="submitting ? 'opacity-60' : ''" @click="handleSubmitIssue">
            {{ submitting ? '提交中...' : '提交' }}
          </view>
          <view v-if="canStockApproving" class="min-w-180rpx flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white" @click="handleStock">
            执行拣货
          </view>
          <view v-if="canFinishApproved" class="min-w-180rpx flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white" @click="handleFinish">
            完成
          </view>
          <view v-if="canCancelActive" class="min-w-180rpx flex-1 rounded-8rpx bg-[#f56c6c] py-20rpx text-center text-white" :class="canceling ? 'opacity-60' : ''" @click="handleCancelIssue">
            {{ canceling ? '取消中...' : '取消' }}
          </view>
        </view>
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="hasFooter" content-class="flex gap-24rpx text-28rpx">
      <view v-if="canUpdatePrepare" class="flex-1 rounded-8rpx bg-[#1677ff] py-20rpx text-center text-white" @click="handleEdit">
        编辑
      </view>
      <view v-if="canSubmitPrepare" class="flex-1 rounded-8rpx bg-[#faad14] py-20rpx text-center text-white" :class="submitting ? 'opacity-60' : ''" @click="handleSubmitIssue">
        {{ submitting ? '提交中...' : '提交' }}
      </view>
      <view v-if="canStockApproving" class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white" @click="handleStock">
        执行拣货
      </view>
      <view v-if="canFinishApproved" class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white" @click="handleFinish">
        完成
      </view>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { WmProductIssueVO } from '@/api/mes/wm/productissue'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { cancelProductIssue, deleteProductIssue, getProductIssue, submitProductIssue } from '@/api/mes/wm/productissue'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmProductIssueStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ProductIssueLineList from '../components/product-issue-line-list.vue'

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
const formData = ref<WmProductIssueVO>() // 详情数据
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/productissue/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前详情编号
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canceling = ref(false) // 取消状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-product-issue:update'])
  && formData.value?.status === MesWmProductIssueStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-product-issue:delete'])
  && formData.value?.status === MesWmProductIssueStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:wm-product-issue:update'])
  && formData.value?.status === MesWmProductIssueStatusEnum.PREPARE
))
const canStockApproving = computed(() => (
  hasAccessByCodes(['mes:wm-product-issue:update'])
  && formData.value?.status === MesWmProductIssueStatusEnum.APPROVING
))
const canFinishApproved = computed(() => (
  hasAccessByCodes(['mes:wm-product-issue:finish'])
  && formData.value?.status === MesWmProductIssueStatusEnum.APPROVED
))
const canCancelActive = computed(() => (
  hasAccessByCodes(['mes:wm-product-issue:update'])
  && [MesWmProductIssueStatusEnum.APPROVING, MesWmProductIssueStatusEnum.APPROVED].includes(formData.value?.status ?? -1)
))
const hasFooter = computed(() => (
  canUpdatePrepare.value
  || canDeletePrepare.value
  || canSubmitPrepare.value
  || canStockApproving.value
  || canFinishApproved.value
  || canCancelActive.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/productissue/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getProductIssue(currentId.value)
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

/** 初始化页面数据 */
async function initPage() {
  if (!currentId.value) {
    formData.value = undefined
    return
  }
  if (!formData.value || formData.value.id !== currentId.value) {
    await getDetail()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-mes/wm/productissue/form/index?id=${currentId.value}`,
  })
}

/** 执行拣货 */
function handleStock() {
  uni.navigateTo({
    url: `/pages-mes/wm/productissue/form/index?id=${currentId.value}&mode=stock`,
  })
}

/** 完成领料 */
function handleFinish() {
  uni.navigateTo({
    url: `/pages-mes/wm/productissue/form/index?id=${currentId.value}&mode=finish`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!currentId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${formData.value.code || formData.value.name || formData.value.id}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteProductIssue(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:productissue:reload')
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    deleting.value = false
  }
}

/** 提交生产领料单 */
async function handleSubmitIssue() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该领料出库单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitProductIssue(currentId.value)
    toast.success('提交成功')
    await getDetail()
    uni.$emit('mes:wm:productissue:reload')
  } finally {
    submitting.value = false
  }
}

/** 取消生产领料单 */
async function handleCancelIssue() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该领料出库单？取消后不可恢复。',
    })
  } catch {
    return
  }
  canceling.value = true
  try {
    await cancelProductIssue(currentId.value)
    toast.success('取消成功')
    await getDetail()
    uni.$emit('mes:wm:productissue:reload')
  } finally {
    canceling.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})

onShow(() => {
  initPage()
})

watch(currentId, () => {
  initPage()
})
</script>
