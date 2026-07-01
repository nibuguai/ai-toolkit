<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar title="工艺路线详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="路线编码" :value="formData?.code || '-'" />
        <wd-cell title="路线名称" :value="formData?.name || '-'" />
        <wd-cell title="路线说明" :value="formData?.description || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <view class="mt-24rpx bg-white">
        <view class="px-24rpx py-20rpx text-30rpx text-[#333] font-semibold">
          配置概览
        </view>
        <wd-cell-group border>
          <wd-cell title="组成工序" :value="`${routeProcessCount} 道`" />
          <wd-cell title="关联产品" :value="`${routeProductCount} 个`" />
          <wd-cell title="产品 BOM" :value="`${routeBomCount} 条`" />
        </wd-cell-group>
      </view>

      <RouteProcessList
        v-if="routeId"
        :route-id="routeId"
        :editable="isDisabled"
        @changed="handleRouteProcessChanged"
      />
      <RouteProductList
        v-if="routeId"
        :route-id="routeId"
        :editable="isDisabled"
        @changed="handleRouteProductChanged"
      />
      <view class="h-180rpx" />
    </scroll-view>

    <MesFooterActions v-if="hasFooter" content-class="yd-detail-footer-actions">
      <wd-button v-if="canUpdate" class="flex-1" type="primary" variant="plain" @click="handleStatusChange">
        {{ formData?.status === CommonStatusEnum.ENABLE ? '停用' : '启用' }}
      </wd-button>
      <wd-button v-if="canUpdate" class="flex-1" type="warning" :disabled="!isDisabled" @click="handleEdit">
        编辑
      </wd-button>
      <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" :disabled="!isDisabled" @click="handleDelete">
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { ProRouteVO } from '@/api/mes/pro/route'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteRoute, getRoute, updateRouteStatus } from '@/api/mes/pro/route'
import { getRouteProcessListByRoute } from '@/api/mes/pro/route/process'
import { getRouteProductListByRoute } from '@/api/mes/pro/route/product'
import { getRouteProductBomList } from '@/api/mes/pro/route/productbom'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import RouteProcessList from '../components/route-process-list.vue'
import RouteProductList from '../components/route-product-list.vue'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<ProRouteVO>()
const deleting = ref(false)
const routeProcessCount = ref(0)
const routeProductCount = ref(0)
const routeBomCount = ref(0)
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/pro/route/detail/index')
const routeId = computed(() => getRouteQueryNumber('id'))
const canUpdate = computed(() => hasAccessByCodes(['mes:pro-route:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:pro-route:delete']))
// TODO @YunaiV：纯权限的 canUpdate/canDelete/hasFooter 尽量内联到模板，避免额外 computed；只有状态条件组合才保留具名 computed。
const hasFooter = computed(() => canUpdate.value || canDelete.value)
const isDisabled = computed(() => formData.value?.status === CommonStatusEnum.DISABLE)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/route/index')
}

/** 加载工艺路线详情 */
async function getDetail() {
  if (!routeId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getRoute(routeId.value)
    if (!detailData) {
      uni.showToast({ icon: 'none', title: '详情不存在，已返回列表' })
      // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 2 处 setTimeout(() => handleBack())）
      setTimeout(() => handleBack(), 300)
      return
    }
    formData.value = detailData
    await loadOverview(routeId.value)
  } finally {
    toast.close()
  }
}

/** 加载子表概览 */
async function loadOverview(id: number) {
  const [processes, products, boms] = await Promise.all([
    getRouteProcessListByRoute(id),
    getRouteProductListByRoute(id),
    getRouteProductBomList({ routeId: id }),
  ])
  routeProcessCount.value = processes?.length || 0
  routeProductCount.value = products?.length || 0
  routeBomCount.value = boms?.length || 0
}

/** 路线工序变更后刷新概览 */
async function handleRouteProcessChanged() {
  if (routeId.value) {
    await loadOverview(routeId.value)
  }
}

/** 路线产品或 BOM 变更后刷新概览 */
async function handleRouteProductChanged() {
  if (routeId.value) {
    await loadOverview(routeId.value)
  }
}

/** 编辑工艺路线 */
function handleEdit() {
  if (!routeId.value || !isDisabled.value) {
    toast.warning('仅停用状态可以编辑')
    return
  }
  uni.navigateTo({ url: `/pages-mes/pro/route/form/index?id=${routeId.value}` })
}

/** 启用或停用工艺路线 */
async function handleStatusChange() {
  if (!routeId.value || !formData.value || formData.value.status == null) {
    return
  }
  const nextStatus = formData.value.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  const action = nextStatus === CommonStatusEnum.ENABLE ? '启用' : '停用'
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认要${action}「${formData.value.name || formData.value.code}」工艺路线吗？${nextStatus === CommonStatusEnum.ENABLE ? '启用前请确认工序和产品 BOM 配置完整。' : ''}`,
    })
  } catch {
    return
  }
  await updateRouteStatus(routeId.value, nextStatus)
  toast.success(`${action}成功`)
  uni.$emit('mes:pro:route:reload')
  await getDetail()
}

/** 删除工艺路线 */
async function handleDelete() {
  if (!routeId.value || !formData.value) {
    return
  }
  if (!isDisabled.value) {
    toast.warning('仅停用状态可以删除')
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${formData.value.name || formData.value.code}」工艺路线吗？` })
  } catch {
    return
  }
  deleting.value = true
  try {
    toast.loading('删除中...')
    await deleteRoute(routeId.value)
    toast.close()
    toast.success('删除成功')
    uni.$emit('mes:pro:route:reload')
    setTimeout(() => handleBack(), 500)
  } catch {
    toast.close()
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  getDetail()
  uni.$on('mes:pro:route:reload', getDetail)
})

watch(routeId, () => {
  getDetail()
})

onUnload(() => {
  uni.$off('mes:pro:route:reload', getDetail)
})
</script>
