<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="聊天角色"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 角色列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无聊天角色"
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
                {{ item.publicStatus ? '公开角色' : '私有角色' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="text-26rpx text-[#666]">
            <view class="line-clamp-2 mb-8rpx">
              {{ item.description || '-' }}
            </view>
            <view class="text-24rpx text-[#999]">
              类别：{{ item.category || '-' }} / 模型：{{ item.modelName || item.modelId || '-' }}
            </view>
          </view>
          <view class="mt-20rpx flex justify-end gap-16rpx">
            <wd-button
              v-if="hasAccessByCodes(['ai:chat-role:update'])"
              size="small" type="warning" variant="plain"
              @click="handleEdit(item)"
            >
              编辑
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['ai:chat-role:delete'])"
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
      v-if="hasAccessByCodes(['ai:chat-role:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ChatRoleVO } from '@/api/ai/model/chatRole'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { deleteChatRole, getChatRolePage } from '@/api/ai/model/chatRole'
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
const list = ref<ChatRoleVO[]>([]) // 列表数据
const queryParams = ref<Record<string, any>>({}) // 查询参数
const pagingRef = ref<any>() // 分页组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/model/index')
}

/** 查询角色列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = { ...queryParams.value, pageNo, pageSize }
    const data = await getChatRolePage(params)
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

/** 新增角色 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-ai/model/chatRole/form/index' })
}

/** 编辑角色 */
function handleEdit(item: ChatRoleVO) {
  uni.navigateTo({ url: `/pages-ai/model/chatRole/form/index?id=${item.id}` })
}

/** 删除角色 */
async function handleDelete(item: ChatRoleVO) {
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除角色【${item.name}】吗？` })
  } catch {
    return
  }
  await deleteChatRole(item.id!)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:chat-role:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:chat-role:reload', reload)
})
</script>
