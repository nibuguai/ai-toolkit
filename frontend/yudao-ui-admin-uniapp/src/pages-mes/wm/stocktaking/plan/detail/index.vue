<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="盘点方案详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <wd-cell-group border>
          <wd-cell title="方案编码" :value="formData?.code || '-'" />
          <wd-cell title="方案名称" :value="formData?.name || '-'" />
          <wd-cell title="盘点类型">
            <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_WM_STOCK_TAKING_TYPE" :value="formData.type" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="开始时间" :value="formatDateTime(formData?.startTime) || '-'" />
          <wd-cell title="结束时间" :value="formatDateTime(formData?.endTime) || '-'" />
          <wd-cell title="是否盲盘">
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(formData?.blindFlag))" />
          </wd-cell>
          <wd-cell title="冻结库存">
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(formData?.frozen))" />
          </wd-cell>
          <wd-cell title="状态">
            <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="备注" :value="formData?.remark || '-'" />
          <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        </wd-cell-group>

        <PlanParamList :plan-id="planId" readonly />
        <view class="h-180rpx" />
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="canOperate" content-class="yd-detail-footer-actions">
      <wd-button
        v-if="canUpdate"
        class="flex-1" type="warning" @click="handleEdit"
      >
        编辑
      </wd-button>
      <wd-button
        v-if="canDelete"
        class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
      >
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { StockTakingPlanVO } from '@/api/mes/wm/stocktaking/plan'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteStockTakingPlan, getStockTakingPlan } from '@/api/mes/wm/stocktaking/plan'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import PlanParamList from '../components/plan-param-list.vue'

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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/stocktaking/plan/detail/index')
const formData = ref<StockTakingPlanVO>() // 详情数据
const deleting = ref(false) // 删除状态
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const planId = computed(() => getRouteQueryNumber('id'))
const canUpdate = computed(() => {
  return formData.value?.status === CommonStatusEnum.DISABLE && hasAccessByCodes(['mes:wm-stock-taking-plan:update'])
})
const canDelete = computed(() => {
  return formData.value?.status === CommonStatusEnum.DISABLE && hasAccessByCodes(['mes:wm-stock-taking-plan:delete'])
})
const canOperate = computed(() => canUpdate.value || canDelete.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/stocktaking/plan/index')
}

/** 加载详情 */
async function getDetail() {
  if (!planId.value) {
    return
  }
  const detailData = await getStockTakingPlan(planId.value)
    if (!detailData) {
      uni.showToast({ icon: 'none', title: '详情不存在，已返回列表' })
      // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 2 处 setTimeout(() => handleBack())）
      setTimeout(() => handleBack(), 300)
      return
    }
    formData.value = detailData
}

/** 初始化页面数据 */
async function initPage() {
  if (!planId.value) {
    formData.value = undefined
    return
  }
  if (!formData.value || formData.value.id !== planId.value) {
    await getDetail()
  }
}

/** 编辑 */
function handleEdit() {
  if (!planId.value) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/wm/stocktaking/plan/form/index?id=${planId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!planId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除盘点方案「${formData.value.name}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteStockTakingPlan(planId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:stocktaking:plan:reload')
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})

watch(planId, () => {
  initPage()
})
</script>
