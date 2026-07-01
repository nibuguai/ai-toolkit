<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 维修工单详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="维修单编号" :value="formData?.code || '-'" />
        <wd-cell title="维修单名称" :value="formData?.name || '-'" />
        <wd-cell title="设备编码" :value="formData?.machineryCode || '-'" />
        <wd-cell title="设备名称" :value="formData?.machineryName || '-'" />
        <wd-cell title="品牌" :value="formData?.machineryBrand || '-'" />
        <wd-cell title="规格型号" :value="formData?.machinerySpecification || '-'" />
        <wd-cell title="报修日期" :value="formatDateTime(formData?.requireDate) || '-'" />
        <wd-cell title="维修完成日期" :value="formatDateTime(formData?.finishDate) || '-'" />
        <wd-cell title="维修人员" :value="formData?.acceptedUserNickname || '-'" />
        <wd-cell title="验收日期" :value="formatDateTime(formData?.confirmDate) || '-'" />
        <wd-cell title="验收人员" :value="formData?.confirmUserNickname || '-'" />
        <wd-cell title="维修结果">
          <dict-tag v-if="formData?.result != null" :type="DICT_TYPE.MES_DV_REPAIR_RESULT" :value="formData.result" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_DV_REPAIR_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>
      <RepairLineList :repair-id="currentId" readonly />
      <view v-if="hasFooter" class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-20rpx text-28rpx text-[#333] font-semibold">
          工单操作
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
            @click="handleSubmitRepair"
          >
            {{ submitting ? '提交中...' : '提交' }}
          </view>
          <view
            v-if="canConfirmRepair"
            class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
            @click="handleConfirm"
          >
            完成维修
          </view>
          <view
            v-if="canFinishRepair"
            class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
            @click="handleFinish"
          >
            验收
          </view>
        </view>
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="hasFooter">
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
        @click="handleSubmitRepair"
      >
        {{ submitting ? '提交中...' : '提交' }}
      </view>
      <view
        v-if="canConfirmRepair"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        @click="handleConfirm"
      >
        完成维修
      </view>
      <view
        v-if="canFinishRepair"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        @click="handleFinish"
      >
        验收
      </view>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { DvRepairVO } from '@/api/mes/dv/repair'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteRepair, getRepair, submitRepair } from '@/api/mes/dv/repair'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesDvRepairStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import RepairLineList from '../components/repair-line-list.vue'

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
const formData = ref<DvRepairVO>() // 详情数据
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/dv/repair/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前详情编号
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:dv-repair:update'])
  && formData.value?.status === MesDvRepairStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:dv-repair:delete'])
  && formData.value?.status === MesDvRepairStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:dv-repair:update'])
  && formData.value?.status === MesDvRepairStatusEnum.PREPARE
))
const canConfirmRepair = computed(() => (
  hasAccessByCodes(['mes:dv-repair:update'])
  && formData.value?.status === MesDvRepairStatusEnum.CONFIRMED
))
const canFinishRepair = computed(() => (
  hasAccessByCodes(['mes:dv-repair:update'])
  && formData.value?.status === MesDvRepairStatusEnum.APPROVING
))
const hasFooter = computed(() => (
  canUpdatePrepare.value
  || canDeletePrepare.value
  || canSubmitPrepare.value
  || canConfirmRepair.value
  || canFinishRepair.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/repair/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getRepair(currentId.value)
    if (!detailData) {
      uni.showToast({ icon: 'none', title: '详情不存在，已返回列表' })
      // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
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
    url: `/pages-mes/dv/repair/form/index?id=${currentId.value}`,
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
    await deleteRepair(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:dv:repair:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交维修工单 */
async function handleSubmitRepair() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该维修工单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitRepair(currentId.value)
    toast.success('提交成功')
    await getDetail()
    uni.$emit('mes:dv:repair:reload')
  } finally {
    submitting.value = false
  }
}

/** 完成维修 */
function handleConfirm() {
  uni.navigateTo({
    url: `/pages-mes/dv/repair/form/index?id=${currentId.value}&mode=confirm`,
  })
}

/** 验收 */
function handleFinish() {
  uni.navigateTo({
    url: `/pages-mes/dv/repair/form/index?id=${currentId.value}&mode=finish`,
  })
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
