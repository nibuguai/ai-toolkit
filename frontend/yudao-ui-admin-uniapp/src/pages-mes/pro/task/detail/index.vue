<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="pageTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="工单编码" :value="formData?.code || '-'" />
        <wd-cell title="工单名称" :value="formData?.name || '-'" />
        <wd-cell title="工单状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="工单来源">
          <dict-tag v-if="formData?.orderSourceType != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE" :value="formData.orderSourceType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="来源单据" :value="formData?.orderSourceCode || '-'" />
        <wd-cell title="产品编码" :value="formData?.productCode || '-'" />
        <wd-cell title="产品名称" :value="formData?.productName || '-'" />
        <wd-cell title="规格型号" :value="formData?.productSpecification || '-'" />
        <wd-cell title="单位" :value="formData?.unitMeasureName || '-'" />
        <wd-cell title="工单数量" :value="formData?.quantity ?? '-'" />
        <wd-cell title="已排产数量" :value="formData?.quantityScheduled ?? 0" />
        <wd-cell title="已生产数量" :value="formData?.quantityProduced ?? 0" />
        <wd-cell title="客户" :value="clientText" />
        <wd-cell title="需求日期" :value="formatDate(formData?.requestDate) || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <view v-if="routeProcessList.length === 0 && !loading" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#8a5a00]">
        当前产品未配置工艺路线，需先在工艺路线中维护产品工序后才能排产。
      </view>

      <ProcessTaskList
        v-for="process in routeProcessList"
        :key="process.processId"
        :work-order-id="workOrderId"
        :route-id="currentRouteId"
        :item-id="formData?.productId || 0"
        :process="process"
        :readonly="isReadonly"
        @reload="handleTaskReload"
      />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="!isReadonly && formData?.id" content-class="yd-detail-footer-actions">
      <wd-button class="flex-1" type="success" :loading="finishing" @click="handleFinish">
        完成工单
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { ProRouteProcessVO } from '@/api/mes/pro/route/process'
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getRouteProcessListByProduct } from '@/api/mes/pro/route/process'
import { finishWorkOrder, getWorkOrder } from '@/api/mes/pro/workorder'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import ProcessTaskList from '../components/process-task-list.vue'

const props = defineProps<{
  id?: number | string
  mode?: 'schedule' | 'detail' | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 页面加载状态
const finishing = ref(false) // 完成工单状态
const formData = ref<ProWorkOrderVO>() // 工单详情
const routeProcessList = ref<ProRouteProcessVO[]>([]) // 工艺路线工序列表
const currentRouteId = ref(0) // 当前工艺路线编号
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/pro/task/detail/index')
const workOrderId = computed(() => getRouteQueryNumber('id') || 0)
const routeMode = computed(() => getRouteQueryValue('mode') || props.mode)
const isReadonly = computed(() => routeMode.value !== 'schedule')
const pageTitle = computed(() => isReadonly.value ? '排产详情' : '生产排产')
const clientText = computed(() => {
  if (!formData.value?.clientName && !formData.value?.clientCode) {
    return '-'
  }
  return `${formData.value.clientCode || '-'} / ${formData.value.clientName || '-'}`
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/task/index')
}

/** 加载工单与工艺路线 */
async function getDetail() {
  if (!workOrderId.value) {
    formData.value = undefined
    routeProcessList.value = []
    currentRouteId.value = 0
    return
  }
  loading.value = true
  try {
    const detailData = await getWorkOrder(workOrderId.value)
    if (!detailData) {
      uni.showToast({ icon: 'none', title: '详情不存在，已返回列表' })
      // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 2 处 setTimeout(() => handleBack())）
      setTimeout(() => handleBack(), 300)
      return
    }
    formData.value = detailData
    if (formData.value.productId) {
      const processes = await getRouteProcessListByProduct(formData.value.productId)
      const sorted = [...processes].sort((a, b) => a.sort - b.sort)
      routeProcessList.value = sorted
      currentRouteId.value = sorted[0]?.routeId || 0
    }
  } finally {
    loading.value = false
  }
}

/** 任务变更后刷新工单 */
async function handleTaskReload() {
  uni.$emit('mes:pro:task:reload')
  if (workOrderId.value) {
    formData.value = await getWorkOrder(workOrderId.value)
  }
}

/** 完成工单 */
async function handleFinish() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认要完成该工单吗？完成后工单下所有任务将标记为已完成。',
    })
  } catch {
    return
  }
  finishing.value = true
  try {
    await finishWorkOrder(formData.value.id)
    toast.success('工单已完成')
    uni.$emit('mes:pro:task:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    finishing.value = false
  }
}

onMounted(() => {
  getDetail()
})

watch(workOrderId, () => {
  getDetail()
})
</script>
