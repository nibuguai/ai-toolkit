<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="物料产品分类"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm ref="searchFormRef" @search="handleQuery" @reset="handleReset" />

    <!-- 面包屑导航 -->
    <Breadcrumb v-if="!hasQuery" ref="breadcrumbRef" v-model="currentParentId" />

    <!-- 分类列表 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <wd-swipe-action
          v-for="item in currentList"
          :key="item.id"
          :disabled="!hasAccessByCodes(['mes:md-item-type:delete']) || item.parentId === 0"
        >
          <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="p-24rpx" @click="handleDetail(item)">
              <view class="flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1">
                  <view class="mb-12rpx flex items-center">
                    <view class="mr-16rpx h-48rpx w-48rpx flex shrink-0 items-center justify-center rounded-8rpx bg-[#fa8c16]">
                      <wd-icon name="folder" size="20px" color="#fff" />
                    </view>
                    <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                      {{ item.name || '-' }}
                    </view>
                  </view>
                  <view class="text-26rpx text-[#666] space-y-8rpx">
                    <view>分类编码：{{ item.code || '-' }}</view>
                    <view class="flex items-center">
                      <text class="mr-8rpx">物料/产品：</text>
                      <dict-tag v-if="item.itemOrProduct" :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="item.itemOrProduct" />
                      <text v-else>-</text>
                    </view>
                    <view>排序：{{ item.sort ?? '-' }}</view>
                    <view class="flex items-center">
                      <text class="mr-8rpx">状态：</text>
                      <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
                    </view>
                  </view>
                </view>
                <view
                  v-if="!hasQuery && item.children && item.children.length > 0"
                  class="mt-4rpx flex shrink-0 items-center"
                  @click.stop="handleEnterChildren(item)"
                >
                  <text class="text-24rpx text-[#fa8c16]">子分类({{ item.children.length }})</text>
                  <wd-icon name="arrow-right" size="12px" color="#fa8c16" />
                </view>
              </view>
            </view>
          </view>

          <!-- 左滑删除 -->
          <template v-if="hasAccessByCodes(['mes:md-item-type:delete']) && item.parentId !== 0" #right>
            <view class="h-full flex items-center justify-center px-36rpx" style="background: linear-gradient(135deg, #f56c6c, #e85d5d);" @click.stop="handleSwipeDelete(item)">
              <wd-icon name="delete-outline" size="36rpx" custom-style="color: #fff;" />
              <text class="ml-8rpx text-28rpx text-white">删除</text>
            </view>
          </template>
        </wd-swipe-action>

        <!-- 空状态 -->
        <view v-if="!loading && currentList.length === 0" class="py-100rpx text-center">
          <wd-empty icon="content" tip="暂无物料产品分类数据" />
        </view>
      </view>
    </scroll-view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:md-item-type:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MdItemTypeQueryParams, MdItemTypeVO } from '@/api/mes/md/item/type'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { deleteItemType, getItemTypeList } from '@/api/mes/md/item/type'
import { useAccess } from '@/hooks/useAccess'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { findChildren, handleTree } from '@/utils/tree'
import Breadcrumb from './components/breadcrumb.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const flatList = ref<MdItemTypeVO[]>([]) // 扁平分类列表
const list = ref<MdItemTypeVO[]>([]) // 树形分类列表
const currentParentId = ref(0) // 当前层级的父节点编号
const breadcrumbRef = ref<InstanceType<typeof Breadcrumb>>() // 面包屑引用
const searchFormRef = ref<InstanceType<typeof SearchForm>>() // 搜索组件引用
const queryParams = ref<MdItemTypeQueryParams>({}) // 已生效搜索条件
const hasQuery = computed(() => Object.keys(queryParams.value).length > 0)
const currentList = computed(() => {
  if (hasQuery.value) {
    return flatList.value
  }
  if (currentParentId.value === 0) {
    return list.value.filter(item => (item.parentId ?? 0) === 0)
  }
  return findChildren(list.value, currentParentId.value)
}) // 当前层级展示的分类列表

/** 返回上一页或上一层级 */
function handleBack() {
  if (hasQuery.value) {
    searchFormRef.value?.resetFields()
    queryParams.value = {}
    currentParentId.value = 0
    getList()
    return
  }
  if (!breadcrumbRef.value?.back()) {
    navigateBackPlus('/pages-mes/home/index')
  }
}

/** 进入子分类层级 */
function handleEnterChildren(item: MdItemTypeVO) {
  if (!item.id) {
    return
  }
  breadcrumbRef.value?.enter({ id: item.id, name: item.name })
}

/** 查询分类列表 */
async function getList() {
  loading.value = true
  try {
    const data = await getItemTypeList(queryParams.value)
    flatList.value = data || []
    list.value = handleTree(data || [])
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery(data: MdItemTypeQueryParams) {
  queryParams.value = { ...data }
  currentParentId.value = 0
  getList()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {}
  currentParentId.value = 0
  getList()
}

/** 新增（顶级分类） */
function handleAdd() {
  uni.navigateTo({ url: `/pages-mes/md/item/type/form/index?parentId=0` })
}

/** 查看详情 */
function handleDetail(item: MdItemTypeVO) {
  uni.navigateTo({ url: `/pages-mes/md/item/type/detail/index?id=${item.id}` })
}

/** 左滑删除 */
async function handleSwipeDelete(item: MdItemTypeVO) {
  if (!item.id || !hasAccessByCodes(['mes:md-item-type:delete'])) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${item.name || ''}」吗？` })
  } catch {
    return
  }
  try {
    toast.loading('删除中...')
    await deleteItemType(item.id)
    toast.close()
    toast.success('删除成功')
    uni.$emit('mes:md:item:type:reload')
  } catch {
    toast.close()
  }
}

/** 重新加载 */
function reload() {
  getList()
}

/** 初始化 */
onMounted(() => {
  getList()
  uni.$on('mes:md:item:type:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:md:item:type:reload', reload)
})
</script>
