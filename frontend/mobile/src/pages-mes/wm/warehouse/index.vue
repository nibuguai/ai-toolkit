<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar title="仓库" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <SearchForm ref="searchFormRef" @search="handleQuery" @reset="handleReset" />
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无仓库数据" @query="queryList">
      <view class="p-24rpx">
        <ListCardWrapper v-for="item in list" :key="item.id" :item="item" :item-id="item.id" :selecting="selecting" :selected="isSelected(item.id)" :can-delete="canDelete" @click="handleDetail" @longpress="enterSelectMode" @toggle-select="toggleSelect" @swipe-delete="handleSwipeDelete">
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <view v-if="item.frozen" class="text-24rpx text-[#f56c6c]">
                已冻结
              </view>
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>编码：{{ item.code || '-' }}</view>
              <view>面积：{{ item.area ?? '-' }} ㎡</view>
              <view>负责人：{{ item.chargeUserName || '-' }}</view>
              <view class="flex items-center">
                <text class="mr-8rpx">是否冻结：</text>
                <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(item.frozen)" />
              </view>
              <view v-if="item.address">
                地址：{{ item.address }}
              </view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
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
    <wd-fab v-if="hasAccessByCodes(['mes:wm-warehouse:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { WmWarehouseQueryParams, WmWarehouseVO } from '@/api/mes/wm/warehouse'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { deleteWarehouse, getWarehousePage } from '@/api/mes/wm/warehouse'
import { getSimpleUserList } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { useMesBatchSelect } from '@/pages-mes/hooks/useMesBatchSelect'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import ListCardWrapper from '@/pages-mes/components/list-card-wrapper.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<WmWarehouseVO[]>([])
const pagingRef = ref<ZPagingRef<WmWarehouseVO>>()
const queryParams = ref<WmWarehouseQueryParams>({})
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
  permission: 'mes:wm-warehouse:delete',
  deleteApi: (ids: number[]) => Promise.all(ids.map(id => deleteWarehouse(id))).then(() => {}),
  reloadEvent: 'mes:wm:warehouse:reload',
})

function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

async function queryList(pageNo: number, pageSize: number) {
  try {
    const [data, users] = await Promise.all([
      getWarehousePage({ ...queryParams.value, pageNo, pageSize }),
      getSimpleUserList(),
    ])
    const userMap = new Map(users.filter(user => user.id !== undefined).map(user => [user.id, user.nickname]))
    const rows = data.list.map(item => ({ ...item, chargeUserName: item.chargeUserId == null ? null : userMap.get(item.chargeUserId) || null }))
    pagingRef.value?.completeByTotal(rows, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

function handleQuery(data: WmWarehouseQueryParams) {
  queryParams.value = { ...data }
  reload()
}

function handleReset() {
  queryParams.value = {}
  reload()
}

function reload() {
  pagingRef.value?.reload()
}

function handleAdd() {
  uni.navigateTo({ url: `/pages-mes/wm/warehouse/form/index` })
}

function handleDetail(item: WmWarehouseVO) {
  uni.navigateTo({ url: `/pages-mes/wm/warehouse/detail/index?id=${item.id}` })
}

onMounted(() => {
  uni.$on('mes:wm:warehouse:reload', reload)
})

onUnload(() => {
  uni.$off('mes:wm:warehouse:reload', reload)
})
</script>
