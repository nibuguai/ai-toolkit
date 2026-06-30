<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 销售出库详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view v-if="formData" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="出库单编号" :value="formData?.code || '-'" />
        <wd-cell title="出库单名称" :value="formData?.name || '-'" />
        <wd-cell title="发货通知单号" :value="formData?.noticeCode || '-'" />
        <wd-cell title="销售订单编号" :value="formData?.salesOrderCode || '-'" />
        <wd-cell title="客户编码" :value="formData?.clientCode || '-'" />
        <wd-cell title="客户名称" :value="formData?.clientName || '-'" />
        <wd-cell title="出库日期" :value="formatDate(formData?.salesDate || formData?.shipmentDate) || '-'" />
        <wd-cell title="单据状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_PRODUCT_SALES_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="收货人" :value="formData?.contactName || '-'" />
        <wd-cell title="联系方式" :value="formData?.contactTelephone || '-'" />
        <wd-cell title="收货地址" :value="formData?.contactAddress || '-'" />
        <wd-cell title="承运商" :value="formData?.carrier || '-'" />
        <wd-cell title="运输单号" :value="formData?.shippingNumber || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <ProductSalesLineList :sales-id="currentId" :notice-id="formData.noticeId" readonly />
      <view v-if="hasFooter" class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-20rpx text-28rpx text-[#333] font-semibold">
          销售出库操作
        </view>
        <view class="flex flex-wrap gap-16rpx text-28rpx">
          <view v-if="canUpdatePrepare" class="min-w-180rpx flex-1 rounded-8rpx bg-[#1677ff] py-20rpx text-center text-white" @click="handleEdit">
            编辑
          </view>
          <view v-if="canDeletePrepare" class="min-w-180rpx flex-1 rounded-8rpx bg-[#f56c6c] py-20rpx text-center text-white" :class="deleting ? 'opacity-60' : ''" @click="handleDelete">
            {{ deleting ? '删除中...' : '删除' }}
          </view>
          <view v-if="canSubmitPrepare" class="min-w-180rpx flex-1 rounded-8rpx bg-[#faad14] py-20rpx text-center text-white" :class="submitting ? 'opacity-60' : ''" @click="handleSubmitProductSales">
            {{ submitting ? '提交中...' : '提交' }}
          </view>
          <view v-if="canStock" class="min-w-180rpx flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white" @click="handleStock">
            拣货
          </view>
          <view v-if="canShipping" class="min-w-180rpx flex-1 rounded-8rpx bg-[#faad14] py-20rpx text-center text-white" @click="handleShipping">
            填写运单
          </view>
          <view v-if="canFinish" class="min-w-180rpx flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white" @click="handleFinish">
            执行出库
          </view>
          <view v-if="canCancelStatus" class="min-w-180rpx flex-1 rounded-8rpx bg-[#f56c6c] py-20rpx text-center text-white" @click="handleCancel">
            取消
          </view>
        </view>
      </view>
      <view class="h-180rpx" />
    </scroll-view>
    <view v-else class="flex-1 bg-white p-24rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmProductSalesVO } from '@/api/mes/wm/productsales'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteProductSales, getProductSales, submitProductSales } from '@/api/mes/wm/productsales'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmProductSalesStatusEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import ProductSalesLineList from '../components/product-sales-line-list.vue'

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
const formData = ref<WmProductSalesVO>() // 详情数据
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/productsales/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前详情编号
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:update'])
  && formData.value?.status === MesWmProductSalesStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:delete'])
  && formData.value?.status === MesWmProductSalesStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:update'])
  && formData.value?.status === MesWmProductSalesStatusEnum.PREPARE
))
const canStock = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:stock'])
  && formData.value?.status === MesWmProductSalesStatusEnum.APPROVING
))
const canShipping = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:shipping'])
  && formData.value?.status === MesWmProductSalesStatusEnum.SHIPPING
))
const canFinish = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:finish'])
  && formData.value?.status === MesWmProductSalesStatusEnum.APPROVED
))
const canCancelStatus = computed(() => (
  hasAccessByCodes(['mes:wm-product-sales:cancel'])
  && Boolean(formData.value)
  && [
    MesWmProductSalesStatusEnum.CONFIRMED,
    MesWmProductSalesStatusEnum.APPROVING,
    MesWmProductSalesStatusEnum.SHIPPING,
    MesWmProductSalesStatusEnum.APPROVED,
  ].includes(formData.value.status)
))
const hasFooter = computed(() => (
  canUpdatePrepare.value
  || canDeletePrepare.value
  || canSubmitPrepare.value
  || canStock.value
  || canShipping.value
  || canFinish.value
  || canCancelStatus.value
))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/productsales/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getProductSales(currentId.value)
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
  await getDetail()
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mes/wm/productsales/form/index?id=${currentId.value}` })
}

/** 拣货 */
function handleStock() {
  uni.navigateTo({ url: `/pages-mes/wm/productsales/form/index?id=${currentId.value}&mode=stock` })
}

/** 填写运单 */
function handleShipping() {
  uni.navigateTo({ url: `/pages-mes/wm/productsales/form/index?id=${currentId.value}&mode=shipping` })
}

/** 执行出库 */
function handleFinish() {
  uni.navigateTo({ url: `/pages-mes/wm/productsales/form/index?id=${currentId.value}&mode=finish` })
}

/** 取消 */
function handleCancel() {
  uni.navigateTo({ url: `/pages-mes/wm/productsales/form/index?id=${currentId.value}&mode=cancel` })
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
    await deleteProductSales(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:productsales:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交销售出库单 */
async function handleSubmitProductSales() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该销售出库单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitProductSales(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:productsales:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})

watch(currentId, () => {
  initPage()
})
</script>
