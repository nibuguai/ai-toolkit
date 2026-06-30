<template>
  <view class="yd-page-container">
    <wd-navbar title="设备类型详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="类型编码" :value="formData?.code || '-'" />
        <wd-cell title="类型名称" :value="formData?.name || '-'" />
        <wd-cell title="上级类型" :value="parentName || '顶级类型'" />
        <wd-cell title="显示排序" :value="formData?.sort ?? '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
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
import type { DvMachineryTypeVO } from '@/api/mes/dv/machinery/type'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteMachineryType, getMachineryType, getMachineryTypeList } from '@/api/mes/dv/machinery/type'
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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/dv/machinery/type/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const formData = ref<DvMachineryTypeVO>()
const parentName = ref('')
const deleting = ref(false)
const canUpdate = computed(() => hasAccessByCodes(['mes:dv-machinery-type:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:dv-machinery-type:delete']))
// TODO @YunaiV：纯权限的 canUpdate/canDelete/hasFooter 尽量内联到模板，避免额外 computed；只有状态条件组合才保留具名 computed。
const hasFooter = computed(() => canUpdate.value || canDelete.value)

function handleBack() {
  navigateBackPlus('/pages-mes/dv/machinery/type/index')
}

async function getDetail() {
  if (!currentId.value || deleting.value)
    return
  try {
    toast.loading('加载中...')
    const [data, list] = await Promise.all([getMachineryType(currentId.value), getMachineryTypeList()])
    formData.value = data
    parentName.value = data.parentId === 0 ? '顶级类型' : list.find(item => item.id === data.parentId)?.name || '-'
  } finally {
    toast.close()
  }
}

async function initPage() {
  if (!currentId.value) {
    formData.value = undefined
    parentName.value = ''
    return
  }
  if (!formData.value || formData.value.id !== currentId.value) {
    await getDetail()
  }
}

function handleEdit() {
  uni.navigateTo({ url: `/pages-mes/dv/machinery/type/form/index?id=${currentId.value}` })
}

async function handleDelete() {
  if (!currentId.value)
    return
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除设备类型「${formData.value?.name || ''}」吗？` })
  } catch {
    return
  }
  deleting.value = true
  try {
    toast.loading('删除中...')
    await deleteMachineryType(currentId.value)
    toast.close()
    toast.success('删除成功')
    uni.$emit('mes:dv:machinery-type:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } catch {
    toast.close()
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  initPage()
})

onShow(() => {
  initPage()
})

watch(currentId, () => {
  initPage()
})
</script>
