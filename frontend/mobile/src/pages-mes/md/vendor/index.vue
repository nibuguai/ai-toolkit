<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar title="供应商" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <SearchForm ref="searchFormRef" @search="handleQuery" @reset="handleReset" />
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无供应商数据" @query="queryList">
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
              <view v-if="item.nickname">
                简称：{{ item.nickname }}
              </view>
              <view class="flex items-center">
                <text class="mr-8rpx">等级：</text><dict-tag v-if="item.level" :type="DICT_TYPE.MES_VENDOR_LEVEL" :value="item.level" /><text v-else>-</text>
              </view>
              <view>评分：{{ item.score ?? '-' }}</view>
              <view>电话：{{ item.telephone || '-' }}</view>
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
      </wd-button><text class="text-28rpx text-[#666]">已选 {{ selectedIds.size }} 项</text><wd-button type="danger" size="small" :loading="batchDeleting" :disabled="selectedIds.size === 0" @click="handleBatchDelete">
        删除
      </wd-button>
    </MesFooterActions>
    <wd-fab v-if="hasAccessByCodes(['mes:md-vendor:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { MdVendorQueryParams, MdVendorVO } from '@/api/mes/md/vendor'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { deleteVendor, getVendorPage } from '@/api/mes/md/vendor'
import { useAccess } from '@/hooks/useAccess'
import { useMesBatchSelect } from '@/pages-mes/hooks/useMesBatchSelect'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import ListCardWrapper from '@/pages-mes/components/list-card-wrapper.vue'
import SearchForm from './components/search-form.vue'

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })
const { hasAccessByCodes } = useAccess()
const list = ref<MdVendorVO[]>([])
const pagingRef = ref<ZPagingRef<MdVendorVO>>()
const queryParams = ref<MdVendorQueryParams>({})
const { selecting, selectedIds, batchDeleting, canDelete, isSelected, toggleSelect, enterSelectMode, exitSelectMode, handleSwipeDelete, handleBatchDelete } = useMesBatchSelect({
  permission: 'mes:md-vendor:delete',
  deleteApi: (ids: number[]) => Promise.all(ids.map(id => deleteVendor(id))).then(() => {}),
  reloadEvent: 'mes:md:vendor:reload',
})

function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getVendorPage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}
function handleQuery(data: MdVendorQueryParams) {
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
  uni.navigateTo({ url: `/pages-mes/md/vendor/form/index` })
}
function handleDetail(item: MdVendorVO) {
  uni.navigateTo({ url: `/pages-mes/md/vendor/detail/index?id=${item.id}` })
}
onMounted(() => {
  uni.$on('mes:md:vendor:reload', reload)
})

onUnload(() => {
  uni.$off('mes:md:vendor:reload', reload)
})
</script>
