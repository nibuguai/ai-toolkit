<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="盘点任务详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="任务编码" :value="formData?.code || '-'" />
        <wd-cell title="任务名称" :value="formData?.name || '-'" />
        <wd-cell title="盘点类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_WM_STOCK_TAKING_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="盘点方案" :value="getPlanText()" />
        <wd-cell title="盘点日期" :value="formatDate(formData?.takingDate) || '-'" />
        <wd-cell title="盘点人" :value="formData?.userNickname || '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_STOCK_TAKING_TASK_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="是否盲盘">
          <dict-tag v-if="formData" :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(formData.blindFlag))" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="冻结库存">
          <dict-tag v-if="formData" :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(formData.frozen))" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="动态开始时间" :value="formatDateTime(formData?.startTime) || '-'" />
        <wd-cell title="动态结束时间" :value="formatDateTime(formData?.endTime) || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <view v-if="currentId" class="px-24rpx">
        <TaskLinePreview :task-id="currentId" />
        <TaskResultPreview :task-id="currentId" />
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="hasFooterActions" content-class="yd-detail-footer-actions">
      <wd-button
        v-if="canUpdate"
        class="flex-1" type="warning" @click="handleEdit"
      >
        编辑
      </wd-button>
      <wd-button
        v-if="canSubmit"
        class="flex-1" type="success" @click="handleSubmitTask"
      >
        提交
      </wd-button>
      <wd-button
        v-if="canExecute"
        class="flex-1" type="primary" @click="handleExecute"
      >
        执行盘点
      </wd-button>
      <wd-button
        v-if="canCancel"
        class="flex-1" type="warning" @click="handleCancelTask"
      >
        取消
      </wd-button>
      <wd-button
        v-if="canDelete"
        class="flex-1" type="error" :loading="deleting" @click="handleDelete"
      >
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { StockTakingTaskVO } from '@/api/mes/wm/stocktaking/task'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import {
  cancelStockTaking,
  deleteStockTaking,
  getStockTaking,
  submitStockTaking,
} from '@/api/mes/wm/stocktaking/task'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmStockTakingTaskStatusEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import TaskLinePreview from '../components/task-line-preview.vue'
import TaskResultPreview from '../components/task-result-preview.vue'

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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/stocktaking/task/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前详情编号
const formData = ref<StockTakingTaskVO>() // 详情数据
const deleting = ref(false) // 删除状态
const canUpdatePermission = computed(() => hasAccessByCodes(['mes:wm-stock-taking-task:update']))
const canDeletePermission = computed(() => hasAccessByCodes(['mes:wm-stock-taking-task:delete']))
const isPrepare = computed(() => formData.value?.status === MesWmStockTakingTaskStatusEnum.PREPARE)
const isApproving = computed(() => formData.value?.status === MesWmStockTakingTaskStatusEnum.APPROVING)
const canUpdate = computed(() => canUpdatePermission.value && isPrepare.value)
const canSubmit = computed(() => canUpdatePermission.value && isPrepare.value)
const canExecute = computed(() => canUpdatePermission.value && isApproving.value)
const canCancel = computed(() => canUpdatePermission.value && isApproving.value)
const canDelete = computed(() => canDeletePermission.value && isPrepare.value)
const hasFooterActions = computed(() => {
  return canUpdate.value || canSubmit.value || canExecute.value || canCancel.value || canDelete.value
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/stocktaking/task/index')
}

/** 盘点方案展示 */
function getPlanText() {
  if (!formData.value) {
    return '-'
  }
  if (formData.value.planCode && formData.value.planName) {
    return `${formData.value.planCode} / ${formData.value.planName}`
  }
  return formData.value.planName || formData.value.planCode || '-'
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getStockTaking(currentId.value)
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
  uni.navigateTo({ url: `/pages-mes/wm/stocktaking/task/form/index?id=${currentId.value}` })
}

/** 执行盘点 */
function handleExecute() {
  if (!currentId.value) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/wm/stocktaking/task/form/index?id=${currentId.value}&mode=execute` })
}

/** 提交任务 */
async function handleSubmitTask() {
  if (!currentId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认提交盘点任务「${formData.value.name}」吗？提交后将不能修改。`,
    })
  } catch {
    return
  }
  await submitStockTaking(currentId.value)
  toast.success('提交成功')
  uni.$emit('mes:wm:stocktaking:task:reload')
  getDetail()
}

/** 取消任务 */
async function handleCancelTask() {
  if (!currentId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认取消盘点任务「${formData.value.name}」吗？取消后不可恢复。`,
    })
  } catch {
    return
  }
  await cancelStockTaking(currentId.value)
  toast.success('取消成功')
  uni.$emit('mes:wm:stocktaking:task:reload')
  getDetail()
}

/** 删除 */
async function handleDelete() {
  if (!currentId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除盘点任务「${formData.value.name}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteStockTaking(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:stocktaking:task:reload')
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})

/** 页面显示时刷新 */
onShow(() => {
  getDetail()
})

watch(currentId, () => {
  getDetail()
})
</script>
