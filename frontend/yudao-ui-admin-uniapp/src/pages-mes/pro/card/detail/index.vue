<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="流转卡详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="流转卡编码" :value="formData?.code || '-'" />
        <wd-cell title="生产工单" :value="workOrderText" />
        <wd-cell title="批次号" :value="formData?.batchCode || '-'" />
        <wd-cell title="产品编码" :value="formData?.itemCode || '-'" />
        <wd-cell title="产品名称" :value="formData?.itemName || '-'" />
        <wd-cell title="规格型号" :value="formData?.specification || '-'" />
        <wd-cell title="单位" :value="formData?.unitMeasureName || '-'" />
        <wd-cell title="流转数量" :value="formData?.transferedQuantity ?? '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <view class="mx-24rpx mt-24rpx">
        <BarcodePreview
          v-if="barcodeData"
          :content="barcodeData.content"
          :format="barcodeData.format"
        />
        <view v-else class="rounded-12rpx bg-[#f7faff] p-20rpx text-24rpx text-[#666]">
          流转卡保存后后端会自动生成条码；当前未查询到该流转卡条码，请从条码管理按业务类型“流转卡”核对。
        </view>
      </view>
      <CardProcessList v-if="cardId" :card-id="cardId" :editable="canEditProcess" @changed="getDetail" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="formData" content-class="yd-detail-footer-actions">
      <wd-button v-if="canEdit" class="flex-1" type="warning" @click="handleEdit">
        编辑
      </wd-button>
      <wd-button v-if="canSubmit" class="flex-1" type="primary" @click="handleSubmitCard">
        提交
      </wd-button>
      <wd-button v-if="canFinish" class="flex-1" type="success" @click="handleFinish">
        完成
      </wd-button>
      <wd-button v-if="canCancel" class="flex-1" type="danger" @click="handleCancel">
        取消
      </wd-button>
      <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { ProCardVO } from '@/api/mes/pro/card'
import type { WmBarcodeVO } from '@/api/mes/wm/barcode'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { cancelCard, deleteCard, finishCard, getCard, submitCard } from '@/api/mes/pro/card'
import { getBarcodeByBusiness } from '@/api/mes/wm/barcode'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import CardProcessList from '../components/card-process-list.vue'
import BarcodePreview from '@/pages-mes/wm/barcode/components/barcode-preview.vue'

const props = defineProps<{
  id?: number | string
}>()
const MesProCardStatusEnum = {
  PREPARE: 0,
  CONFIRMED: 1,
} as const
const BarcodeBizTypeEnum = {
  PROCARD: 300,
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
const formData = ref<ProCardVO>() // 详情数据
const barcodeData = ref<WmBarcodeVO>() // 条码数据
const deleting = ref(false) // 删除状态
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/pro/card/detail/index')
const cardId = computed(() => getRouteQueryNumber('id') || 0)
const workOrderText = computed(() => `${formData.value?.workOrderCode || '-'} / ${formData.value?.workOrderName || '-'}`)
const isPrepare = computed(() => formData.value?.status === MesProCardStatusEnum.PREPARE)
const isConfirmed = computed(() => formData.value?.status === MesProCardStatusEnum.CONFIRMED)
const canEdit = computed(() => isPrepare.value && hasAccessByCodes(['mes:pro-card:update']))
const canEditProcess = computed(() => isPrepare.value && hasAccessByCodes(['mes:pro-card:update']))
const canSubmit = computed(() => isPrepare.value && hasAccessByCodes(['mes:pro-card:update']))
const canFinish = computed(() => isConfirmed.value && hasAccessByCodes(['mes:pro-card:finish']))
const canCancel = computed(() => isConfirmed.value && hasAccessByCodes(['mes:pro-card:update']))
const canDelete = computed(() => isPrepare.value && hasAccessByCodes(['mes:pro-card:delete']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/card/index')
}

/** 加载详情 */
async function getDetail() {
  if (!cardId.value) {
    formData.value = undefined
    barcodeData.value = undefined
    return
  }
  const detailData = await getCard(cardId.value)
    if (!detailData) {
      uni.showToast({ icon: 'none', title: '详情不存在，已返回列表' })
      // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 2 处 setTimeout(() => handleBack())）
      setTimeout(() => handleBack(), 300)
      return
    }
    formData.value = detailData
  await getBarcodeDetail()
}

/** 加载条码详情 */
async function getBarcodeDetail() {
  if (!cardId.value) {
    return
  }
  try {
    barcodeData.value = await getBarcodeByBusiness(BarcodeBizTypeEnum.PROCARD, cardId.value)
  } catch {
    barcodeData.value = undefined
  }
}

/** 编辑 */
function handleEdit() {
  if (!cardId.value) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/pro/card/form/index?id=${cardId.value}` })
}

/** 提交流转卡 */
async function handleSubmitCard() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确认提交该流转卡？提交后将不能修改。' })
  } catch {
    return
  }
  await submitCard(formData.value.id)
  toast.success('提交成功')
  uni.$emit('mes:pro:card:reload')
  await getDetail()
}

/** 完成流转卡 */
async function handleFinish() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确认完成该流转卡？' })
  } catch {
    return
  }
  await finishCard(formData.value.id)
  toast.success('完成成功')
  uni.$emit('mes:pro:card:reload')
  await getDetail()
}

/** 取消流转卡 */
async function handleCancel() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确认取消该流转卡？取消后不可恢复。' })
  } catch {
    return
  }
  await cancelCard(formData.value.id)
  toast.success('取消成功')
  uni.$emit('mes:pro:card:reload')
  await getDetail()
}

/** 删除 */
async function handleDelete() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该流转卡吗？删除后会级联删除工序记录。' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteCard(formData.value.id)
    toast.success('删除成功')
    uni.$emit('mes:pro:card:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  getDetail()
})

watch(cardId, () => {
  getDetail()
})
</script>
