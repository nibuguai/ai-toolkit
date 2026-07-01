<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI 生成记录"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="绘图" />
        <wd-tab title="音乐" />
        <wd-tab title="写作" />
        <wd-tab title="导图" />
        <wd-tab title="对话" />
        <wd-tab title="消息" />
      </wd-tabs>
    </view>

    <!-- 搜索入口 -->
    <view @click="searchVisible = true">
      <wd-search :placeholder="searchPlaceholder" hide-cancel disabled />
    </view>

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
      empty-view-text="暂无 AI 生成记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <image
            v-if="activeTab === 'image' && item.picUrl"
            class="h-420rpx w-full bg-[#f1f5f9]"
            :src="item.picUrl"
            mode="aspectFill"
            @click="handlePreview(item.picUrl)"
          />
          <image
            v-else-if="activeTab === 'music' && item.imageUrl"
            class="h-320rpx w-full bg-[#f1f5f9]"
            :src="item.imageUrl"
            mode="aspectFill"
          />

          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ getItemTitle(item) }}
                </view>
                <view class="mt-8rpx text-22rpx text-[#999]">
                  {{ formatDateTime(item.createTime) }}
                </view>
              </view>
              <dict-tag v-if="activeTab === 'image'" :type="DICT_TYPE.AI_IMAGE_STATUS" :value="item.status" />
              <dict-tag v-else-if="activeTab === 'music'" :type="DICT_TYPE.AI_MUSIC_STATUS" :value="item.status" />
              <dict-tag v-else-if="activeTab === 'write'" :type="DICT_TYPE.AI_WRITE_TYPE" :value="item.type" />
            </view>

            <view v-if="activeTab === 'image'" class="text-26rpx text-[#666]">
              <view class="line-clamp-3">
                {{ item.prompt || item.errorMessage || '-' }}
              </view>
              <view class="mt-12rpx text-24rpx text-[#999]">
                {{ item.platform || '-' }} / {{ item.model || '-' }}
              </view>
            </view>
            <view v-else-if="activeTab === 'music'" class="text-26rpx text-[#666]">
              <view class="line-clamp-2">
                {{ item.prompt || item.gptDescriptionPrompt || '-' }}
              </view>
              <view v-if="item.audioUrl" class="mt-16rpx">
                <wd-button size="small" variant="plain" @click="handleCopyUrl(item.audioUrl)">
                  复制音频地址
                </wd-button>
              </view>
            </view>
            <view v-else-if="activeTab === 'write'" class="text-26rpx text-[#666]">
              <view class="line-clamp-2">
                {{ item.prompt || '-' }}
              </view>
              <view class="line-clamp-4 mt-12rpx text-24rpx text-[#999]">
                {{ item.generatedContent || item.errorMessage || '-' }}
              </view>
            </view>
            <view v-else class="text-26rpx text-[#666]">
              <template v-if="activeTab === 'mindmap'">
                <view class="line-clamp-2">
                  {{ item.prompt || '-' }}
                </view>
                <view class="line-clamp-4 mt-12rpx text-24rpx text-[#999]">
                  {{ item.generatedContent || item.errorMessage || '-' }}
                </view>
              </template>
              <template v-else-if="activeTab === 'conversation'">
                <view class="mb-8rpx">
                  对话编号：{{ item.id || '-' }} / 消息数：{{ item.messageCount ?? '-' }}
                </view>
                <view class="text-24rpx text-[#999]">
                  用户：{{ item.userId || '-' }} / 模型：{{ item.model || '-' }}
                </view>
              </template>
              <template v-else-if="activeTab === 'message'">
                <view class="mb-8rpx">
                  对话编号：{{ item.conversationId || '-' }} / 类型：{{ item.type || '-' }}
                </view>
                <view class="line-clamp-4 text-24rpx text-[#666]">
                  {{ item.content || '-' }}
                </view>
                <view class="mt-12rpx text-24rpx text-[#999]">
                  用户：{{ item.userId || '-' }} / Token：{{ item.tokens ?? '-' }}
                </view>
              </template>
            </view>
            <view class="mt-20rpx flex items-center justify-between">
              <view v-if="canUpdate && (activeTab === 'image' || activeTab === 'music')" class="flex items-center gap-12rpx text-24rpx text-[#666]">
                <text>公开</text>
                <wd-switch
                  v-model="item.publicStatus"
                  :disabled="activeTab === 'image' && item.status !== AiImageStatusEnum.SUCCESS"
                  @change="handlePublicChange(item)"
                />
              </view>
              <view v-else />
              <wd-button v-if="canDelete" size="small" type="danger" variant="plain" @click="handleDelete(item)">
                删除
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 搜索弹窗 -->
    <wd-popup
      v-model="searchVisible"
      position="top"
      :custom-style="getTopPopupStyle()"
      :modal-style="getTopPopupModalStyle()"
    >
      <view class="yd-search-form-container">
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">
            关键字
          </view>
          <wd-input v-model="searchKeyword" :placeholder="searchInputPlaceholder" clearable />
        </view>
        <view class="yd-search-form-actions">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">
            搜索
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteChatConversationByAdmin, getChatConversationPage } from '@/api/ai/chat/conversation'
import { deleteChatMessageByAdmin, getChatMessagePage } from '@/api/ai/chat/message'
import { deleteImage, getImagePage, updateImage } from '@/api/ai/image'
import { deleteMindMap, getMindMapPage } from '@/api/ai/mindmap'
import { deleteMusic, getMusicPage, updateMusic } from '@/api/ai/music'
import { deleteWrite, getWritePage } from '@/api/ai/write'
import { useAccess } from '@/hooks/useAccess'
import { getTopPopupModalStyle, getTopPopupStyle, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { AiImageStatusEnum } from '@/pages-ai/utils/constants'

type ContentTab = 'image' | 'music' | 'write' | 'mindmap' | 'conversation' | 'message'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const tabs: ContentTab[] = ['image', 'music', 'write', 'mindmap', 'conversation', 'message']
const tabIndex = ref(0)
const activeTab = computed(() => tabs[tabIndex.value])
const canDelete = computed(() => { // 当前 tab 的删除权限
  const codes: Record<ContentTab, string> = {
    image: 'ai:image:delete',
    music: 'ai:music:delete',
    write: 'ai:write:delete',
    mindmap: 'ai:mind-map:delete',
    conversation: 'ai:chat-conversation:delete',
    message: 'ai:chat-message:delete',
  }
  return hasAccessByCodes([codes[activeTab.value]])
})
const canUpdate = computed(() => { // 当前 tab 的改公开权限
  if (activeTab.value === 'image') {
    return hasAccessByCodes(['ai:image:update'])
  }
  if (activeTab.value === 'music') {
    return hasAccessByCodes(['ai:music:update'])
  }
  return false
})
const list = ref<any[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const searchVisible = ref(false) // 搜索弹窗显示状态
const searchKeyword = ref('') // 搜索关键字
const searchPlaceholder = computed(() => searchKeyword.value ? `关键字:${searchKeyword.value}` : `搜索${getTabName(activeTab.value)}`)
const searchInputPlaceholder = computed(() => {
  if (activeTab.value === 'music') {
    return '请输入音乐标题'
  }
  if (activeTab.value === 'conversation') {
    return '请输入对话标题'
  }
  if (activeTab.value === 'message') {
    return '请输入对话编号'
  }
  return '请输入提示词关键字'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/index/index')
}

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  queryParams.value = {}
  searchKeyword.value = ''
  pagingRef.value?.reload()
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = { ...queryParams.value, pageNo, pageSize }
    const data = await getPageApi(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleSearch() {
  const fieldMap: Record<ContentTab, string> = {
    image: 'prompt',
    music: 'title',
    write: 'prompt',
    mindmap: 'prompt',
    conversation: 'title',
    message: 'conversationId',
  }
  const field = fieldMap[activeTab.value]
  queryParams.value = searchKeyword.value ? { [field]: searchKeyword.value } : {}
  searchVisible.value = false
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  searchKeyword.value = ''
  queryParams.value = {}
  searchVisible.value = false
  pagingRef.value?.reload()
}

/** 切换公开状态 */
async function handlePublicChange(item: Record<string, any>) {
  try {
    if (activeTab.value === 'image') {
      await updateImage({ id: item.id, publicStatus: item.publicStatus })
    } else if (activeTab.value === 'music') {
      await updateMusic({ id: item.id, publicStatus: item.publicStatus })
    }
    toast.success('更新成功')
  } catch {
    item.publicStatus = !item.publicStatus // 更新失败回滚开关
  }
}

/** 删除记录 */
async function handleDelete(item: Record<string, any>) {
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除该${getTabName(activeTab.value)}记录吗？` })
  } catch {
    return
  }
  await deleteApi(item.id)
  toast.success('删除成功')
  pagingRef.value?.reload()
}

/** 预览图片 */
function handlePreview(url?: string) {
  if (!url) {
    return
  }
  uni.previewImage({ urls: [url] })
}

/** 复制资源地址 */
function handleCopyUrl(url?: string) {
  if (!url) {
    return
  }
  uni.setClipboardData({
    data: url,
    success: () => toast.success('已复制地址'),
  })
}

/** 获取列表接口 */
function getPageApi(params: Record<string, any>) {
  if (activeTab.value === 'image') {
    return getImagePage(params as any)
  }
  if (activeTab.value === 'music') {
    return getMusicPage(params as any)
  }
  if (activeTab.value === 'write') {
    return getWritePage(params as any)
  }
  if (activeTab.value === 'mindmap') {
    return getMindMapPage(params as any)
  }
  if (activeTab.value === 'conversation') {
    return getChatConversationPage(params as any)
  }
  return getChatMessagePage(params as any)
}

/** 删除接口 */
function deleteApi(id: number) {
  if (activeTab.value === 'image') {
    return deleteImage(id)
  }
  if (activeTab.value === 'music') {
    return deleteMusic(id)
  }
  if (activeTab.value === 'write') {
    return deleteWrite(id)
  }
  if (activeTab.value === 'mindmap') {
    return deleteMindMap(id)
  }
  if (activeTab.value === 'conversation') {
    return deleteChatConversationByAdmin(id)
  }
  return deleteChatMessageByAdmin(id)
}

/** 获取 Tab 名称 */
function getTabName(tab: ContentTab) {
  const names: Record<ContentTab, string> = {
    image: '绘图',
    music: '音乐',
    write: '写作',
    mindmap: '思维导图',
    conversation: '聊天对话',
    message: '聊天消息',
  }
  return names[tab]
}

/** 获取卡片标题 */
function getItemTitle(item: Record<string, any>) {
  if (activeTab.value === 'music') {
    return item.title || '未命名音乐'
  }
  if (activeTab.value === 'mindmap') {
    return item.prompt || '未命名导图'
  }
  if (activeTab.value === 'conversation') {
    return item.title || `对话 #${item.id}`
  }
  if (activeTab.value === 'message') {
    return `消息 #${item.id}`
  }
  return item.prompt || `#${item.id}`
}
</script>
