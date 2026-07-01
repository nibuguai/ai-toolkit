<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 到货通知详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="通知单编号" :value="formData?.code || '-'" />
        <wd-cell title="通知单名称" :value="formData?.name || '-'" />
        <wd-cell title="采购订单编号" :value="formData?.purchaseOrderCode || '-'" />
        <wd-cell title="供应商编码" :value="formData?.vendorCode || '-'" />
        <wd-cell title="供应商名称" :value="formData?.vendorName || '-'" />
        <wd-cell title="到货日期" :value="formatDate(formData?.arrivalDate) || '-'" />
        <wd-cell title="联系人" :value="formData?.contactName || '-'" />
        <wd-cell title="联系方式" :value="formData?.contactTelephone || '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_ARRIVAL_NOTICE_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <ArrivalNoticeLineList v-if="currentId" :notice-id="currentId" readonly />
      <view v-if="hasFooter" class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-20rpx text-28rpx text-[#333] font-semibold">
          通知操作
        </view>
        <view class="flex gap-16rpx text-28rpx">
          <view
            v-if="canUpdatePrepare"
            class="flex-1 rounded-8rpx bg-[#1677ff] py-20rpx text-center text-white"
            @click="handleEdit"
          >
            编辑
          </view>
          <view
            v-if="canDeletePrepare"
            class="flex-1 rounded-8rpx bg-[#f56c6c] py-20rpx text-center text-white"
            :class="deleting ? 'opacity-60' : ''"
            @click="handleDelete"
          >
            {{ deleting ? '删除中...' : '删除' }}
          </view>
          <view
            v-if="canSubmitPrepare"
            class="flex-1 rounded-8rpx bg-[#faad14] py-20rpx text-center text-white"
            :class="submitting ? 'opacity-60' : ''"
            @click="handleSubmitNotice"
          >
            {{ submitting ? '提交中...' : '提交' }}
          </view>
        </view>
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="hasFooter" content-class="flex gap-24rpx text-28rpx">
      <view
        v-if="canUpdatePrepare"
        class="flex-1 rounded-8rpx bg-[#1677ff] py-20rpx text-center text-white"
        @click="handleEdit"
      >
        编辑
      </view>
      <view
        v-if="canDeletePrepare"
        class="flex-1 rounded-8rpx bg-[#f56c6c] py-20rpx text-center text-white"
        :class="deleting ? 'opacity-60' : ''"
        @click="handleDelete"
      >
        {{ deleting ? '删除中...' : '删除' }}
      </view>
      <view
        v-if="canSubmitPrepare"
        class="flex-1 rounded-8rpx bg-[#faad14] py-20rpx text-center text-white"
        :class="submitting ? 'opacity-60' : ''"
        @click="handleSubmitNotice"
      >
        {{ submitting ? '提交中...' : '提交' }}
      </view>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { WmArrivalNoticeVO } from '@/api/mes/wm/arrivalnotice'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteArrivalNotice, getArrivalNotice, submitArrivalNotice } from '@/api/mes/wm/arrivalnotice'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmArrivalNoticeStatusEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import ArrivalNoticeLineList from '../components/arrival-notice-line-list.vue'

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
const formData = ref<WmArrivalNoticeVO>() // 详情数据
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/arrivalnotice/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前详情编号
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-arrival-notice:update'])
  && formData.value?.status === MesWmArrivalNoticeStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-arrival-notice:delete'])
  && formData.value?.status === MesWmArrivalNoticeStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:wm-arrival-notice:update'])
  && formData.value?.status === MesWmArrivalNoticeStatusEnum.PREPARE
))
const hasFooter = computed(() => canUpdatePrepare.value || canDeletePrepare.value || canSubmitPrepare.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/arrivalnotice/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getArrivalNotice(currentId.value)
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
    url: `/pages-mes/wm/arrivalnotice/form/index?id=${currentId.value}`,
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
    await deleteArrivalNotice(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:arrivalnotice:reload')
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    deleting.value = false
  }
}

/** 提交到货通知单 */
async function handleSubmitNotice() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该到货通知单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitArrivalNotice(currentId.value)
    toast.success('提交成功')
    await getDetail()
    uni.$emit('mes:wm:arrivalnotice:reload')
  } finally {
    submitting.value = false
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
