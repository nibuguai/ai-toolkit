<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 点检方案管理"
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
      empty-view-text="暂无点检方案数据"
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
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.code || '-' }}
              </view>
              <dict-tag :type="DICT_TYPE.MES_DV_CHECK_PLAN_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">方案名称：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.name || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">方案类型：</text>
              <dict-tag :type="DICT_TYPE.MES_DV_SUBJECT_TYPE" :value="item.type" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">周期数量：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.cycleCount ?? '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">周期类型：</text>
              <dict-tag :type="DICT_TYPE.MES_DV_CYCLE_TYPE" :value="item.cycleType" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">开始日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDate(item.startDate) || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">结束日期：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDate(item.endDate) || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">创建时间：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.createTime) || '-' }}</text>
            </view>
          </view>
          <view v-if="hasRowActions(item)" class="flex border-t border-t-[#f0f0f0] text-28rpx" @click.stop>
            <view v-if="canUpdate && item.status === MesDvCheckPlanStatusEnum.PREPARE" class="flex-1 py-18rpx text-center text-[#1677ff]" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="canDelete && item.status === MesDvCheckPlanStatusEnum.PREPARE" class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </view>
            <view v-if="canUpdate && item.status === MesDvCheckPlanStatusEnum.PREPARE" class="flex-1 py-18rpx text-center text-[#52c41a]" @click="handleEnable(item)">
              启用
            </view>
            <view v-if="canUpdate && item.status === MesDvCheckPlanStatusEnum.ENABLED" class="flex-1 py-18rpx text-center text-[#faad14]" @click="handleDisable(item)">
              停用
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:dv-check-plan:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { DvCheckPlanQueryParams, DvCheckPlanVO } from '@/api/mes/dv/checkplan'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteCheckPlan, disableCheckPlan, enableCheckPlan, getCheckPlanPage } from '@/api/mes/dv/checkplan'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesDvCheckPlanStatusEnum } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
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
const list = ref<DvCheckPlanVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<DvCheckPlanVO>>() // 分页组件引用
const queryParams = ref<DvCheckPlanQueryParams>({}) // 查询参数
const canUpdate = computed(() => hasAccessByCodes(['mes:dv-check-plan:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:dv-check-plan:delete']))

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
    const data = await getCheckPlanPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: DvCheckPlanQueryParams) {
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
    url: '/pages-mes/dv/checkplan/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: DvCheckPlanVO) {
  uni.navigateTo({
    url: `/pages-mes/dv/checkplan/detail/index?id=${item.id}`,
  })
}

/** 是否显示行操作 */
function hasRowActions(item: DvCheckPlanVO) {
  return (
    canUpdate.value && item.status === MesDvCheckPlanStatusEnum.PREPARE
  ) || (
    canDelete.value && item.status === MesDvCheckPlanStatusEnum.PREPARE
  ) || (
    canUpdate.value && item.status === MesDvCheckPlanStatusEnum.ENABLED
  )
}

/** 编辑 */
function handleEdit(item: DvCheckPlanVO) {
  uni.navigateTo({
    url: `/pages-mes/dv/checkplan/form/index?id=${item.id}`,
  })
}

/** 删除 */
async function handleDelete(item: DvCheckPlanVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.name || item.code}」吗？`,
    })
  } catch {
    return
  }
  await deleteCheckPlan(item.id)
  toast.success('删除成功')
  reload()
}

/** 启用 */
async function handleEnable(item: DvCheckPlanVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认启用该点检保养方案？启用后将不可修改或删除。',
    })
  } catch {
    return
  }
  await enableCheckPlan(item.id)
  toast.success('启用成功')
  reload()
}

/** 停用 */
async function handleDisable(item: DvCheckPlanVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认停用该点检保养方案？',
    })
  } catch {
    return
  }
  await disableCheckPlan(item.id)
  toast.success('停用成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:dv:checkplan:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:dv:checkplan:reload', reload)
})
</script>
