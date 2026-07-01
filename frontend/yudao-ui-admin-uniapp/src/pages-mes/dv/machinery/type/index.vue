<template>
  <view class="yd-page-container">
    <wd-navbar title="设备类型" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <SearchForm ref="searchFormRef" @search="handleQuery" @reset="handleReset" />
    <Breadcrumb v-if="!hasQuery" ref="breadcrumbRef" v-model="currentParentId" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <wd-swipe-action v-for="item in currentList" :key="item.id" :disabled="!hasAccessByCodes(['mes:dv-machinery-type:delete'])">
          <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="p-24rpx" @click="handleDetail(item)">
              <view class="flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1">
                  <view class="mb-12rpx flex items-center">
                    <view class="mr-16rpx h-48rpx w-48rpx flex shrink-0 items-center justify-center rounded-8rpx bg-[#722ed1]">
                      <wd-icon name="folder" size="20px" color="#fff" />
                    </view><view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                      {{ item.name || '-' }}
                    </view>
                  </view>
                  <view class="text-26rpx text-[#666] space-y-8rpx">
                    <view>编码：{{ item.code || '-' }}</view><view>排序：{{ item.sort ?? '-' }}</view><view class="flex items-center">
                      <text class="mr-8rpx">状态：</text><dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
                    </view>
                  </view>
                </view>
                <view v-if="!hasQuery && item.children && item.children.length > 0" class="mt-4rpx flex shrink-0 items-center" @click.stop="handleEnterChildren(item)">
                  <text class="text-24rpx text-[#722ed1]">子类型({{ item.children.length }})</text><wd-icon name="arrow-right" size="12px" color="#722ed1" />
                </view>
              </view>
            </view>
          </view>
          <template v-if="hasAccessByCodes(['mes:dv-machinery-type:delete'])" #right>
            <view class="h-full flex items-center justify-center px-36rpx" style="background:linear-gradient(135deg,#f56c6c,#e85d5d)" @click.stop="handleSwipeDelete(item)">
              <wd-icon name="delete-outline" size="36rpx" custom-style="color:#fff" /><text class="ml-8rpx text-28rpx text-white">删除</text>
            </view>
          </template>
        </wd-swipe-action>
        <view v-if="!loading && currentList.length === 0" class="py-100rpx text-center">
          <wd-empty icon="content" tip="暂无设备类型数据" />
        </view>
      </view>
    </scroll-view>
    <wd-fab v-if="hasAccessByCodes(['mes:dv-machinery-type:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { DvMachineryTypeQueryParams, DvMachineryTypeVO } from '@/api/mes/dv/machinery/type'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { deleteMachineryType, getMachineryTypeList } from '@/api/mes/dv/machinery/type'
import { useAccess } from '@/hooks/useAccess'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { findChildren, handleTree } from '@/utils/tree'
import Breadcrumb from '@/pages-mes/md/item/type/components/breadcrumb.vue'
import SearchForm from './components/search-form.vue'

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })
const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const loading = ref(false)
const flatList = ref<DvMachineryTypeVO[]>([])
const list = ref<DvMachineryTypeVO[]>([])
const currentParentId = ref(0)
const breadcrumbRef = ref<InstanceType<typeof Breadcrumb>>()
const searchFormRef = ref<InstanceType<typeof SearchForm>>()
const queryParams = ref<DvMachineryTypeQueryParams>({})
const hasQuery = computed(() => Object.keys(queryParams.value).length > 0)
const currentList = computed(() => hasQuery.value ? flatList.value : currentParentId.value === 0 ? list.value.filter(i => (i.parentId ?? 0) === 0) : findChildren(list.value, currentParentId.value))

function handleBack() {
  if (hasQuery.value) {
    searchFormRef.value?.resetFields()
    queryParams.value = {}
    currentParentId.value = 0
    getList()
    return
  }
  if (!breadcrumbRef.value?.back()) {
    navigateBackPlus('/pages-mes/home/index')
  }
}

function handleEnterChildren(item: DvMachineryTypeVO) {
  breadcrumbRef.value?.enter({ id: item.id, name: item.name })
}

async function getList() {
  loading.value = true
  try {
    const data = await getMachineryTypeList(queryParams.value)
    flatList.value = data || []
    list.value = handleTree(data || [])
  } finally {
    loading.value = false
  }
}

function handleQuery(data: DvMachineryTypeQueryParams) {
  queryParams.value = { ...data }
  currentParentId.value = 0
  getList()
}

function handleReset() {
  queryParams.value = {}
  currentParentId.value = 0
  getList()
}

function handleAdd() {
  uni.navigateTo({ url: `/pages-mes/dv/machinery/type/form/index?parentId=${currentParentId.value}` })
}

function handleDetail(item: DvMachineryTypeVO) {
  uni.navigateTo({ url: `/pages-mes/dv/machinery/type/detail/index?id=${item.id}` })
}

async function handleSwipeDelete(item: DvMachineryTypeVO) {
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${item.name || ''}」吗？` })
  } catch {
    return
  }
  try {
    toast.loading('删除中...')
    await deleteMachineryType(item.id)
    toast.close()
    toast.success('删除成功')
    uni.$emit('mes:dv:machinery-type:reload')
  } catch {
    toast.close()
  }
}

function reload() {
  getList()
}

onMounted(() => {
  getList()
  uni.$on('mes:dv:machinery-type:reload', reload)
})

onUnload(() => {
  uni.$off('mes:dv:machinery-type:reload', reload)
})
</script>
