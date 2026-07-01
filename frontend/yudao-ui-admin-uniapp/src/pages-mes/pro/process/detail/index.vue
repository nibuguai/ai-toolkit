<template>
  <view class="yd-page-container">
    <wd-navbar title="生产工序详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="工序编码" :value="formData?.code || '-'" />
        <wd-cell title="工序名称" :value="formData?.name || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="工序说明" :value="formData?.attention || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <ProcessContentList v-if="processId" :process-id="processId" />
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
import type { ProProcessVO } from '@/api/mes/pro/process'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteProcess, getProcess } from '@/api/mes/pro/process'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ProcessContentList from '../components/process-content-list.vue'

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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/pro/process/detail/index')
const formData = ref<ProProcessVO>()
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前工序编号
const deleting = ref(false)
const processId = computed(() => currentId.value)
const canUpdate = computed(() => hasAccessByCodes(['mes:pro-process:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:pro-process:delete']))
// TODO @YunaiV：纯权限的 canUpdate/canDelete/hasFooter 尽量内联到模板，避免额外 computed；只有状态条件组合才保留具名 computed。
const hasFooter = computed(() => canUpdate.value || canDelete.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/process/index')
}

/** 加载生产工序详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getProcess(currentId.value)
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

/** 初始化页面 */
async function initPage() {
  if (!currentId.value) {
    formData.value = undefined
    return
  }
  if (!formData.value || formData.value.id !== currentId.value) {
    await getDetail()
  }
}

/** 编辑生产工序 */
function handleEdit() {
  if (!currentId.value)
    return
  uni.navigateTo({ url: `/pages-mes/pro/process/form/index?id=${currentId.value}` })
}

/** 删除生产工序 */
async function handleDelete() {
  if (!processId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该生产工序吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    toast.loading('删除中...')
    await deleteProcess(processId.value)
    toast.close()
    toast.success('删除成功')
    uni.$emit('mes:pro:process:reload')
    setTimeout(() => handleBack(), 500)
  } catch {
    toast.close()
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  initPage()
  uni.$on('mes:pro:process:reload', getDetail)
})

onShow(() => {
  initPage()
})

watch(currentId, () => {
  initPage()
})

onUnload(() => {
  uni.$off('mes:pro:process:reload', getDetail)
})
</script>
