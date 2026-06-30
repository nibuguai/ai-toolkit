<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 库存台账详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="p-24rpx">
      <wd-cell-group border>
        <wd-cell title="产品物料编码" :value="formData?.itemCode || '-'" />
        <wd-cell title="产品物料名称" :value="formData?.itemName || '-'" />
        <wd-cell title="规格型号" :value="formData?.specification || '-'" />
        <wd-cell title="在库数量" :value="quantityText" />
        <wd-cell title="批次号" :value="formData?.batchCode || '-'" />
        <wd-cell title="仓库" :value="formData?.warehouseName || '-'" />
        <wd-cell title="库区" :value="formData?.locationName || '-'" />
        <wd-cell title="库位" :value="formData?.areaName || '-'" />
        <wd-cell title="供应商" :value="formData?.vendorName || '-'" />
        <wd-cell title="入库日期" :value="formatDate(formData?.receiptTime) || '-'" />
        <wd-cell title="冻结状态">
          <view
            class="inline-flex rounded-999rpx px-16rpx py-6rpx text-24rpx"
            :class="formData?.frozen ? 'bg-[#fff1f0] text-[#f5222d]' : 'bg-[#f6ffed] text-[#52c41a]'"
          >
            {{ formData?.frozen ? '已冻结' : '可用' }}
          </view>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <MesFooterActions content-class="yd-detail-footer-actions">
      <wd-button
        v-if="hasAccessByCodes(['mes:wm-material-stock:update'])"
        class="flex-1"
        :type="formData?.frozen ? 'success' : 'warning'"
        :loading="frozenLoading"
        @click="handleFrozenChange"
      >
        {{ formData?.frozen ? '解除冻结' : '冻结库存' }}
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { WmMaterialStockVO } from '@/api/mes/wm/materialstock'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getMaterialStock, updateMaterialStockFrozen } from '@/api/mes/wm/materialstock'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { formatDate, formatDateTime } from '@/utils/date'

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
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/materialstock/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const formData = ref<WmMaterialStockVO>() // 详情数据
const frozenLoading = ref(false) // 冻结操作状态
const quantityText = computed(() => {
  if (!formData.value) {
    return '-'
  }
  return `${formData.value.quantity ?? '-'} ${formData.value.unitMeasureName || ''}`.trim()
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
  try {
    toast.loading('加载中...')
    const detailData = await getMaterialStock(currentId.value)
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

/** 冻结状态切换 */
async function handleFrozenChange() {
  if (!formData.value || frozenLoading.value) {
    return
  }
  const targetFrozen = !formData.value.frozen
  const actionText = targetFrozen ? '冻结' : '解冻'
  const { confirm } = await uni.showModal({
    title: `${actionText}确认`,
    content: `确定要${actionText}该库存记录吗？`,
  })
  if (!confirm) {
    return
  }
  frozenLoading.value = true
  try {
    await updateMaterialStockFrozen({ id: formData.value.id, frozen: targetFrozen })
    toast.success(`${actionText}成功`)
    formData.value.frozen = targetFrozen
    uni.$emit('mes:wm:materialstock:reload')
  } finally {
    frozenLoading.value = false
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
