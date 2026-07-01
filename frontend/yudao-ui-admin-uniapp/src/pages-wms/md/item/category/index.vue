<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商品分类"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 分类列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="20"
      :refresher-enabled="true"
      :inside-more="true"
      empty-view-text="暂无商品分类数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-center justify-between">
              <view class="text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">分类编号：</text>
              <text>{{ item.code || '-' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">上级分类：</text>
              <text>{{ getCategoryName(item.parentId) }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['wms:item-category:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ItemCategory } from '@/api/wms/md/item/category'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getItemCategoryList } from '@/api/wms/md/item/category'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<ItemCategory[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询商品分类列表 */
async function queryList() {
  try {
    const data = await getItemCategoryList(queryParams.value)
    list.value = data
    pagingRef.value?.completeByTotal(data, data.length)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 获取分类名称 */
function getCategoryName(parentId?: number) {
  if (!parentId) {
    return '顶级分类'
  }
  return list.value.find(item => item.id === parentId)?.name || '-'
}

/** 新增商品分类 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-wms/md/item/category/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: ItemCategory) {
  uni.navigateTo({
    url: `/pages-wms/md/item/category/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('wms:item-category:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('wms:item-category:reload', reload)
})
</script>
