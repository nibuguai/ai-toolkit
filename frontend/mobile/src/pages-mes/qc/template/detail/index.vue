<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="质检方案详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="方案编号" :value="formData?.code || '-'" />
        <wd-cell title="方案名称" :value="formData?.name || '-'" />
        <wd-cell title="检测种类">
          <template v-if="formData?.types?.length">
            <dict-tag
              v-for="type in formData.types"
              :key="type"
              class="mb-8rpx mr-8rpx"
              :type="DICT_TYPE.MES_QC_TYPE"
              :value="type"
            />
          </template>
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="编号" :value="formData?.id ? String(formData.id) : '-'" />
      </wd-cell-group>

      <TemplateIndicatorSection v-if="templateId" :template-id="templateId" />
      <TemplateItemSection v-if="templateId" :template-id="templateId" />
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions content-class="yd-detail-footer-actions">
      <wd-button
        v-if="canUpdate"
        class="flex-1"
        type="warning"
        @click="handleEdit"
      >
        编辑
      </wd-button>
      <wd-button
        v-if="canDelete"
        class="flex-1"
        type="danger"
        :loading="deleting"
        @click="handleDelete"
      >
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { QcTemplateVO } from '@/api/mes/qc/template'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteTemplate, getTemplate } from '@/api/mes/qc/template'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import TemplateIndicatorSection from '../components/template-indicator-section.vue'
import TemplateItemSection from '../components/template-item-section.vue'

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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/qc/template/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前详情编号
const formData = ref<QcTemplateVO>() // 详情数据
const deleting = ref(false) // 删除状态
const templateId = computed(() => currentId.value || 0)
const canUpdate = computed(() => hasAccessByCodes(['mes:qc-template:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:qc-template:delete']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getTemplate(currentId.value)
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

/** 编辑质检方案 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mes/qc/template/form/index?id=${currentId.value}` })
}

/** 删除质检方案 */
async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该质检方案吗？删除后将无法恢复。',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteTemplate(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:qc:template:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
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
