<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="API 密钥"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 密钥列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无 API 密钥"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                {{ item.apiKey ? `${String(item.apiKey).slice(0, 8)}...` : '-' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="text-26rpx text-[#666]">
            <view class="mb-8rpx">
              平台：<dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="item.platform" />
            </view>
            <view class="line-clamp-1 text-24rpx text-[#999]">
              {{ item.url || '默认 API 地址' }}
            </view>
          </view>
          <view class="mt-20rpx flex justify-end gap-16rpx">
            <wd-button
              v-if="hasAccessByCodes(['ai:api-key:update'])"
              size="small" type="warning" variant="plain"
              @click="handleEdit(item)"
            >
              编辑
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['ai:api-key:delete'])"
              size="small" type="danger" variant="plain"
              @click="handleDelete(item)"
            >
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['ai:api-key:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ApiKeyVO } from '@/api/ai/model/apiKey'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { deleteApiKey, getApiKeyPage } from '@/api/ai/model/apiKey'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<ApiKeyVO[]>([]) // 列表数据
const queryParams = ref<Record<string, any>>({}) // 查询参数
const pagingRef = ref<any>() // 分页组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/model/index')
}

/** 查询密钥列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = { ...queryParams.value, pageNo, pageSize }
    const data = await getApiKeyPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
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

/** 新增密钥 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-ai/model/apiKey/form/index' })
}

/** 编辑密钥 */
function handleEdit(item: ApiKeyVO) {
  uni.navigateTo({ url: `/pages-ai/model/apiKey/form/index?id=${item.id}` })
}

/** 删除密钥 */
async function handleDelete(item: ApiKeyVO) {
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除密钥【${item.name}】吗？` })
  } catch {
    return
  }
  await deleteApiKey(item.id!)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:api-key:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:api-key:reload', reload)
})
</script>
