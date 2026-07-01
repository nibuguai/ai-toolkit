<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border title="请求配置">
          <template v-if="formData.type === AutoReplyType.Message">
            <wd-form-item
              title="消息类型"
              title-width="220rpx"
              prop="requestMessageType"
              is-link
              :value="getWotPickerFormValue(requestMessageOptions, formData.requestMessageType)"
              placeholder="请选择消息类型"
              @click="pickerVisible.requestMessageType = true"
            />
            <wd-picker
              v-model:visible="pickerVisible.requestMessageType"
              :model-value="[formData.requestMessageType]"
              :columns="requestMessageOptions"
              @confirm="({ value }) => formData.requestMessageType = value[0]"
            />
          </template>
          <template v-if="formData.type === AutoReplyType.Keyword">
            <wd-form-item title="关键词" title-width="220rpx" prop="requestKeyword">
              <wd-input v-model="formData.requestKeyword" clearable placeholder="请输入关键词" />
            </wd-form-item>
            <wd-form-item
              title="匹配类型"
              title-width="220rpx"
              prop="requestMatch"
              is-link
              :value="getWotPickerFormValue(getIntDictOptions(DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH), formData.requestMatch)"
              placeholder="请选择匹配类型"
              @click="pickerVisible.requestMatch = true"
            />
            <wd-picker
              v-model:visible="pickerVisible.requestMatch"
              :model-value="[formData.requestMatch]"
              :columns="getIntDictOptions(DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH)"
              @confirm="({ value }) => formData.requestMatch = Number(value[0])"
            />
          </template>
        </wd-cell-group>

        <wd-cell-group border title="回复配置">
          <wd-form-item
            title="回复类型"
            title-width="220rpx"
            prop="responseMessageType"
            is-link
            :value="getWotPickerFormValue(responseMessageOptions, formData.responseMessageType)"
            placeholder="请选择回复类型"
            @click="pickerVisible.responseMessageType = true"
          />
          <wd-picker
            v-model:visible="pickerVisible.responseMessageType"
            :model-value="[formData.responseMessageType]"
            :columns="responseMessageOptions"
            @confirm="({ value }) => formData.responseMessageType = value[0]"
          />

          <!-- 文本 -->
          <wd-form-item v-if="formData.responseMessageType === 'text'" title="回复内容" title-width="220rpx" prop="responseContent">
            <wd-textarea v-model="formData.responseContent" clearable placeholder="请输入回复内容" />
          </wd-form-item>

          <!-- 图片：素材库选择 / 本地上传 + 预览 -->
          <template v-else-if="formData.responseMessageType === 'image'">
            <wd-cell title="回复素材">
              <view class="flex gap-16rpx py-8rpx">
                <wd-button size="small" plain @click="materialPickerVisible = true">
                  素材库选择
                </wd-button>
                <wd-button size="small" plain :loading="uploading" @click="handleUploadMaterial('image')">
                  本地上传
                </wd-button>
              </view>
            </wd-cell>
            <view v-if="formData.responseMediaUrl" class="px-24rpx pb-16rpx">
              <wd-img :src="formData.responseMediaUrl" width="200rpx" height="200rpx" mode="aspectFill" radius="8rpx" />
            </view>
          </template>

          <!-- 语音：素材库选择 / 本地上传 + 预览 -->
          <template v-else-if="formData.responseMessageType === 'voice'">
            <wd-cell title="回复素材">
              <view class="flex gap-16rpx py-8rpx">
                <wd-button size="small" plain @click="materialPickerVisible = true">
                  素材库选择
                </wd-button>
                <wd-button size="small" plain :loading="uploading" @click="handleUploadMaterial('voice')">
                  本地上传
                </wd-button>
              </view>
            </wd-cell>
            <view v-if="formData.responseMediaUrl" class="px-24rpx pb-16rpx">
              <MediaPreview type="voice" :url="formData.responseMediaUrl" />
            </view>
          </template>

          <!-- 视频：标题 / 描述 + 素材库选择 / 本地上传 + 预览 -->
          <template v-else-if="formData.responseMessageType === 'video'">
            <wd-form-item title="标题" title-width="220rpx" prop="responseTitle">
              <wd-input v-model="formData.responseTitle" clearable placeholder="请输入标题" />
            </wd-form-item>
            <wd-form-item title="描述" title-width="220rpx" prop="responseDescription">
              <wd-textarea v-model="formData.responseDescription" clearable placeholder="请输入描述" />
            </wd-form-item>
            <wd-cell title="回复素材">
              <view class="flex gap-16rpx py-8rpx">
                <wd-button size="small" plain @click="materialPickerVisible = true">
                  素材库选择
                </wd-button>
                <wd-button size="small" plain :loading="uploading" @click="handleUploadMaterial('video')">
                  本地上传
                </wd-button>
              </view>
            </wd-cell>
            <view v-if="formData.responseMediaUrl" class="px-24rpx pb-16rpx">
              <MediaPreview type="video" :url="formData.responseMediaUrl" />
            </view>
          </template>

          <!-- 图文：素材库选择 + 卡片预览 -->
          <template v-else-if="formData.responseMessageType === 'news'">
            <wd-cell title="回复素材">
              <view class="flex gap-16rpx py-8rpx">
                <wd-button size="small" plain @click="materialPickerVisible = true">
                  选择图文
                </wd-button>
                <wd-button
                  v-if="formData.responseArticles?.length"
                  size="small" plain type="error"
                  @click="formData.responseArticles = []"
                >
                  清空
                </wd-button>
              </view>
            </wd-cell>
            <view v-if="formData.responseArticles?.length" class="px-24rpx pb-16rpx">
              <NewsCard :articles="formData.responseArticles" />
            </view>
          </template>

          <!-- 音乐：缩略图（素材库 / 本地上传）+ 标题 / 描述 + 音乐链接 -->
          <template v-else-if="formData.responseMessageType === 'music'">
            <wd-cell title="缩略图">
              <view class="flex gap-16rpx py-8rpx">
                <wd-button size="small" plain @click="materialPickerVisible = true">
                  素材库选择
                </wd-button>
                <wd-button size="small" plain :loading="uploading" @click="handleUploadMaterial('thumb')">
                  本地上传
                </wd-button>
              </view>
            </wd-cell>
            <view v-if="formData.responseThumbMediaUrl" class="px-24rpx pb-16rpx">
              <wd-img :src="formData.responseThumbMediaUrl" width="160rpx" height="160rpx" mode="aspectFill" radius="8rpx" />
            </view>
            <wd-form-item title="标题" title-width="220rpx" prop="responseTitle">
              <wd-input v-model="formData.responseTitle" clearable placeholder="请输入标题" />
            </wd-form-item>
            <wd-form-item title="描述" title-width="220rpx" prop="responseDescription">
              <wd-textarea v-model="formData.responseDescription" clearable placeholder="请输入描述" />
            </wd-form-item>
            <wd-form-item title="音乐链接" title-width="220rpx" prop="responseMusicUrl">
              <wd-input v-model="formData.responseMusicUrl" clearable placeholder="请输入音乐链接" />
            </wd-form-item>
            <wd-form-item title="高质量链接" title-width="220rpx" prop="responseHqMusicUrl">
              <wd-input v-model="formData.responseHqMusicUrl" clearable placeholder="请输入高质量音乐链接" />
            </wd-form-item>
          </template>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 素材选择 -->
    <MaterialPicker
      v-model:visible="materialPickerVisible"
      :account-id="formData.accountId"
      :type="materialPickerType"
      @select="handleMaterialSelect"
    />

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AutoReply } from '@/api/mp/autoReply'
import type { MaterialUploadType } from '@/pages-mp/utils/upload'
import { onLoad } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, ref, watch } from 'vue'
import { AutoReplyType, createAutoReply, getAutoReply, updateAutoReply } from '@/api/mp/autoReply'
import { getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import MediaPreview from '@/pages-mp/components/media-preview.vue'
import NewsCard from '@/pages-mp/components/news-card.vue'
import MaterialPicker from '@/pages-mp/material/components/material-picker.vue'
import { useMaterialUpload } from '@/pages-mp/utils/upload'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MpAutoReplyRequestMatchEnum } from '@/utils/constants'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import { getMpRouteNumber, useMpRouteParams } from '../../utils/route'

const props = defineProps<{
  id?: number | any
  accountId?: number | any
  type?: number | any
}>()
const { routeParams, syncRouteParams } = useMpRouteParams(props)

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const URL_PATTERN = /^https?:\/\/.+/i // 音乐链接格式校验
const requestMessageTypes = ['text', 'image', 'voice', 'video', 'shortvideo', 'location', 'link']
const responseMessageTypes = ['text', 'image', 'voice', 'video', 'news', 'music']
const toast = useToast()
const { uploading, chooseAndUpload } = useMaterialUpload()
const id = computed(() => getMpRouteNumber(routeParams.id))
const accountId = computed(() => getMpRouteNumber(routeParams.accountId))
const replyType = computed(() => getMpRouteNumber(routeParams.type) || AutoReplyType.Keyword)
const getTitle = computed(() => id.value ? '编辑自动回复' : '新增自动回复')
const formLoading = ref(false) // 表单提交状态
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const materialPickerVisible = ref(false) // 素材选择弹窗
const formData = ref<AutoReply>({
  id: undefined,
  accountId: accountId.value || 0,
  type: replyType.value,
  requestKeyword: undefined,
  requestMatch: replyType.value === AutoReplyType.Keyword ? MpAutoReplyRequestMatchEnum.ALL : undefined,
  requestMessageType: undefined,
  responseMessageType: 'text',
  responseContent: '',
  responseArticles: [],
}) // 表单数据
const formSchema = createFormSchema({
  requestKeyword: [{ required: () => formData.value.type === AutoReplyType.Keyword, message: '关键词不能为空' }],
  requestMatch: [{ required: () => formData.value.type === AutoReplyType.Keyword, message: '匹配类型不能为空' }],
  requestMessageType: [{ required: () => formData.value.type === AutoReplyType.Message, message: '消息类型不能为空' }],
  responseMessageType: [{ required: true, message: '回复类型不能为空' }],
  responseContent: [{ required: () => formData.value.responseMessageType === 'text', message: '回复内容不能为空' }],
  responseMediaId: [{ required: () => ['image', 'voice', 'video'].includes(String(formData.value.responseMessageType)), message: '请选择或上传素材' }],
  responseTitle: [{ required: () => formData.value.responseMessageType === 'video', message: '视频标题不能为空' }],
  responseDescription: [{ required: () => formData.value.responseMessageType === 'video', message: '视频描述不能为空' }],
  responseThumbMediaId: [{ required: () => formData.value.responseMessageType === 'music', message: '请选择音乐缩略图' }],
  responseMusicUrl: [
    { required: () => formData.value.responseMessageType === 'music', message: '音乐链接不能为空' },
    { pattern: URL_PATTERN, message: '音乐链接格式不正确' },
  ],
  responseHqMusicUrl: [
    { required: () => formData.value.responseMessageType === 'music', message: '高质量音乐链接不能为空' },
    { pattern: URL_PATTERN, message: '高质量音乐链接格式不正确' },
  ],
  responseArticles: [{ required: () => formData.value.responseMessageType === 'news', message: '请选择图文素材' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

const requestMessageOptions = computed(() => getStrDictOptions(DICT_TYPE.MP_MESSAGE_TYPE).filter(item => requestMessageTypes.includes(String(item.value))))
const responseMessageOptions = computed(() => getStrDictOptions(DICT_TYPE.MP_MESSAGE_TYPE).filter(item => responseMessageTypes.includes(String(item.value))))
// 音乐选图片素材作为缩略图，其余按自身类型选择
const materialPickerType = computed<'image' | 'voice' | 'video' | 'news'>(() => {
  const type = formData.value.responseMessageType
  return type === 'voice' || type === 'video' || type === 'news' ? type : 'image'
})

const ready = ref(false) // 详情回填完成后才允许换类型清字段，避免回填触发清空

/** 切换回复类型时清空与新类型无关的 response* 字段 */
watch(() => formData.value.responseMessageType, () => {
  if (!ready.value) {
    return
  }
  formData.value.responseContent = ''
  formData.value.responseMediaId = undefined
  formData.value.responseMediaUrl = undefined
  formData.value.responseTitle = undefined
  formData.value.responseDescription = undefined
  formData.value.responseThumbMediaId = undefined
  formData.value.responseThumbMediaUrl = undefined
  formData.value.responseMusicUrl = undefined
  formData.value.responseHqMusicUrl = undefined
  formData.value.responseArticles = []
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/auto-reply/index')
}

/** 加载详情 */
async function getDetail() {
  if (!id.value) {
    return
  }
  formData.value = await getAutoReply(id.value)
  formData.value.responseArticles = formData.value.responseArticles || []
}

/** 本地上传素材并回填 */
async function handleUploadMaterial(type: MaterialUploadType) {
  const material = await chooseAndUpload(type, { accountId: formData.value.accountId!, permanent: false })
  if (!material) {
    return
  }
  applyMaterial(type === 'thumb' ? 'music' : formData.value.responseMessageType, material)
  toast.success('上传成功')
}

/** 选择素材 */
function handleMaterialSelect(item: any) {
  applyMaterial(formData.value.responseMessageType, item)
}

/** 把素材回填到对应回复字段（选择 / 上传共用） */
function applyMaterial(type: string | undefined, item: any) {
  if (type === 'news') {
    formData.value.responseArticles = normalizeArticles(getNewsArticles(item))
    return
  }
  // 音乐：素材作为缩略图
  if (type === 'music') {
    formData.value.responseThumbMediaId = item.mediaId || ''
    formData.value.responseThumbMediaUrl = item.url || ''
    return
  }
  // 图片 / 语音 / 视频：媒体素材
  formData.value.responseMediaId = item.mediaId || ''
  formData.value.responseMediaUrl = item.url || ''
  if (type === 'video') {
    formData.value.responseTitle = formData.value.responseTitle || item.title || item.name || ''
    formData.value.responseDescription = formData.value.responseDescription || item.introduction || item.description || ''
  }
}

/** 取素材图文列表（兼容草稿 / 已发布结构） */
function getNewsArticles(item: any) {
  return item.content?.newsItem || item.articles || []
}

/** 规整图文字段，满足后端 responseArticles 必填（digest→description、thumbUrl→picUrl） */
function normalizeArticles(articles: any[]) {
  return (articles || []).map(article => ({
    ...article,
    title: article.title || '',
    description: article.description || article.digest || '',
    picUrl: article.picUrl || article.thumbUrl || article.thumbMediaUrl || '',
    url: article.url || article.contentSourceUrl || '',
  }))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  const data: AutoReply = { ...formData.value }
  data.id = id.value || data.id
  data.accountId = data.accountId || accountId.value || 0
  data.type = data.type || replyType.value

  formLoading.value = true
  try {
    if (id.value) {
      await updateAutoReply(data)
      toast.success('修改成功')
    } else {
      await createAutoReply(data)
      toast.success('新增成功')
    }
    uni.$emit('mp:auto-reply:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onLoad(async (query) => {
  syncRouteParams(query)
  if (!id.value) {
    formData.value.accountId = accountId.value || 0
    formData.value.type = replyType.value
    formData.value.requestMatch = replyType.value === AutoReplyType.Keyword ? MpAutoReplyRequestMatchEnum.ALL : undefined
  }
  await getDetail()
  // 等回填触发的 watch 跑完再放开清字段
  await nextTick()
  ready.value = true
})
</script>
