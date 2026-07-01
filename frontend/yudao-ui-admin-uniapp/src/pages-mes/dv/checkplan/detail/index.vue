<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 点检方案详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="方案编码" :value="formData?.code || '-'" />
        <wd-cell title="方案名称" :value="formData?.name || '-'" />
        <wd-cell title="方案类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_DV_SUBJECT_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="周期数量" :value="formData?.cycleCount != null ? String(formData.cycleCount) : '-'" />
        <wd-cell title="周期类型">
          <dict-tag v-if="formData?.cycleType != null" :type="DICT_TYPE.MES_DV_CYCLE_TYPE" :value="formData.cycleType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="开始日期" :value="formatDate(formData?.startDate) || '-'" />
        <wd-cell title="结束日期" :value="formatDate(formData?.endDate) || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_DV_CHECK_PLAN_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>
      <MachineryList :plan-id="currentId" readonly />
      <SubjectList :plan-id="currentId" readonly />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="hasFooter" content-class="yd-detail-footer-actions">
      <wd-button
        v-if="canUpdatePrepare"
        class="flex-1" type="warning" @click="handleEdit"
      >
        编辑
      </wd-button>
      <wd-button
        v-if="canDeletePrepare"
        class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
      >
        删除
      </wd-button>
      <wd-button
        v-if="canEnable"
        class="flex-1" type="success" @click="handleEnable"
      >
        启用
      </wd-button>
      <wd-button
        v-if="canDisable"
        class="flex-1" type="warning" @click="handleDisable"
      >
        停用
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { DvCheckPlanVO } from '@/api/mes/dv/checkplan'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteCheckPlan, disableCheckPlan, enableCheckPlan, getCheckPlan } from '@/api/mes/dv/checkplan'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesDvCheckPlanStatusEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import MachineryList from '../components/machinery-list.vue'
import SubjectList from '../components/subject-list.vue'

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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/dv/checkplan/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前详情编号
const formData = ref<DvCheckPlanVO>() // 详情数据
const deleting = ref(false) // 删除状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:dv-check-plan:update'])
  && formData.value?.status === MesDvCheckPlanStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:dv-check-plan:delete'])
  && formData.value?.status === MesDvCheckPlanStatusEnum.PREPARE
))
const canEnable = computed(() => (
  hasAccessByCodes(['mes:dv-check-plan:update'])
  && formData.value?.status === MesDvCheckPlanStatusEnum.PREPARE
))
const canDisable = computed(() => (
  hasAccessByCodes(['mes:dv-check-plan:update'])
  && formData.value?.status === MesDvCheckPlanStatusEnum.ENABLED
))
const hasFooter = computed(() => (
  canUpdatePrepare.value || canDeletePrepare.value || canEnable.value || canDisable.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/checkplan/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getCheckPlan(currentId.value)
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
    url: `/pages-mes/dv/checkplan/form/index?id=${currentId.value}`,
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
      msg: `确定要删除「${formData.value.name || formData.value.code}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteCheckPlan(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:dv:checkplan:reload')
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    deleting.value = false
  }
}

/** 启用 */
async function handleEnable() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认启用该点检保养方案？启用后将不可修改或删除。',
    })
  } catch {
    return
  }
  await enableCheckPlan(currentId.value)
  toast.success('启用成功')
  await getDetail()
  uni.$emit('mes:dv:checkplan:reload')
}

/** 停用 */
async function handleDisable() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认停用该点检保养方案？',
    })
  } catch {
    return
  }
  await disableCheckPlan(currentId.value)
  toast.success('停用成功')
  await getDetail()
  uni.$emit('mes:dv:checkplan:reload')
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
