<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="物料产品分类详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="分类编码" :value="formData?.code || '-'" />
        <wd-cell title="分类名称" :value="formData?.name || '-'" />
        <wd-cell title="上级分类" :value="parentName || '-'" />
        <wd-cell title="物料/产品标识">
          <dict-tag v-if="formData?.itemOrProduct" :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="formData.itemOrProduct" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="显示排序" :value="formData?.sort ?? '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="hasFooter" content-class="yd-detail-footer-actions">
      <wd-button
        v-if="canCreate"
        class="flex-1" type="success" @click="handleAddChild"
      >
        新增子分类
      </wd-button>
      <wd-button
        v-if="canUpdate"
        class="flex-1" type="warning" @click="handleEdit"
      >
        编辑
      </wd-button>
      <wd-button
        v-if="canDelete && (formData?.parentId ?? 0) !== 0"
        class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
      >
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { MdItemTypeVO } from '@/api/mes/md/item/type'
import { onShow, onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteItemType, getItemType, getItemTypeList } from '@/api/mes/md/item/type'
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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/md/item/type/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前分类编号
const formData = ref<MdItemTypeVO>() // 详情数据
const deleting = ref(false) // 删除状态
const parentName = ref<string>() // 上级分类名称
const canCreate = computed(() => hasAccessByCodes(['mes:md-item-type:create']))
const canUpdate = computed(() => hasAccessByCodes(['mes:md-item-type:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:md-item-type:delete']))
const hasFooter = computed(() => canCreate.value || canUpdate.value || canDelete.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/item/type/index')
}

/** 加载上级分类名称 */
async function loadParentName(parentId?: number) {
  if (!parentId || parentId === 0) {
    parentName.value = '顶级分类'
    return
  }
  try {
    const list = await getItemTypeList()
    const found = list?.find(item => item.id === parentId)
    parentName.value = found?.name || String(parentId)
  } catch {
    parentName.value = String(parentId)
  }
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const data = await getItemType(currentId.value)
    formData.value = data
    await loadParentName(data.parentId)
  } finally {
    toast.close()
  }
}

/** 初始化页面 */
async function initPage() {
  if (!currentId.value) {
    formData.value = undefined
    parentName.value = undefined
    return
  }
  if (!formData.value || formData.value.id !== currentId.value) {
    await getDetail()
  }
}

/** 新增子分类 */
function handleAddChild() {
  if (!currentId.value)
    return
  uni.navigateTo({
    url: `/pages-mes/md/item/type/form/index?parentId=${currentId.value}`,
  })
}

/** 编辑 */
function handleEdit() {
  if (!currentId.value)
    return
  uni.navigateTo({
    url: `/pages-mes/md/item/type/form/index?id=${currentId.value}`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该物料产品分类吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    toast.loading('删除中...')
    await deleteItemType(currentId.value)
    toast.close()
    toast.success('删除成功')
    uni.$emit('mes:md:item:type:reload')
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
  uni.$on('mes:md:item:type:reload', getDetail)
})

/** 页面显示 */
onShow(() => {
  initPage()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:md:item:type:reload', getDetail)
})

watch(currentId, () => {
  initPage()
})
</script>
