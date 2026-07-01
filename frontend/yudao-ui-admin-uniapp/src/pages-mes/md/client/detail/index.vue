<template>
  <view class="yd-page-container">
    <wd-navbar title="客户详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="客户编码" :value="formData?.code || '-'" />
        <wd-cell title="客户名称" :value="formData?.name || '-'" />
        <wd-cell title="客户简称" :value="formData?.nickname || '-'" />
        <wd-cell title="英文名称" :value="formData?.englishName || '-'" />
        <wd-cell title="客户类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_CLIENT_TYPE" :value="formData.type" /><text v-else>-</text>
        </wd-cell>
        <wd-cell title="客户简介" :value="formData?.description || '-'" />
        <wd-cell title="客户 LOGO">
          <!-- TODO @YunaiV：图片展示改用 wd-img（width/height/mode="aspectFill"/enable-preview，去掉手写占位），对齐 AGENTS.md -->
          <image v-if="formData?.logo" :src="formData.logo" mode="aspectFit" class="h-96rpx w-96rpx rounded-8rpx" @click="handlePreviewLogo" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="客户地址" :value="formData?.address || '-'" />
        <wd-cell title="官网地址" :value="formData?.website || '-'" />
        <wd-cell title="邮箱地址" :value="formData?.email || '-'" />
        <wd-cell title="客户电话" :value="formData?.telephone || '-'" />
        <wd-cell title="联系人1" :value="formData?.contact1Name || '-'" />
        <wd-cell title="联系人1-电话" :value="formData?.contact1Telephone || '-'" />
        <wd-cell title="联系人1-邮箱" :value="formData?.contact1Email || '-'" />
        <wd-cell title="联系人2" :value="formData?.contact2Name || '-'" />
        <wd-cell title="联系人2-电话" :value="formData?.contact2Telephone || '-'" />
        <wd-cell title="联系人2-邮箱" :value="formData?.contact2Email || '-'" />
        <wd-cell title="信用代码" :value="formData?.creditCode || '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <ClientProductSalesList :client-id="currentId" />
      <view class="h-160rpx" />
    </scroll-view>
    <MesFooterActions v-if="hasFooter" content-class="yd-detail-footer-actions">
      <wd-button v-if="canUpdate" class="flex-1" type="warning" @click="handleEdit">
        编辑
      </wd-button>
      <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { MdClientVO } from '@/api/mes/md/client'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteClient, getClient } from '@/api/mes/md/client'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import ClientProductSalesList from '../components/client-product-sales-list.vue'

const props = defineProps<{ id?: number | string }>()
definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })
const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/md/client/detail/index')
const formData = ref<MdClientVO>()
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const deleting = ref(false)
const canUpdate = computed(() => hasAccessByCodes(['mes:md-client:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:md-client:delete']))
// TODO @YunaiV：纯权限的 canUpdate/canDelete/hasFooter 尽量内联到模板，避免额外 computed；只有状态条件组合才保留具名 computed。
const hasFooter = computed(() => canUpdate.value || canDelete.value)

function handleBack() {
  navigateBackPlus('/pages-mes/md/client/index')
}

async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getClient(currentId.value)
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

async function initPage() {
  if (!currentId.value) {
    formData.value = undefined
    return
  }
  if (!formData.value || formData.value.id !== currentId.value) {
    await getDetail()
  }
}

function handleEdit() {
  uni.navigateTo({ url: `/pages-mes/md/client/form/index?id=${currentId.value}` })
}

/** 预览客户 LOGO */
function handlePreviewLogo() {
  if (formData.value?.logo)
    uni.previewImage({ urls: [formData.value.logo], current: formData.value.logo })
}

async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该客户吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    toast.loading('删除中...')
    await deleteClient(currentId.value)
    toast.close()
    toast.success('删除成功')
    uni.$emit('mes:md:client:reload')
    setTimeout(() => handleBack(), 500)
  } catch {
    toast.close()
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  initPage()
  uni.$on('mes:md:client:reload', getDetail)
})

onShow(() => {
  initPage()
})

watch(currentId, () => {
  initPage()
})

onUnload(() => {
  uni.$off('mes:md:client:reload', getDetail)
})
</script>
