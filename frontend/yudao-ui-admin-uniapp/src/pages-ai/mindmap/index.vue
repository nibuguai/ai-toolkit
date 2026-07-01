<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI 思维导图"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="生成" />
        <wd-tab title="历史" />
      </wd-tabs>
    </view>

    <!-- 生成区域 -->
    <scroll-view v-show="tabIndex === 0" scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <wd-cell-group border>
              <wd-form-item title="主题" title-width="160rpx" prop="prompt">
                <wd-textarea
                  v-model="formData.prompt"
                  placeholder="请输入思维导图主题"
                  :maxlength="1200"
                  show-word-limit
                  clearable
                />
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
          <view class="mt-24rpx flex gap-16rpx">
            <wd-button v-if="!isGenerating" class="flex-1" type="primary" @click="handleSubmit">
              生成导图
            </wd-button>
            <wd-button v-else class="flex-1" type="danger" @click="stopStream">
              停止生成
            </wd-button>
            <wd-button class="flex-1" variant="plain" @click="handleExample">
              示例
            </wd-button>
          </view>
        </view>

        <view class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            导图内容
          </view>
          <view class="min-h-420rpx whitespace-pre-wrap text-28rpx text-[#333] leading-46rpx">
            {{ generatedContent || '生成内容会显示在这里' }}
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 历史列表 -->
    <z-paging
      v-show="tabIndex === 1"
      ref="pagingRef"
      v-model="historyList"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无思维导图记录"
      @query="queryHistory"
    >
      <view class="p-24rpx">
        <view
          v-for="item in historyList"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <view class="text-28rpx text-[#333] font-semibold">
              {{ item.prompt || '未命名导图' }}
            </view>
            <text class="text-22rpx text-[#999]">{{ formatDateTime(item.createTime) }}</text>
          </view>
          <view class="line-clamp-4 text-26rpx text-[#666]">
            {{ item.generatedContent || item.errorMessage || '-' }}
          </view>
          <view class="mt-16rpx flex justify-end">
            <wd-button size="small" type="danger" variant="plain" @click="handleDeleteHistory(item.id!)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MindMapVO } from '@/api/ai/mindmap'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnmounted, reactive, ref } from 'vue'
import { deleteMindMap, generateMindMap, getMindMapPage } from '@/api/ai/mindmap'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { MindMapContentExample } from '@/pages-ai/utils/constants'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const tabIndex = ref(0)
const formRef = ref<FormInstance>() // 表单组件引用
const pagingRef = ref<any>() // 分页组件引用
const historyList = ref<MindMapVO[]>([]) // 历史列表
const generatedContent = ref('') // 生成结果
const isGenerating = ref(false) // 生成状态
const streamController = ref<AbortController>() // 流式请求控制器
const formData = reactive({
  prompt: '',
}) // 生成表单数据
const formSchema = createFormSchema({
  prompt: [{ required: true, message: '请输入思维导图主题' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/index/index')
}

/** 查询历史记录 */
async function queryHistory(pageNo: number, pageSize: number) {
  try {
    const data = await getMindMapPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 提交生成 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  generatedContent.value = ''
  isGenerating.value = true
  streamController.value = new AbortController()
  void generateMindMap({
    data: { prompt: formData.prompt },
    ctrl: streamController.value,
    onMessage: (res) => {
      const data = parseStreamData(res.data)
      if (data !== undefined) {
        generatedContent.value += data
      }
    },
    onError: (error) => {
      console.error('AI 思维导图异常', error)
      toast.error('思维导图生成失败')
      isGenerating.value = false
    },
    onClose: () => {
      isGenerating.value = false
      streamController.value = undefined
      pagingRef.value?.reload()
    },
  })
}

/** 停止生成 */
function stopStream() {
  streamController.value?.abort()
  isGenerating.value = false
}

/** 使用示例 */
function handleExample() {
  generatedContent.value = MindMapContentExample
}

/** 删除历史 */
async function handleDeleteHistory(id: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该思维导图记录吗？' })
  } catch {
    return
  }
  await deleteMindMap(id)
  toast.success('删除成功')
  pagingRef.value?.reload()
}

/** 解析流式消息 */
function parseStreamData(raw: string) {
  try {
    const result = JSON.parse(raw)
    if (result.code !== 0 && result.code !== 200) {
      toast.error(result.msg || result.message || '生成失败')
      stopStream()
      return undefined
    }
    return result.data
  } catch {
    return raw
  }
}

/** 卸载 */
onUnmounted(() => {
  stopStream()
})
</script>
