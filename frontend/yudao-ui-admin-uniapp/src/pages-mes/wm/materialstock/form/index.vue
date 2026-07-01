<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="库存冻结状态"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 库存信息 -->
    <view class="p-24rpx">
      <wd-cell-group border>
        <wd-cell title="产品物料编码" :value="formData?.itemCode || '-'" />
        <wd-cell title="产品物料名称" :value="formData?.itemName || '-'" />
        <wd-cell title="规格型号" :value="formData?.specification || '-'" />
        <wd-cell title="在库数量" :value="quantityText" />
        <wd-cell title="批次号" :value="formData?.batchCode || '-'" />
        <wd-cell title="库存位置" :value="stockPlaceText" />
        <wd-cell title="入库日期" :value="formatDate(formData?.receiptTime) || '-'" />
        <wd-cell title="当前状态" :value="formData?.frozen ? '已冻结' : '可用'" />
      </wd-cell-group>

      <view class="mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
          冻结设置
        </view>
        <view class="mb-20rpx text-26rpx text-[#999]">
          冻结后该库存记录不可参与出库事务；解冻后恢复可用。
        </view>
        <wd-cell title="是否冻结" center>
          <wd-switch v-model="frozen" />
        </wd-cell>
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <MesFooterActions>
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存冻结状态
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { WmMaterialStockVO } from '@/api/mes/wm/materialstock'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getMaterialStock, updateMaterialStockFrozen } from '@/api/mes/wm/materialstock'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/materialstock/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const formLoading = ref(false) // 表单提交状态
const formData = ref<WmMaterialStockVO>() // 库存详情
const frozen = ref(false) // 冻结状态
const quantityText = computed(() => {
  if (!formData.value) {
    return '-'
  }
  return `${formData.value.quantity ?? '-'} ${formData.value.unitMeasureName || ''}`.trim()
})
const stockPlaceText = computed(() => {
  if (!formData.value) {
    return '-'
  }
  return [
    formData.value.warehouseName,
    formData.value.locationName,
    formData.value.areaName,
  ].filter(Boolean).join(' / ') || '-'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/materialstock/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  toast.loading('加载中...')
  try {
    formData.value = await getMaterialStock(currentId.value)
    frozen.value = formData.value.frozen
  } finally {
    toast.close()
  }
}

/** 加载页面数据 */
async function loadPageData() {
  if (!currentId.value) {
    formData.value = undefined
    frozen.value = false
    return
  }
  await getDetail()
}

/** 提交冻结状态 */
async function handleSubmit() {
  if (!formData.value) {
    return
  }
  if (formData.value.frozen === frozen.value) {
    toast.warning('冻结状态未变化')
    return
  }
  const actionText = frozen.value ? '冻结' : '解冻'
  const { confirm } = await uni.showModal({
    title: `${actionText}确认`,
    content: `确定要${actionText}该库存记录吗？`,
  })
  if (!confirm) {
    return
  }
  formLoading.value = true
  try {
    await updateMaterialStockFrozen({ id: formData.value.id, frozen: frozen.value })
    toast.success(`${actionText}成功`)
    uni.$emit('mes:wm:materialstock:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
