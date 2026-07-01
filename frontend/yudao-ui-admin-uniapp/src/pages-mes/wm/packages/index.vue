<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 装箱单管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 装箱单列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无装箱单数据"
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
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.code || '-' }}
                </view>
                <view class="mt-4rpx truncate text-24rpx text-[#999]">
                  {{ item.parentId && item.parentId !== 0 ? `子箱 #${item.parentId}` : '主箱' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_PACKAGE_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">装箱日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.packageDate) || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">销售订单：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.salesOrderCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">发票编号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.invoiceCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">客户：</text>
              <text class="min-w-0 flex-1 truncate">{{ getClientText(item) }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">尺寸：</text>
              <text class="min-w-0 flex-1 truncate">{{ getSizeText(item) }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">重量：</text>
              <text class="min-w-0 flex-1 truncate">{{ getWeightText(item) }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">检查员：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.inspectorName || '-' }}</text>
            </view>
          </view>
          <view v-if="hasRowActions(item)" class="flex border-t border-t-[#f0f0f0] text-28rpx" @click.stop>
            <view
              v-if="hasAccessByCodes(['mes:wm-package:update']) && item.status === MesWmPackageStatusEnum.PREPARE"
              class="flex-1 py-18rpx text-center text-[#1677ff]"
              @click="handleEdit(item)"
            >
              编辑
            </view>
            <view
              v-if="hasAccessByCodes(['mes:wm-package:update']) && item.status === MesWmPackageStatusEnum.PREPARE"
              class="flex-1 py-18rpx text-center text-[#52c41a]"
              @click="handleFinish(item)"
            >
              完成
            </view>
            <view
              v-if="hasAccessByCodes(['mes:wm-package:delete']) && item.status === MesWmPackageStatusEnum.PREPARE"
              class="flex-1 py-18rpx text-center text-[#f56c6c]"
              @click="handleDelete(item)"
            >
              删除
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:wm-package:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WmPackageQueryParams, WmPackageVO } from '@/api/mes/wm/packages'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deletePackage, finishPackage, getPackagePage } from '@/api/mes/wm/packages'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmPackageStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
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
const list = ref<WmPackageVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmPackageVO>>() // 分页组件引用
const queryParams = ref<WmPackageQueryParams>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 客户展示 */
function getClientText(item: WmPackageVO) {
  const code = item.clientCode || ''
  const name = item.clientName || ''
  if (!code && !name) {
    return '-'
  }
  return [code, name].filter(Boolean).join(' / ')
}

/** 尺寸展示 */
function getSizeText(item: WmPackageVO) {
  const values = [item.length, item.width, item.height].map(value => value ?? '-').join(' x ')
  return `${values} ${item.sizeUnitName || ''}`.trim()
}

/** 重量展示 */
function getWeightText(item: WmPackageVO) {
  const net = item.netWeight ?? '-'
  const gross = item.grossWeight ?? '-'
  return `净重 ${net} / 毛重 ${gross} ${item.weightUnitName || ''}`.trim()
}

/** 是否显示行操作 */
function hasRowActions(item: WmPackageVO) {
  return item.status === MesWmPackageStatusEnum.PREPARE && (
    hasAccessByCodes(['mes:wm-package:update']) || hasAccessByCodes(['mes:wm-package:delete'])
  )
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getPackagePage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: WmPackageQueryParams) {
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
    url: '/pages-mes/wm/packages/form/index',
  })
}

/** 编辑 */
function handleEdit(item: WmPackageVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/packages/form/index?id=${item.id}`,
  })
}

/** 查看详情 */
function handleDetail(item: WmPackageVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/packages/detail/index?id=${item.id}`,
  })
}

/** 完成装箱单 */
async function handleFinish(item: WmPackageVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认完成装箱单「${item.code}」？完成后将不可编辑。`,
    })
  } catch {
    return
  }
  await finishPackage(item.id)
  toast.success('完成成功')
  reload()
}

/** 删除装箱单 */
async function handleDelete(item: WmPackageVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除装箱单「${item.code}」吗？`,
    })
  } catch {
    return
  }
  await deletePackage(item.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:packages:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:packages:reload', reload)
})
</script>
