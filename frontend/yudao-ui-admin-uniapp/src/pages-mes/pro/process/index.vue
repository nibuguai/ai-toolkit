<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar title="生产工序" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <SearchForm ref="searchFormRef" @search="handleQuery" @reset="handleReset" />
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无生产工序数据" @query="queryList">
      <view class="p-24rpx">
        <ListCardWrapper v-for="item in list" :key="item.id" :item="item" :item-id="item.id" :selecting="selecting" :selected="isSelected(item.id)" :can-delete="canDelete" @click="handleDetail" @longpress="enterSelectMode" @toggle-select="toggleSelect" @swipe-delete="handleSwipeDelete">
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>编码：{{ item.code || '-' }}</view>
              <view>工序说明：{{ item.attention || '-' }}</view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
              <view>创建时间：{{ formatDateTime(item.createTime) || '-' }}</view>
            </view>
          </view>
        </ListCardWrapper>
      </view>
    </z-paging>
    <MesFooterActions v-if="selecting" content-class="flex items-center justify-between px-24rpx">
      <wd-button variant="plain" size="small" @click="exitSelectMode">
        取消
      </wd-button>
      <text class="text-28rpx text-[#666]">已选 {{ selectedIds.size }} 项</text>
      <wd-button type="danger" size="small" :loading="batchDeleting" :disabled="selectedIds.size === 0" @click="handleBatchDelete">
        删除
      </wd-button>
    </MesFooterActions>
    <wd-fab v-if="hasAccessByCodes(['mes:pro-process:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { ProProcessQueryParams, ProProcessVO } from '@/api/mes/pro/process'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { deleteProcess, getProcessPage } from '@/api/mes/pro/process'
import { useAccess } from '@/hooks/useAccess'
import { useMesBatchSelect } from '@/pages-mes/hooks/useMesBatchSelect'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ListCardWrapper from '@/pages-mes/components/list-card-wrapper.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<ProProcessVO[]>([])
const pagingRef = ref<ZPagingRef<ProProcessVO>>()
const queryParams = ref<Partial<ProProcessQueryParams>>({})
const searchFormRef = ref<InstanceType<typeof SearchForm>>()
const {
  selecting,
  selectedIds,
  batchDeleting,
  canDelete,
  isSelected,
  toggleSelect,
  enterSelectMode,
  exitSelectMode,
  handleSwipeDelete,
  handleBatchDelete,
} = useMesBatchSelect({
  permission: 'mes:pro-process:delete',
  deleteApi: (ids: number[]) => Promise.all(ids.map(id => deleteProcess(id))).then(() => {}),
  reloadEvent: 'mes:pro:process:reload',
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 查询生产工序列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getProcessPage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Partial<ProProcessQueryParams>) {
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

/** 新增生产工序 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/pro/process/form/index' })
}

/** 查看详情 */
function handleDetail(item: ProProcessVO) {
  uni.navigateTo({ url: `/pages-mes/pro/process/detail/index?id=${item.id}` })
}

onMounted(() => {
  uni.$on('mes:pro:process:reload', reload)
})

onUnload(() => {
  uni.$off('mes:pro:process:reload', reload)
})
</script>
