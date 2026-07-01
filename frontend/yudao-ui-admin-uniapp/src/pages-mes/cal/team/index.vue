<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="班组设置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <!-- 搜索组件 -->
    <SearchForm ref="searchFormRef" @search="handleQuery" @reset="handleReset" />
    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无班组数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="p-24rpx" @click="handleDetail(item)">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.name || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.code || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.calendarType != null" :type="DICT_TYPE.MES_CAL_CALENDAR_TYPE" :value="item.calendarType" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
              <view>创建时间：{{ formatDateTime(item.createTime) || '-' }}</view>
            </view>
          </view>
          <view class="flex border-t border-[#f3f4f6] text-26rpx">
            <view v-if="canUpdate" class="flex-1 py-18rpx text-center text-[#e6a23c]" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="canDelete" class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:cal-team:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { CalTeamQueryParams, CalTeamVO } from '@/api/mes/cal/team'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteTeam, getTeamPage } from '@/api/mes/cal/team'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const list = ref<CalTeamVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<CalTeamVO>>() // 分页组件引用
const queryParams = ref<Partial<CalTeamQueryParams>>({}) // 查询参数
const searchFormRef = ref<InstanceType<typeof SearchForm>>() // 搜索组件引用
const canUpdate = computed(() => hasAccessByCodes(['mes:cal-team:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:cal-team:delete']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 查询班组列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getTeamPage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Partial<CalTeamQueryParams>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {}
  searchFormRef.value?.resetFields()
  reload()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增班组 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/cal/team/form/index' })
}

/** 查看详情 */
function handleDetail(item: CalTeamVO) {
  if (!item.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/cal/team/detail/index?id=${item.id}` })
}

/** 编辑班组 */
function handleEdit(item: CalTeamVO) {
  if (!item.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/cal/team/form/index?id=${item.id}` })
}

/** 删除班组 */
async function handleDelete(item: CalTeamVO) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除确认',
      msg: `确定要删除「${item.name || item.code}」班组吗？删除后会级联清理班组成员和排班记录。`,
    })
  } catch {
    return
  }
  await deleteTeam(item.id)
  toast.success('删除成功')
  reload()
}

onMounted(() => {
  uni.$on('mes:cal:team:reload', reload)
})

onUnload(() => {
  uni.$off('mes:cal:team:reload', reload)
})
</script>
