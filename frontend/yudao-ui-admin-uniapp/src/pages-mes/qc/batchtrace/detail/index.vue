<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="批次追溯详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <wd-cell-group title="批次信息" border>
          <wd-cell title="批次编号" :value="formData?.code || '-'" />
          <wd-cell title="生产批号" :value="formData?.lotNumber || '-'" />
          <wd-cell title="质量状态">
            <dict-tag v-if="formData?.qualityStatus != null" :type="DICT_TYPE.MES_WM_QUALITY_STATUS" :value="formData.qualityStatus" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="生产日期" :value="formatDateTime(formData?.produceDate) || '-'" />
          <wd-cell title="有效期" :value="formatDateTime(formData?.expireDate) || '-'" />
          <wd-cell title="入库日期" :value="formatDateTime(formData?.receiptDate) || '-'" />
          <wd-cell title="备注" :value="formData?.remark || '-'" />
        </wd-cell-group>

        <wd-cell-group title="产品物料" border class="mt-24rpx">
          <wd-cell title="物料编码" :value="formData?.itemCode || '-'" />
          <wd-cell title="物料名称" :value="formData?.itemName || '-'" />
          <wd-cell title="规格型号" :value="formData?.itemSpecification || '-'" />
          <wd-cell title="单位" :value="formData?.unitName || '-'" />
        </wd-cell-group>

        <wd-cell-group title="供应与销售" border class="mt-24rpx">
          <wd-cell title="供应商" :value="`${formData?.vendorCode || '-'} / ${formData?.vendorName || '-'}`" />
          <wd-cell title="客户" :value="`${formData?.clientCode || '-'} / ${formData?.clientName || '-'}`" />
          <wd-cell title="采购订单编号" :value="formData?.purchaseOrderCode || '-'" />
          <wd-cell title="销售订单编号" :value="formData?.salesOrderCode || '-'" />
        </wd-cell-group>

        <wd-cell-group title="生产关联" border class="mt-24rpx">
          <wd-cell title="生产工单" :value="formData?.workOrderCode || '-'" />
          <wd-cell title="生产任务" :value="formData?.taskCode || '-'" />
          <wd-cell title="工作站" :value="formData?.workstationCode || '-'" />
          <wd-cell title="工具" :value="formData?.toolCode || '-'" />
        </wd-cell-group>

        <view class="mt-24rpx overflow-hidden rounded-12rpx bg-white">
          <wd-tabs v-model="activeTab">
            <wd-tab title="向前追溯" name="forward">
              <view class="p-24rpx">
                <BatchTraceList :batch-code="formData?.code" direction="forward" />
              </view>
            </wd-tab>
            <wd-tab title="向后追溯" name="backward">
              <view class="p-24rpx">
                <BatchTraceList :batch-code="formData?.code" direction="backward" />
              </view>
            </wd-tab>
          </wd-tabs>
        </view>
      </view>
      <view class="h-48rpx" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { BatchVO } from '@/api/mes/wm/batch'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getBatch } from '@/api/mes/wm/batch'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import BatchTraceList from './trace-list.vue'

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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/qc/batchtrace/detail/index')
const formData = ref<BatchVO>() // 详情数据
const activeTab = ref('forward') // 当前追溯方向
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/batchtrace/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getBatch(currentId.value)
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

onMounted(() => {
  getDetail()
})

watch(currentId, () => {
  getDetail()
})
</script>
