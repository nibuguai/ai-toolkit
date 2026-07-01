<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="排班计划详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="计划编码" :value="formData?.code || '-'" />
        <wd-cell title="计划名称" :value="formData?.name || '-'" />
        <wd-cell title="班组类型">
          <dict-tag v-if="formData?.calendarType != null" :type="DICT_TYPE.MES_CAL_CALENDAR_TYPE" :value="formData.calendarType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="开始日期" :value="formatDate(formData?.startDate) || '-'" />
        <wd-cell title="结束日期" :value="formatDate(formData?.endDate) || '-'" />
        <wd-cell title="轮班方式">
          <dict-tag v-if="formData?.shiftType != null" :type="DICT_TYPE.MES_CAL_SHIFT_TYPE" :value="formData.shiftType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="倒班方式">
          <dict-tag v-if="formData?.shiftMethod != null" :type="DICT_TYPE.MES_CAL_SHIFT_METHOD" :value="formData.shiftMethod" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="倒班天数" :value="formData?.shiftCount ? `${formData.shiftCount} 天` : '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_CAL_PLAN_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <PlanShiftList :plan-id="planId" :editable="false" />
      <PlanTeamList :plan-id="planId" :editable="false" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions content-class="yd-detail-footer-actions">
      <wd-button v-if="isPrepare && hasAccessByCodes(['mes:cal-plan:update'])" class="flex-1" type="warning" @click="handleEdit">
        编辑
      </wd-button>
      <wd-button v-if="isPrepare && hasAccessByCodes(['mes:cal-plan:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { CalPlanVO } from '@/api/mes/cal/plan'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deletePlan, getPlan } from '@/api/mes/cal/plan'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import PlanShiftList from '../components/plan-shift-list.vue'
import PlanTeamList from '../components/plan-team-list.vue'

const props = defineProps<{ id?: number | string }>()
const MesCalPlanStatusEnum = {
  PREPARE: 0,
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
const formData = ref<CalPlanVO>() // 详情数据
const deleting = ref(false) // 删除状态
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/cal/plan/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const planId = computed(() => getRouteQueryNumber('id'))
const isPrepare = computed(() => formData.value?.status === MesCalPlanStatusEnum.PREPARE)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/cal/plan/index')
}

/** 加载详情 */
async function getDetail() {
  if (!planId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getPlan(planId.value)
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
  if (!planId.value) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/cal/plan/form/index?id=${planId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!planId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除确认',
      msg: `确定要删除「${formData.value?.name || formData.value?.code || planId.value}」排班计划吗？删除后会级联清理班次和计划班组关联。`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePlan(planId.value)
    toast.success('删除成功')
    uni.$emit('mes:cal:plan:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  getDetail()
})

watch(planId, () => {
  getDetail()
})
</script>
