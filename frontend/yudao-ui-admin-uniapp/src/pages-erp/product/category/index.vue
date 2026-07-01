<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="产品分类"
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
        <wd-swipe-action v-for="item in currentList" :key="item.id" :disabled="selecting || !canDelete">
          <view
            class="erp-list-card relative mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
            :class="{ 'ring-2 ring-[#1677ff]': isSelected(item.id) }"
            @click="handleCardClick(item)"
            @longpress="handleCardLongPress(item.id)"
          >
            <view
              v-if="selecting"
              class="absolute left-20rpx top-1/2 z-10"
              style="transform: translateY(-50%);"
              @click.stop="toggleSelect(item.id)"
            >
              <wd-checkbox :model-value="isSelected(item.id)" @change="toggleSelect(item.id)" />
            </view>

            <view :class="selecting ? 'pl-80rpx' : ''">
              <view class="p-24rpx">
                <view class="flex items-start justify-between gap-16rpx">
                  <view class="min-w-0 flex-1">
                    <view class="mb-12rpx flex items-center">
                      <view class="mr-16rpx h-48rpx w-48rpx flex shrink-0 items-center justify-center rounded-8rpx bg-[#13c2c2]">
                        <wd-icon name="folder" size="20px" color="#fff" />
                      </view>
                      <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                        {{ item.name || '-' }}
                      </view>
                    </view>
                    <view class="text-26rpx text-[#666] space-y-8rpx">
                      <view>分类编码：{{ item.code || '-' }}</view>
                      <view>排序：{{ item.sort ?? '-' }}</view>
                      <view class="flex items-center">
                        <text class="mr-8rpx">状态：</text>
                        <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
                      </view>
                    </view>
                  </view>
                  <view
                    v-if="!hasQuery && item.children && item.children.length > 0 && !selecting"
                    class="mt-4rpx flex shrink-0 items-center"
                    @click.stop="handleEnterChildren(item)"
                  >
                    <text class="text-24rpx text-[#13c2c2]">子分类({{ item.children.length }})</text>
                    <wd-icon name="arrow-right" size="12px" color="#13c2c2" />
                  </view>
                </view>
              </view>
            </view>
          </view>

          <template v-if="!selecting && canDelete" #right>
            <view
              class="h-full flex items-center justify-center px-36rpx"
              style="background: linear-gradient(135deg, #f56c6c, #e85d5d);"
              @click.stop="handleSwipeDelete(item)"
            >
              <wd-icon name="delete-outline" size="36rpx" custom-style="color: #fff;" />
              <text class="ml-8rpx text-28rpx text-white">删除</text>
            </view>
          </template>
        </wd-swipe-action>

        <!-- 空状态 -->
        <view v-if="!loading && currentList.length === 0" class="py-100rpx text-center">
          <wd-empty icon="content" tip="暂无产品分类数据" />
        </view>
      </view>
    </scroll-view>

    <!-- 批量操作栏 -->
    <view v-if="selecting" class="yd-detail-footer">
      <view class="flex items-center justify-between px-24rpx">
        <wd-button variant="plain" size="small" @click="exitSelectMode">
          取消
        </wd-button>
        <text class="text-28rpx text-[#666]">已选 {{ selectedIds.size }} 项</text>
        <wd-button type="danger" size="small" :loading="batchDeleting" :disabled="selectedIds.size === 0" @click="handleBatchDelete">
          删除
        </wd-button>
      </view>
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['erp:product-category:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ProductCategory } from '@/api/erp/product/category'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { deleteProductCategory, getProductCategoryList } from '@/api/erp/product/category'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { findChildren, handleTree } from '@/utils/tree'
import Breadcrumb from './components/breadcrumb.vue'
import SearchForm from './components/search-form.vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const loading = ref(false) // 列表加载状态
const flatList = ref<ProductCategory[]>([]) // 扁平分类列表
const list = ref<ProductCategory[]>([]) // 树形分类列表
const currentParentId = ref(0) // 当前层级的父节点编号
const breadcrumbRef = ref<InstanceType<typeof Breadcrumb>>() // 面包屑引用
const searchFormRef = ref<InstanceType<typeof SearchForm>>() // 搜索组件引用
const queryParams = ref<Record<string, any>>({}) // 已生效搜索条件
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

const dialog = useDialog()
const toast = useToast()
const selecting = ref(false) // 选择模式
const selectedIds = ref<Set<number | string>>(new Set()) // 已选 ID 集合
const batchDeleting = ref(false) // 批量删除提交状态
const canDelete = computed(() => hasAccessByCodes(['erp:product-category:delete'])) // 是否可删除

/** 判断记录是否已选中 */
function isSelected(id?: number | string) {
  return id != null && selectedIds.value.has(id)
}

/** 切换选中状态 */
function toggleSelect(id?: number | string) {
  if (id == null) {
    return
  }
  const nextIds = new Set(selectedIds.value)
  if (nextIds.has(id)) {
    nextIds.delete(id)
  } else {
    nextIds.add(id)
  }
  selectedIds.value = nextIds
  selecting.value = nextIds.size > 0
}

/** 长按进入选择模式 */
function enterSelectMode(id?: number | string) {
  selecting.value = true
  toggleSelect(id)
}

/** 退出选择模式 */
function exitSelectMode() {
  selecting.value = false
  selectedIds.value = new Set()
}

/** 点击卡片 */
function handleCardClick(item: ProductCategory) {
  if (selecting.value) {
    toggleSelect(item.id)
    return
  }
  handleDetail(item)
}

/** 长按卡片 */
function handleCardLongPress(id?: number | string) {
  if (selecting.value || !canDelete.value) {
    return
  }
  enterSelectMode(id)
}

/** 删除选中记录 */
async function deleteSelectedRecords(ids: number[]) {
  for (const id of ids) {
    await deleteProductCategory(id)
  }
}

/** 左滑删除 */
async function handleSwipeDelete(item: ProductCategory) {
  if (!canDelete.value || item.id == null) {
    return
  }
  const itemRecord = item as Record<string, any>
  const name = itemRecord.name || itemRecord.no || ''
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除${name ? `「${name}」` : '该记录'}吗？`,
    })
  } catch {
    return
  }
  try {
    toast.loading('删除中...')
    await deleteSelectedRecords([Number(item.id)])
    toast.success('删除成功')
    uni.$emit('erp:product-category:reload')
  } finally {
    toast.close()
  }
}

/** 批量删除 */
async function handleBatchDelete() {
  if (selectedIds.value.size === 0 || !canDelete.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除选中的 ${selectedIds.value.size} 条记录吗？`,
    })
  } catch {
    return
  }
  batchDeleting.value = true
  try {
    toast.loading('删除中...')
    await deleteSelectedRecords(Array.from(selectedIds.value).map(Number))
    toast.success('删除成功')
    uni.$emit('erp:product-category:reload')
    exitSelectMode()
  } finally {
    toast.close()
    batchDeleting.value = false
  }
}

/** 返回上一页或上一层级 */
function handleBack() {
  if (selecting.value) {
    exitSelectMode()
    return
  }
  if (hasQuery.value) {
    searchFormRef.value?.resetFields()
    queryParams.value = {}
    currentParentId.value = 0
    getList()
    return
  }
  if (!breadcrumbRef.value?.back()) {
    navigateBackPlus()
  }
}

/** 进入子分类层级 */
function handleEnterChildren(item: ProductCategory) {
  if (!item.id) {
    return
  }
  breadcrumbRef.value?.enter({ id: item.id, name: item.name })
}

/** 查询产品分类列表 */
async function getList() {
  loading.value = true
  try {
    const data = await getProductCategoryList(queryParams.value)
    flatList.value = data || []
    list.value = handleTree(data || [])
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any>) {
  exitSelectMode()
  queryParams.value = {
    name: data.name || undefined,
    status: data.status === -1 ? undefined : data.status,
  }
  Object.keys(queryParams.value).forEach((key) => {
    if (queryParams.value[key] === undefined || queryParams.value[key] === '') {
      delete queryParams.value[key]
    }
  })
  currentParentId.value = 0
  getList()
}

/** 重置按钮操作 */
function handleReset() {
  exitSelectMode()
  queryParams.value = {}
  currentParentId.value = 0
  getList()
}

/** 新增产品分类 */
function handleAdd() {
  uni.navigateTo({ url: `/pages-erp/product/category/form/index?parentId=${currentParentId.value}` })
}

/** 查看详情 */
function handleDetail(item: ProductCategory) {
  uni.navigateTo({ url: `/pages-erp/product/category/detail/index?id=${item.id}` })
}

/** 重新加载 */
function reload() {
  exitSelectMode()
  getList()
}

/** 初始化 */
onMounted(() => {
  getList()
  uni.$on('erp:product-category:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:product-category:reload', reload)
})
</script>
