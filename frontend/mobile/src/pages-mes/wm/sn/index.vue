<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES SN 码管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />
    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 顶部操作 -->
    <view v-if="hasTopActions" class="bg-white px-24rpx py-16rpx">
      <view class="grid grid-cols-2 gap-16rpx">
        <wd-button
          v-if="hasAccessByCodes(['mes:wm-sn:create'])"
          block variant="plain" @click="handleGenerate"
        >
          生成 SN 码
        </wd-button>
      </view>
    </view>

    <!-- SN 批次列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无 SN 码数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.uuid"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.itemCode || '-' }}
                </view>
                <view class="mt-4rpx truncate text-24rpx text-[#999]">
                  {{ item.itemName || '-' }}
                </view>
              </view>
              <view class="shrink-0 rounded-999rpx bg-[#e6f4ff] px-16rpx py-6rpx text-24rpx text-[#1677ff]">
                {{ item.count ?? 0 }} 个
              </view>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">单位：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.unitName || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">批次号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">批次 UUID：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.uuid || '-' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">生成时间：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.createTime) || '-' }}</text>
            </view>
          </view>
          <view v-if="hasRowActions" class="flex border-t border-t-[#f0f0f0] text-28rpx" @click.stop>
            <view
              v-if="hasAccessByCodes(['mes:wm-sn:query'])"
              class="flex-1 py-18rpx text-center text-[#1677ff]"
              @click="handleDetail(item)"
            >
              查看明细
            </view>
            <view
              v-if="hasAccessByCodes(['mes:wm-sn:export'])"
              class="flex-1 py-18rpx text-center text-[#52c41a]"
              @click="handleExportDetail(item)"
            >
              导出明细
            </view>
            <view
              v-if="hasAccessByCodes(['mes:wm-sn:delete'])"
              class="flex-1 py-18rpx text-center text-[#f56c6c]"
              @click="handleDelete(item)"
            >
              删除
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { WmSnGroupVO, WmSnQueryParams } from '@/api/mes/wm/sn'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteSnBatch, getSnGroupPage } from '@/api/mes/wm/sn'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { downloadApiFile } from '@/utils/download'
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
const list = ref<WmSnGroupVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmSnGroupVO>>() // 分页组件引用
const queryParams = ref<WmSnQueryParams>({}) // 查询参数
const hasTopActions = computed(() => {
  return hasAccessByCodes(['mes:wm-sn:create'])
})
const hasRowActions = computed(() => {
  return hasAccessByCodes(['mes:wm-sn:query'])
    || hasAccessByCodes(['mes:wm-sn:export'])
    || hasAccessByCodes(['mes:wm-sn:delete'])
})

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
    const data = await getSnGroupPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: WmSnQueryParams) {
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

/** 生成 SN 码 */
function handleGenerate() {
  uni.navigateTo({
    url: '/pages-mes/wm/sn/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: WmSnGroupVO) {
  if (!item.uuid) {
    toast.warning('当前批次缺少 UUID，无法查看明细')
    return
  }
  uni.navigateTo({
    url: `/pages-mes/wm/sn/detail/index?id=${encodeURIComponent(item.uuid)}`,
  })
}

/** 删除批次 */
async function handleDelete(item: WmSnGroupVO) {
  if (!item.uuid) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除批次「${item.batchCode || item.itemCode || item.uuid}」的全部 SN 码吗？`,
    })
  } catch {
    return
  }
  await deleteSnBatch(item.uuid)
  toast.success('删除成功')
  reload()
}

/** 导出批次明细 */
async function handleExportDetail(item: WmSnGroupVO) {
  if (!item.uuid) {
    return
  }
  const { confirm } = await uni.showModal({
    title: '导出确认',
    content: '确定要导出该批次的 SN 码明细吗？',
  })
  if (!confirm) {
    return
  }
  await downloadApiFile('/mes/wm/sn/export-excel', { uuid: item.uuid }, 'SN码明细.xls')
  toast.success('导出成功')
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:sn:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:sn:reload', reload)
})
</script>
