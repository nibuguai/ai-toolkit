<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="物料产品详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="物料编码" :value="formData?.code || '-'" />
        <wd-cell title="物料名称" :value="formData?.name || '-'" />
        <wd-cell title="规格型号" :value="formData?.specification || '-'" />
        <wd-cell title="计量单位" :value="formData?.unitMeasureName || '-'" />
        <wd-cell title="物料分类" :value="formData?.itemTypeName || '-'" />
        <wd-cell title="物料/产品标识">
          <dict-tag v-if="formData?.itemOrProduct" :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="formData.itemOrProduct" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="高值物料">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData?.highValue)" />
        </wd-cell>
        <wd-cell title="批次管理">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData?.batchFlag)" />
        </wd-cell>
        <wd-cell title="安全库存">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData?.safeStockFlag)" />
        </wd-cell>
        <wd-cell v-if="formData?.safeStockFlag" title="最低库存量" :value="formatStock(formData?.minStock)" />
        <wd-cell v-if="formData?.safeStockFlag" title="最高库存量" :value="formatStock(formData?.maxStock)" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- BOM 组成入口 -->
      <view class="px-24rpx pb-24rpx">
        <wd-cell-group border>
          <wd-cell title="BOM 组成" is-link @click="handleBom" />
          <wd-cell v-if="formData?.batchFlag" title="批次属性" is-link @click="handleBatchConfig" />
          <wd-cell title="产品 SIP" is-link @click="handleSip" />
          <wd-cell title="产品 SOP" is-link @click="handleSop" />
        </wd-cell-group>
      </view>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="hasFooter" content-class="yd-detail-footer-actions">
      <wd-button
        v-if="canUpdate"
        class="flex-1" type="warning" @click="handleEdit"
      >
        编辑
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
import type { MdItemVO } from '@/api/mes/md/item'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteItem, getItem } from '@/api/mes/md/item'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/md/item/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前物料编号
const formData = ref<MdItemVO>() // 详情数据
const deleting = ref(false) // 删除状态
const canUpdate = computed(() => hasAccessByCodes(['mes:md-item:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:md-item:delete']))
// TODO @YunaiV：纯权限的 canUpdate/canDelete/hasFooter 尽量内联到模板，避免额外 computed；只有状态条件组合才保留具名 computed。
const hasFooter = computed(() => canUpdate.value || canDelete.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/item/index')
}

/** 格式化库存数量 */
function formatStock(value?: number) {
  if (value === undefined || value === null)
    return '-'
  return String(Number(value.toFixed(2)))
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getItem(currentId.value)
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

/** BOM 组成 */
function handleBom() {
  if (!currentId.value)
    return
  uni.navigateTo({ url: `/pages-mes/md/item/bom/index?itemId=${currentId.value}&mode=detail` })
}

/** 批次属性配置 */
function handleBatchConfig() {
  if (!currentId.value)
    return
  uni.navigateTo({ url: `/pages-mes/md/item/batch-config/index?itemId=${currentId.value}&mode=detail` })
}

/** 产品 SIP */
function handleSip() {
  if (!currentId.value)
    return
  uni.navigateTo({ url: `/pages-mes/md/item/sip/index?itemId=${currentId.value}&mode=detail` })
}

/** 产品 SOP */
function handleSop() {
  if (!currentId.value)
    return
  uni.navigateTo({ url: `/pages-mes/md/item/sop/index?itemId=${currentId.value}&mode=detail` })
}

/** 编辑 */
function handleEdit() {
  if (!currentId.value)
    return
  uni.navigateTo({ url: `/pages-mes/md/item/form/index?id=${currentId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该物料产品吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    toast.loading('删除中...')
    await deleteItem(currentId.value)
    toast.close()
    toast.success('删除成功')
    uni.$emit('mes:md:item:reload')
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
  uni.$on('mes:md:item:reload', getDetail)
})

/** 页面显示 */
onShow(() => {
  initPage()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:md:item:reload', getDetail)
})

watch(currentId, () => {
  initPage()
})
</script>
