<template>
  <view class="yd-page-container">
    <wd-navbar title="车间详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="车间编码" :value="formData?.code || '-'" />
        <wd-cell title="车间名称" :value="formData?.name || '-'" />
        <wd-cell title="面积" :value="formData?.area != null ? `${formData.area} ㎡` : '-'" />
        <wd-cell title="负责人" :value="formData?.chargeUserName || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
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
import type { MdWorkshopVO } from '@/api/mes/md/workstation/workshop'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteWorkshop, getWorkshop } from '@/api/mes/md/workstation/workshop'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'

const props = defineProps<{ id?: number | string }>()

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/md/workstation/workshop/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const formData = ref<MdWorkshopVO>()
const deleting = ref(false)
const canUpdate = computed(() => hasAccessByCodes(['mes:md-workshop:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:md-workshop:delete']))
// TODO @YunaiV：纯权限的 canUpdate/canDelete/hasFooter 尽量内联到模板，避免额外 computed；只有状态条件组合才保留具名 computed。
const hasFooter = computed(() => canUpdate.value || canDelete.value)

function handleBack() {
  navigateBackPlus('/pages-mes/md/workstation/workshop/index')
}

async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getWorkshop(currentId.value)
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
  uni.navigateTo({ url: `/pages-mes/md/workstation/workshop/form/index?id=${currentId.value}` })
}

async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该车间吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    toast.loading('删除中...')
    await deleteWorkshop(currentId.value)
    toast.close()
    toast.success('删除成功')
    uni.$emit('mes:md:workshop:reload')
    setTimeout(() => handleBack(), 500)
  } catch {
    toast.close()
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  initPage()
  uni.$on('mes:md:workshop:reload', getDetail)
})

watch(currentId, () => {
  initPage()
})

onUnload(() => {
  uni.$off('mes:md:workshop:reload', getDetail)
})
</script>
