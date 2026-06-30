<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 生产报工管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无生产报工数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.code || '-' }}
                </view>
                <view class="mt-6rpx text-24rpx text-[#999]">
                  {{ item.workOrderCode || '-' }} / {{ item.taskCode || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_PRO_FEEDBACK_STATUS" :value="item.status" />
            </view>
            <view class="mb-14rpx flex flex-wrap gap-12rpx">
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_PRO_FEEDBACK_TYPE" :value="item.type" />
              <wd-tag v-if="item.checkFlag" plain type="warning">
                待质检工序
              </wd-tag>
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>工作站：{{ item.workstationName || '-' }}</view>
              <view>工序：{{ item.processName || '-' }}</view>
              <view>产品：{{ item.itemCode || '-' }} / {{ item.itemName || '-' }}</view>
              <view>规格：{{ item.itemSpecification || '-' }} / 单位：{{ item.unitMeasureName || '-' }}</view>
              <view>报工数量：{{ item.feedbackQuantity ?? '-' }}</view>
              <view>报工人：{{ item.feedbackUserNickname || '-' }}</view>
              <view>报工时间：{{ formatDateTime(item.feedbackTime) || '-' }}</view>
              <view>审核人：{{ item.approveUserNickname || '-' }}</view>
            </view>
          </view>
          <view
            v-if="hasDraftActions(item) || hasApproveAction(item)"
            class="flex border-t border-[#f0f0f0] text-28rpx"
            @click.stop
          >
            <view
              v-if="hasAccessByCodes(['mes:pro-feedback:update']) && item.status === MesProFeedbackStatusEnum.PREPARE"
              class="flex-1 py-18rpx text-center text-[#1677ff]"
              @click="handleEdit(item)"
            >
              编辑
            </view>
            <view
              v-if="hasAccessByCodes(['mes:pro-feedback:update']) && item.status === MesProFeedbackStatusEnum.PREPARE"
              class="flex-1 py-18rpx text-center text-[#52c41a]"
              @click="handleSubmitFeedback(item)"
            >
              提交
            </view>
            <view
              v-if="hasAccessByCodes(['mes:pro-feedback:delete']) && item.status === MesProFeedbackStatusEnum.PREPARE"
              class="flex-1 py-18rpx text-center text-[#f56c6c]"
              @click="handleDelete(item)"
            >
              删除
            </view>
            <view
              v-if="hasApproveAction(item)"
              class="flex-1 py-18rpx text-center text-[#1677ff]"
              @click="handleApprove(item)"
            >
              审批
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:pro-feedback:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ProFeedbackQueryParams, ProFeedbackVO } from '@/api/mes/pro/feedback'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { deleteFeedback, getFeedbackPage, submitFeedback } from '@/api/mes/pro/feedback'
import { useAccess } from '@/hooks/useAccess'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const MesProFeedbackStatusEnum = {
  PREPARE: 0,
  APPROVING: 2,
  UNCHECK: 3,
  FINISHED: 4,
  CANCELED: 5,
} as const

const { hasAccessByCodes } = useAccess()
const userStore = useUserStore()
const dialog = useDialog()
const toast = useToast()
const list = ref<ProFeedbackVO[]>([]) // 列表数据
const pagingRef = ref() // 分页组件引用
const queryParams = ref<Partial<ProFeedbackQueryParams>>({}) // 查询参数
const currentUserId = computed(() => userStore.userInfo?.userId)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getFeedbackPage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 是否有草稿操作 */
function hasDraftActions(item: ProFeedbackVO) {
  return item.status === MesProFeedbackStatusEnum.PREPARE && (hasAccessByCodes(['mes:pro-feedback:update']) || hasAccessByCodes(['mes:pro-feedback:delete']))
}

/** 是否有审批操作 */
function hasApproveAction(item: ProFeedbackVO) {
  return hasAccessByCodes(['mes:pro-feedback:approve'])
    && item.status === MesProFeedbackStatusEnum.APPROVING
    && item.approveUserId === currentUserId.value
}

/** 搜索按钮操作 */
function handleQuery(data: Partial<ProFeedbackQueryParams>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({})
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-mes/pro/feedback/form/index?mode=create',
  })
}

/** 查看详情 */
function handleDetail(item: ProFeedbackVO) {
  uni.navigateTo({
    url: `/pages-mes/pro/feedback/detail/index?id=${item.id}`,
  })
}

/** 编辑 */
function handleEdit(item: ProFeedbackVO) {
  uni.navigateTo({
    url: `/pages-mes/pro/feedback/form/index?id=${item.id}&mode=update`,
  })
}

/** 提交 */
async function handleSubmitFeedback(item: ProFeedbackVO) {
  try {
    await dialog.confirm({
      title: '提交报工单',
      msg: `确定提交「${item.code || item.id}」吗？提交后将不能修改。`,
    })
  } catch {
    return
  }
  await submitFeedback(item.id)
  toast.success('提交成功')
  reload()
}

/** 审批 */
function handleApprove(item: ProFeedbackVO) {
  uni.navigateTo({
    url: `/pages-mes/pro/feedback/form/index?id=${item.id}&mode=approve`,
  })
}

/** 删除 */
async function handleDelete(item: ProFeedbackVO) {
  try {
    await dialog.confirm({
      title: '删除报工单',
      msg: `确定删除「${item.code || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteFeedback(item.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:pro:feedback:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:pro:feedback:reload', reload)
})
</script>
