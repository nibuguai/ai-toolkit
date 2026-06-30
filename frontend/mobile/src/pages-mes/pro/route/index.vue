<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar title="工艺路线" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <SearchForm ref="searchFormRef" @search="handleQuery" @reset="handleReset" />
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无工艺路线数据" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="p-24rpx" @click="handleDetail(item)">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>编码：{{ item.code || '-' }}</view>
              <view>路线说明：{{ item.description || '-' }}</view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
              <view>创建时间：{{ formatDateTime(item.createTime) || '-' }}</view>
            </view>
          </view>
          <view class="flex border-t border-[#f3f4f6] text-26rpx">
            <view v-if="canUpdate" class="flex-1 py-18rpx text-center text-[#1677ff]" @click="handleStatusChange(item)">
              {{ item.status === CommonStatusEnum.ENABLE ? '停用' : '启用' }}
            </view>
            <view v-if="canUpdate" class="flex-1 py-18rpx text-center" :class="isRouteDisabled(item) ? 'text-[#e6a23c]' : 'text-[#bbb]'" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="canDelete" class="flex-1 py-18rpx text-center" :class="isRouteDisabled(item) ? 'text-[#f56c6c]' : 'text-[#bbb]'" @click="handleDelete(item)">
              删除
            </view>
          </view>
        </view>
      </view>
    </z-paging>
    <wd-fab v-if="hasAccessByCodes(['mes:pro-route:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { ProRouteQueryParams, ProRouteVO } from '@/api/mes/pro/route'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteRoute, getRoutePage, updateRouteStatus } from '@/api/mes/pro/route'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
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
const list = ref<ProRouteVO[]>([])
const pagingRef = ref<ZPagingRef<ProRouteVO>>()
const queryParams = ref<Partial<ProRouteQueryParams>>({})
const searchFormRef = ref<InstanceType<typeof SearchForm>>()
const canUpdate = computed(() => hasAccessByCodes(['mes:pro-route:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:pro-route:delete']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 判断路线是否停用 */
function isRouteDisabled(item: ProRouteVO) {
  return item.status === CommonStatusEnum.DISABLE
}

/** 查询工艺路线列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getRoutePage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Partial<ProRouteQueryParams>) {
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

/** 新增工艺路线 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/pro/route/form/index' })
}

/** 查看详情 */
function handleDetail(item: ProRouteVO) {
  uni.navigateTo({ url: `/pages-mes/pro/route/detail/index?id=${item.id}` })
}

/** 编辑工艺路线 */
function handleEdit(item: ProRouteVO) {
  if (!isRouteDisabled(item)) {
    toast.warning('仅停用状态可以编辑')
    return
  }
  uni.navigateTo({ url: `/pages-mes/pro/route/form/index?id=${item.id}` })
}

/** 启用或停用工艺路线 */
async function handleStatusChange(item: ProRouteVO) {
  if (!item.id || item.status == null) {
    return
  }
  const nextStatus = item.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  const action = nextStatus === CommonStatusEnum.ENABLE ? '启用' : '停用'
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认要${action}「${item.name || item.code}」工艺路线吗？${nextStatus === CommonStatusEnum.ENABLE ? '启用前请确认工序和产品 BOM 配置完整。' : ''}`,
    })
  } catch {
    return
  }
  await updateRouteStatus(item.id, nextStatus)
  toast.success(`${action}成功`)
  reload()
}

/** 删除工艺路线 */
async function handleDelete(item: ProRouteVO) {
  if (!item.id) {
    return
  }
  if (!isRouteDisabled(item)) {
    toast.warning('仅停用状态可以删除')
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${item.name || item.code}」工艺路线吗？` })
  } catch {
    return
  }
  await deleteRoute(item.id)
  toast.success('删除成功')
  reload()
}

onMounted(() => {
  uni.$on('mes:pro:route:reload', reload)
})

onUnload(() => {
  uni.$off('mes:pro:route:reload', reload)
})
</script>
