<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="计量单位详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="单位编码" :value="formData?.code || '-'" />
        <wd-cell title="单位名称" :value="formData?.name || '-'" />
        <wd-cell title="单位类型">
          <dict-tag
            v-if="formData?.primaryFlag !== undefined"
            :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
            :value="formData.primaryFlag"
          />
          <text v-else>-</text>
        </wd-cell>
        <template v-if="formData && !formData.primaryFlag">
          <wd-cell title="所属主单位" :value="primaryUnitName" />
          <wd-cell title="换算比例" :value="formatChangeRate(formData.changeRate)" />
        </template>
        <wd-cell title="状态">
          <dict-tag
            v-if="formData?.status !== undefined"
            :type="DICT_TYPE.COMMON_STATUS"
            :value="formData.status"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="hasFooter" content-class="yd-detail-footer-actions">
      <wd-button v-if="canUpdate" class="flex-1" type="warning" @click="handleEdit">
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
import type { MdUnitMeasureVO } from '@/api/mes/md/unitmeasure'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteUnitMeasure, getUnitMeasure, getUnitMeasureSimpleList } from '@/api/mes/md/unitmeasure'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'

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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/md/unitmeasure/detail/index')
const formData = ref<MdUnitMeasureVO>() // 详情数据
const unitOptions = ref<MdUnitMeasureVO[]>([]) // 单位选项
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前详情编号
const deleting = ref(false) // 删除状态
const canUpdate = computed(() => hasAccessByCodes(['mes:md-unit-measure:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:md-unit-measure:delete']))
// TODO @YunaiV：纯权限的 canUpdate/canDelete/hasFooter 尽量内联到模板，避免额外 computed；只有状态条件组合才保留具名 computed。
const hasFooter = computed(() => canUpdate.value || canDelete.value)
const primaryUnitName = computed(() => {
  const primaryId = formData.value?.primaryId
  if (!primaryId) {
    return '-'
  }
  return unitOptions.value.find(item => String(item.id) === String(primaryId))?.name || `#${primaryId}`
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/unitmeasure/index')
}

/** 格式化换算比例 */
function formatChangeRate(value?: number) {
  return value === undefined || value === null ? '-' : String(value)
}

/** 加载计量单位详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const [detail, units] = await Promise.all([
      getUnitMeasure(currentId.value),
      getUnitMeasureSimpleList(),
    ])
    formData.value = detail
    unitOptions.value = units
  } finally {
    toast.close()
  }
}

async function initPage() {
  if (!currentId.value) {
    formData.value = undefined
    unitOptions.value = []
    return
  }
  if (!formData.value || formData.value.id !== currentId.value) {
    await getDetail()
  }
}

/** 编辑计量单位 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mes/md/unitmeasure/form/index?id=${currentId.value}` })
}

/** 删除计量单位 */
async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该计量单位吗？被物料或业务单据引用时将无法删除。',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    toast.loading('删除中...')
    await deleteUnitMeasure(currentId.value)
    toast.close()
    toast.success('删除成功')
    uni.$emit('mes:md:unitmeasure:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } catch {
    toast.close()
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
  uni.$on('mes:md:unitmeasure:reload', getDetail)
})

onShow(() => {
  initPage()
})

watch(currentId, () => {
  initPage()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:md:unitmeasure:reload', getDetail)
})
</script>
