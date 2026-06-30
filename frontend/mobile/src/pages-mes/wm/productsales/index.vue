<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 销售出库管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />
    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />
    <!-- 列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无销售出库数据"
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
            <view class="mb-16rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.code || '-' }}
                </view>
                <view class="mt-4rpx truncate text-24rpx text-[#999]">
                  {{ item.name || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_PRODUCT_SALES_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">发货通知单号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.noticeCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">销售订单编号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.salesOrderCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">客户：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.clientName || item.clientCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">收货人：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.contactName || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">运输单号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.shippingNumber || '-' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">出库日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDate(item.salesDate || item.shipmentDate) || '-' }}</text>
            </view>
          </view>
          <view v-if="hasRowActions(item)" class="flex flex-wrap border-t border-t-[#f0f0f0] text-28rpx" @click.stop>
            <view v-if="canUpdatePrepare(item)" class="min-w-180rpx flex-1 py-18rpx text-center text-[#1677ff]" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="canDeletePrepare(item)" class="min-w-180rpx flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </view>
            <view v-if="canStock(item)" class="min-w-180rpx flex-1 py-18rpx text-center text-[#52c41a]" @click="handleStock(item)">
              拣货
            </view>
            <view v-if="canShipping(item)" class="min-w-180rpx flex-1 py-18rpx text-center text-[#faad14]" @click="handleShipping(item)">
              填写运单
            </view>
            <view v-if="canFinish(item)" class="min-w-180rpx flex-1 py-18rpx text-center text-[#52c41a]" @click="handleFinish(item)">
              执行出库
            </view>
            <view v-if="canCancel(item)" class="min-w-180rpx flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleCancel(item)">
              取消
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:wm-product-sales:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WmProductSalesQueryParams, WmProductSalesVO } from '@/api/mes/wm/productsales'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteProductSales, getProductSalesPage } from '@/api/mes/wm/productsales'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmProductSalesStatusEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
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
const list = ref<WmProductSalesVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmProductSalesVO>>() // 分页组件引用
const queryParams = ref<WmProductSalesQueryParams>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getProductSalesPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: WmProductSalesQueryParams) {
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

/** 新增 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-mes/wm/productsales/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: WmProductSalesVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/productsales/detail/index?id=${item.id}`,
  })
}

/** 是否可编辑草稿 */
function canUpdatePrepare(item: WmProductSalesVO) {
  return hasAccessByCodes(['mes:wm-product-sales:update']) && item.status === MesWmProductSalesStatusEnum.PREPARE
}

/** 是否可删除草稿 */
function canDeletePrepare(item: WmProductSalesVO) {
  return hasAccessByCodes(['mes:wm-product-sales:delete']) && item.status === MesWmProductSalesStatusEnum.PREPARE
}

/** 是否可拣货 */
function canStock(item: WmProductSalesVO) {
  return hasAccessByCodes(['mes:wm-product-sales:stock']) && item.status === MesWmProductSalesStatusEnum.APPROVING
}

/** 是否可填写运单 */
function canShipping(item: WmProductSalesVO) {
  return hasAccessByCodes(['mes:wm-product-sales:shipping']) && item.status === MesWmProductSalesStatusEnum.SHIPPING
}

/** 是否可执行出库 */
function canFinish(item: WmProductSalesVO) {
  return hasAccessByCodes(['mes:wm-product-sales:finish']) && item.status === MesWmProductSalesStatusEnum.APPROVED
}

/** 是否可取消 */
function canCancel(item: WmProductSalesVO) {
  return hasAccessByCodes(['mes:wm-product-sales:cancel'])
    && [
      MesWmProductSalesStatusEnum.CONFIRMED,
      MesWmProductSalesStatusEnum.APPROVING,
      MesWmProductSalesStatusEnum.SHIPPING,
      MesWmProductSalesStatusEnum.APPROVED,
    ].includes(item.status)
}

/** 是否存在行操作 */
function hasRowActions(item: WmProductSalesVO) {
  return canUpdatePrepare(item)
    || canDeletePrepare(item)
    || canStock(item)
    || canShipping(item)
    || canFinish(item)
    || canCancel(item)
}

/** 编辑 */
function handleEdit(item: WmProductSalesVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/productsales/form/index?id=${item.id}`,
  })
}

/** 拣货 */
function handleStock(item: WmProductSalesVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/productsales/form/index?id=${item.id}&mode=stock`,
  })
}

/** 填写运单 */
function handleShipping(item: WmProductSalesVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/productsales/form/index?id=${item.id}&mode=shipping`,
  })
}

/** 执行出库 */
function handleFinish(item: WmProductSalesVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/productsales/form/index?id=${item.id}&mode=finish`,
  })
}

/** 取消 */
function handleCancel(item: WmProductSalesVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/productsales/form/index?id=${item.id}&mode=cancel`,
  })
}

/** 删除 */
async function handleDelete(item: WmProductSalesVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.code || item.name || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteProductSales(item.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:productsales:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:productsales:reload', reload)
})
</script>
