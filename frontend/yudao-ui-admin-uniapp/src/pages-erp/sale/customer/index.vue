<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="客户"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 客户列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无客户数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <wd-swipe-action v-for="item in list" :key="item.id" :disabled="selecting || !canDelete">
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
                <view class="mb-16rpx flex items-start justify-between gap-16rpx">
                  <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                    {{ item.name || '-' }}
                  </view>
                  <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
                </view>
                <view v-if="item.contact" class="mb-12rpx text-28rpx text-[#666]">
                  <text class="mr-8rpx text-[#999]">联系人：</text>{{ item.contact }}
                </view>
                <view v-if="item.mobile" class="mb-12rpx text-28rpx text-[#666]">
                  <text class="mr-8rpx text-[#999]">手机：</text>{{ item.mobile }}
                </view>
                <view v-if="item.telephone" class="mb-12rpx text-28rpx text-[#666]">
                  <text class="mr-8rpx text-[#999]">电话：</text>{{ item.telephone }}
                </view>
                <view v-if="item.email" class="mb-12rpx text-28rpx text-[#666]">
                  <text class="mr-8rpx text-[#999]">邮箱：</text>{{ item.email }}
                </view>
                <view v-if="item.remark" class="text-28rpx text-[#666]">
                  <text class="mr-8rpx text-[#999]">备注：</text>
                  <text class="line-clamp-1">{{ item.remark }}</text>
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
      </view>
    </z-paging>

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
      v-if="hasAccessByCodes(['erp:customer:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Customer } from '@/api/erp/sale/customer'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { deleteCustomer, getCustomerPage } from '@/api/erp/sale/customer'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const list = ref<Customer[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

const dialog = useDialog()
const toast = useToast()
const selecting = ref(false) // 选择模式
const selectedIds = ref<Set<number | string>>(new Set()) // 已选 ID 集合
const batchDeleting = ref(false) // 批量删除提交状态
const canDelete = computed(() => hasAccessByCodes(['erp:customer:delete'])) // 是否可删除

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
function handleCardClick(item: Customer) {
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
    await deleteCustomer(id)
  }
}

/** 左滑删除 */
async function handleSwipeDelete(item: Customer) {
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
    uni.$emit('erp:customer:reload')
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
    uni.$emit('erp:customer:reload')
    exitSelectMode()
  } finally {
    toast.close()
    batchDeleting.value = false
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询客户列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getCustomerPage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
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

/** 新增客户 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-erp/sale/customer/form/index' })
}

/** 查看详情 */
function handleDetail(item: Customer) {
  uni.navigateTo({ url: `/pages-erp/sale/customer/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('erp:customer:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('erp:customer:reload', reload)
})
</script>
