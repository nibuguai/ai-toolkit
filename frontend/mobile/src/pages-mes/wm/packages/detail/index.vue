<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 装箱单详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <wd-cell-group border>
          <wd-cell title="装箱单编号" :value="formData?.code || '-'" />
          <wd-cell title="装箱日期" :value="formatDateTime(formData?.packageDate) || '-'" />
          <wd-cell title="单据状态">
            <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_PACKAGE_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="箱体类型" :value="formData?.parentId && formData.parentId !== 0 ? `子箱 #${formData.parentId}` : '主箱'" />
          <wd-cell title="销售订单编号" :value="formData?.salesOrderCode || '-'" />
          <wd-cell title="发票编号" :value="formData?.invoiceCode || '-'" />
          <wd-cell title="客户编码" :value="formData?.clientCode || '-'" />
          <wd-cell title="客户名称" :value="formData?.clientName || '-'" />
          <wd-cell title="客户简称" :value="formData?.clientNickname || '-'" />
          <wd-cell title="箱长度" :value="formatMeasure(formData?.length, formData?.sizeUnitName)" />
          <wd-cell title="箱宽度" :value="formatMeasure(formData?.width, formData?.sizeUnitName)" />
          <wd-cell title="箱高度" :value="formatMeasure(formData?.height, formData?.sizeUnitName)" />
          <wd-cell title="净重" :value="formatMeasure(formData?.netWeight, formData?.weightUnitName)" />
          <wd-cell title="毛重" :value="formatMeasure(formData?.grossWeight, formData?.weightUnitName)" />
          <wd-cell title="检查员" :value="formData?.inspectorName || '-'" />
          <wd-cell title="备注" :value="formData?.remark || '-'" />
          <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        </wd-cell-group>

        <SubPackageList :package-id="packageId" />
        <PackageLineList :package-id="packageId" />
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
        v-if="canUpdate"
        class="flex-1" type="success" :loading="finishLoading" @click="handleFinish"
      >
        完成
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
import type { WmPackageVO } from '@/api/mes/wm/packages'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deletePackage, finishPackage, getPackage } from '@/api/mes/wm/packages'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmPackageStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import PackageLineList from '../components/package-line-list.vue'
import SubPackageList from '../components/sub-package-list.vue'

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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/packages/detail/index')
const formData = ref<WmPackageVO>() // 详情数据
const deleting = ref(false) // 删除状态
const finishLoading = ref(false) // 完成状态
const packageId = computed(() => getRouteQueryNumber('id'))
const canUpdate = computed(() => {
  return formData.value?.status === MesWmPackageStatusEnum.PREPARE && hasAccessByCodes(['mes:wm-package:update'])
})
const canDelete = computed(() => {
  return formData.value?.status === MesWmPackageStatusEnum.PREPARE && hasAccessByCodes(['mes:wm-package:delete'])
})
const canOperate = computed(() => canUpdate.value || canDelete.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/packages/index')
}

/** 格式化数值和单位 */
function formatMeasure(value?: number, unitName?: string) {
  if (value === undefined || value === null) {
    return '-'
  }
  return `${value} ${unitName || ''}`.trim()
}

/** 加载详情 */
async function getDetail() {
  if (!packageId.value) {
    return
  }
  const detailData = await getPackage(packageId.value)
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
  if (!packageId.value) {
    formData.value = undefined
    return
  }
  if (!formData.value || formData.value.id !== packageId.value) {
    await getDetail()
  }
}

/** 编辑 */
function handleEdit() {
  if (!packageId.value) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/wm/packages/form/index?id=${packageId.value}`,
  })
}

/** 完成 */
async function handleFinish() {
  if (!packageId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认完成装箱单「${formData.value.code}」？完成后将不可编辑。`,
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishPackage(packageId.value)
    toast.success('完成成功')
    await getDetail()
    uni.$emit('mes:wm:packages:reload')
  } finally {
    finishLoading.value = false
  }
}

/** 删除 */
async function handleDelete() {
  if (!packageId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除装箱单「${formData.value.code}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePackage(packageId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:packages:reload')
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

watch(packageId, () => {
  initPage()
})
</script>
