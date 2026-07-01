<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="过程检验单详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <wd-cell-group title="基本信息" border>
          <wd-cell title="检验单编号" :value="formData?.code || '-'" />
          <wd-cell title="检验单名称" :value="formData?.name || '-'" />
          <wd-cell title="检验类型">
            <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_IPQC_TYPE" :value="formData.type" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="单据状态">
            <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_ORDER_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="检测结果">
            <dict-tag v-if="formData?.checkResult != null" :type="DICT_TYPE.MES_QC_CHECK_RESULT" :value="formData.checkResult" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="备注" :value="formData?.remark || '-'" />
        </wd-cell-group>

        <wd-cell-group title="来源单据" border class="mt-24rpx">
          <wd-cell title="来源单据类型">
            <dict-tag v-if="formData?.sourceDocType != null" :type="DICT_TYPE.MES_QC_SOURCE_DOC_TYPE" :value="formData.sourceDocType" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="来源单据编号" :value="formData?.sourceDocCode || '-'" />
          <wd-cell title="来源单据 ID" :value="formData?.sourceDocId != null ? String(formData.sourceDocId) : '-'" />
          <wd-cell title="来源行 ID" :value="formData?.sourceLineId != null ? String(formData.sourceLineId) : '-'" />
        </wd-cell-group>

        <wd-cell-group title="生产关联" border class="mt-24rpx">
          <wd-cell title="生产工单" :value="`${formData?.workOrderCode || '-'} / ${formData?.workOrderName || '-'}`" />
          <wd-cell title="生产任务" :value="formData?.taskCode || (formData?.taskId != null ? String(formData.taskId) : '-')" />
          <wd-cell title="工位" :value="`${formData?.workstationCode || '-'} / ${formData?.workstationName || '-'}`" />
          <wd-cell title="工序" :value="formData?.processName || '-'" />
        </wd-cell-group>

        <wd-cell-group title="产品物料" border class="mt-24rpx">
          <wd-cell title="物料编码" :value="formData?.itemCode || '-'" />
          <wd-cell title="物料名称" :value="formData?.itemName || '-'" />
          <wd-cell title="规格型号" :value="formData?.itemSpecification || '-'" />
          <wd-cell title="单位" :value="formData?.unitName || '-'" />
        </wd-cell-group>

        <wd-cell-group title="检测情况" border class="mt-24rpx">
          <wd-cell title="检测数量" :value="formatQuantity(formData?.checkQuantity)" />
          <wd-cell title="合格数量" :value="formatQuantity(formData?.qualifiedQuantity)" />
          <wd-cell title="不合格数量" :value="formatQuantity(formData?.unqualifiedQuantity)" />
          <wd-cell title="检测日期" :value="formatDateTime(formData?.inspectDate) || '-'" />
          <wd-cell title="检测人员" :value="formData?.inspectorNickname || '-'" />
        </wd-cell-group>

        <wd-cell-group title="废品与缺陷" border class="mt-24rpx">
          <wd-cell title="工废数量" :value="formatQuantity(formData?.laborScrapQuantity)" />
          <wd-cell title="料废数量" :value="formatQuantity(formData?.materialScrapQuantity)" />
          <wd-cell title="其他废品数量" :value="formatQuantity(formData?.otherScrapQuantity)" />
          <wd-cell title="致命缺陷数" :value="formatQuantity(formData?.criticalQuantity)" />
          <wd-cell title="严重缺陷数" :value="formatQuantity(formData?.majorQuantity)" />
          <wd-cell title="轻微缺陷数" :value="formatQuantity(formData?.minorQuantity)" />
          <wd-cell title="致命缺陷率" :value="formatRate(formData?.criticalRate)" />
          <wd-cell title="严重缺陷率" :value="formatRate(formData?.majorRate)" />
          <wd-cell title="轻微缺陷率" :value="formatRate(formData?.minorRate)" />
        </wd-cell-group>

        <QcLineSection type="ipqc" :order-id="currentId" :qc-type="MesQcTypeEnum.IPQC" />
        <QcIndicatorResultSection :qc-id="currentId" :qc-type="MesQcTypeEnum.IPQC" />
      </view>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="formData && isDraft" content-class="yd-detail-footer-actions">
      <wd-button v-if="canUpdate" class="flex-1" type="warning" @click="handleEdit">
        编辑
      </wd-button>
      <wd-button v-if="canUpdate" class="flex-1" type="success" :loading="finishing" @click="handleFinish">
        完成
      </wd-button>
      <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { QcIpqcVO } from '@/api/mes/qc/ipqc'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteIpqc, finishIpqc, getIpqc } from '@/api/mes/qc/ipqc'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import QcIndicatorResultSection from '../../components/qc-indicator-result-section.vue'
import QcLineSection from '../../components/qc-line-section.vue'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const MesQcStatusEnum = {
  DRAFT: 0,
} as const
const MesQcTypeEnum = {
  IPQC: 2,
} as const

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/qc/ipqc/detail/index')
const formData = ref<QcIpqcVO>() // 详情数据
const deleting = ref(false) // 删除状态
const finishing = ref(false) // 完成状态
const canUpdate = computed(() => hasAccessByCodes(['mes:qc-ipqc:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:qc-ipqc:delete']))
const isDraft = computed(() => formData.value?.status === MesQcStatusEnum.DRAFT)
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/ipqc/index')
}

/** 格式化数量 */
function formatQuantity(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return String(value)
}

/** 格式化百分比 */
function formatRate(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return `${value}%`
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getIpqc(currentId.value)
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
  uni.navigateTo({ url: `/pages-mes/qc/ipqc/form/index?id=${currentId.value}` })
}

/** 完成 */
async function handleFinish() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '完成确认',
      msg: '确定要完成该过程检验单吗？完成后将不能修改。',
    })
  } catch {
    return
  }
  finishing.value = true
  try {
    await finishIpqc(currentId.value)
    toast.success('完成成功')
    uni.$emit('mes:qc:ipqc:reload')
    await getDetail()
  } finally {
    finishing.value = false
  }
}

/** 删除 */
async function handleDelete() {
  if (!currentId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除确认',
      msg: `确定要删除过程检验单「${formData.value.code}」吗？删除后将无法恢复。`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteIpqc(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:qc:ipqc:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})

watch(currentId, () => {
  getDetail()
})
</script>
