<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI 绘图"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="我的创作" />
        <wd-tab title="作品广场" />
      </wd-tabs>
    </view>

    <!-- 生成表单 -->
    <view v-show="tabIndex === 0" class="bg-white p-24rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="绘图平台" title-width="170rpx" center>
            <wd-radio-group v-model="formData.platformMode" type="button">
              <wd-radio v-for="item in platformModeOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>

          <wd-form-item
            v-if="isCommonMode"
            title="模型"
            title-width="170rpx"
            prop="modelId"
            is-link
            :value="getWotPickerFormValue(modelOptions, formData.modelId, { labelKey: 'name', valueKey: 'id' })"
            placeholder="请选择模型"
            @click="pickerVisible.model = true"
          />
          <wd-form-item
            v-else-if="isDall3Mode"
            title="模型"
            title-width="170rpx"
            prop="modelKey"
            is-link
            :value="getWotPickerFormValue(Dall3Models, formData.modelKey, { labelKey: 'name', valueKey: 'key' })"
            placeholder="请选择模型"
            @click="pickerVisible.dallModel = true"
          />
          <wd-form-item
            v-else-if="isMidjourneyMode"
            title="模型"
            title-width="170rpx"
            prop="modelKey"
            is-link
            :value="getWotPickerFormValue(MidjourneyModels, formData.modelKey, { labelKey: 'name', valueKey: 'key' })"
            placeholder="请选择模型"
            @click="pickerVisible.mjModel = true"
          />

          <wd-form-item title="提示词" title-width="170rpx" prop="prompt">
            <wd-textarea
              v-model="formData.prompt"
              placeholder="描述你想生成的图片"
              :maxlength="1200"
              show-word-limit
              clearable
            />
          </wd-form-item>

          <template v-if="isCommonMode">
            <wd-form-item
              title="尺寸"
              title-width="170rpx"
              prop="size"
              is-link
              :value="selectedSizeLabel"
              placeholder="请选择尺寸"
              @click="pickerVisible.size = true"
            />
            <wd-form-item title="风格" title-width="170rpx">
              <wd-input v-model="formData.style" clearable placeholder="可选，如 anime、cinematic" />
            </wd-form-item>
          </template>

          <template v-else-if="isDall3Mode">
            <wd-form-item
              title="风格"
              title-width="170rpx"
              is-link
              :value="getWotPickerFormValue(Dall3StyleList, formData.style, { labelKey: 'name', valueKey: 'key' })"
              placeholder="请选择风格"
              @click="pickerVisible.dallStyle = true"
            />
            <wd-form-item
              title="尺寸"
              title-width="170rpx"
              prop="size"
              is-link
              :value="selectedDallSizeLabel"
              placeholder="请选择尺寸"
              @click="pickerVisible.dallSize = true"
            />
          </template>

          <template v-else-if="isMidjourneyMode">
            <wd-form-item
              title="比例"
              title-width="170rpx"
              prop="size"
              is-link
              :value="selectedMjSizeLabel"
              placeholder="请选择比例"
              @click="pickerVisible.mjSize = true"
            />
            <wd-form-item
              title="版本"
              title-width="170rpx"
              is-link
              :value="getWotPickerFormValue(versionOptions, formData.version)"
              placeholder="请选择版本"
              @click="pickerVisible.version = true"
            />
            <wd-form-item title="参考图 URL" title-width="170rpx">
              <wd-input v-model="formData.referImageUrl" clearable placeholder="可选，输入参考图地址" />
            </wd-form-item>
          </template>

          <template v-else>
            <wd-form-item
              title="采样方法"
              title-width="170rpx"
              is-link
              :value="getWotPickerFormValue(StableDiffusionSamplers, formData.sampler, { labelKey: 'name', valueKey: 'key' })"
              placeholder="请选择采样方法"
              @click="pickerVisible.sampler = true"
            />
            <wd-form-item
              title="CLIP"
              title-width="170rpx"
              is-link
              :value="getWotPickerFormValue(StableDiffusionClipGuidancePresets, formData.clipGuidancePreset, { labelKey: 'name', valueKey: 'key' })"
              placeholder="请选择 CLIP"
              @click="pickerVisible.clip = true"
            />
            <wd-form-item
              title="风格"
              title-width="170rpx"
              is-link
              :value="getWotPickerFormValue(StableDiffusionStylePresets, formData.stylePreset, { labelKey: 'name', valueKey: 'key' })"
              placeholder="请选择风格"
              @click="pickerVisible.sdStyle = true"
            />
            <wd-form-item title="宽度" title-width="170rpx">
              <wd-input-number v-model="formData.width" :min="64" :max="2048" />
            </wd-form-item>
            <wd-form-item title="高度" title-width="170rpx">
              <wd-input-number v-model="formData.height" :min="64" :max="2048" />
            </wd-form-item>
            <wd-form-item title="迭代步数" title-width="170rpx">
              <wd-input-number v-model="formData.steps" :min="1" :max="150" />
            </wd-form-item>
            <wd-form-item title="引导系数" title-width="170rpx">
              <wd-input-number v-model="formData.scale" :min="0" :max="30" :step="0.5" />
            </wd-form-item>
            <wd-form-item title="随机因子" title-width="170rpx">
              <wd-input-number v-model="formData.seed" :min="0" :max="999999" />
            </wd-form-item>
          </template>
        </wd-cell-group>
      </wd-form>
      <view class="mt-20rpx flex flex-wrap gap-12rpx">
        <wd-tag
          v-for="word in hotWords"
          :key="word"
          variant="plain"
          @click="formData.prompt = word"
        >
          {{ word }}
        </wd-tag>
      </view>
      <view class="mt-24rpx">
        <wd-button block type="primary" :loading="drawing" @click="handleDraw">
          生成图片
        </wd-button>
      </view>
    </view>

    <!-- 绘图列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无绘图记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <image
            v-if="item.picUrl"
            class="h-420rpx w-full bg-[#f1f5f9]"
            :src="item.picUrl"
            mode="aspectFill"
            @click="handlePreview(item.picUrl)"
          />
          <view v-else class="h-320rpx flex items-center justify-center bg-[#f8fafc] text-26rpx text-[#999]">
            {{ item.errorMessage || '图片生成中' }}
          </view>
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-center justify-between">
              <dict-tag :type="DICT_TYPE.AI_IMAGE_STATUS" :value="item.status" />
              <text class="text-22rpx text-[#999]">{{ formatDateTime(item.createTime) }}</text>
            </view>
            <view class="line-clamp-2 text-28rpx text-[#333]">
              {{ item.prompt || '-' }}
            </view>
            <view class="mt-16rpx text-24rpx text-[#999]">
              {{ item.platform || '-' }} / {{ item.model || '-' }}
            </view>
            <view v-if="item.buttons?.length && tabIndex === 0" class="mt-18rpx flex flex-wrap gap-12rpx">
              <wd-button
                v-for="button in item.buttons"
                :key="button.customId"
                size="small"
                variant="plain"
                :loading="actionLoadingId === `${item.id}-${button.customId}`"
                @click="handleMidjourneyAction(item, button.customId)"
              >
                {{ button.emoji || '' }}{{ button.label || '操作' }}
              </wd-button>
            </view>
            <view class="mt-20rpx flex items-center justify-between">
              <wd-button size="small" variant="plain" @click="handleReuse(item)">
                重新生成
              </wd-button>
              <wd-button v-if="tabIndex === 0" size="small" type="danger" variant="plain" @click="handleDelete(item)">
                删除
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <wd-picker
      v-model:visible="pickerVisible.model"
      :model-value="[formData.modelId]"
      :columns="modelOptions"
      label-key="name"
      value-key="id"
      @confirm="({ value }) => formData.modelId = Number(value[0])"
    />
    <wd-picker
      v-model:visible="pickerVisible.size"
      :model-value="[formData.size]"
      :columns="sizeOptions"
      @confirm="({ value }) => formData.size = String(value[0])"
    />
    <wd-picker
      v-model:visible="pickerVisible.dallModel"
      :model-value="[formData.modelKey]"
      :columns="Dall3Models"
      label-key="name"
      value-key="key"
      @confirm="({ value }) => formData.modelKey = String(value[0])"
    />
    <wd-picker
      v-model:visible="pickerVisible.dallStyle"
      :model-value="[formData.style]"
      :columns="Dall3StyleList"
      label-key="name"
      value-key="key"
      @confirm="({ value }) => formData.style = String(value[0])"
    />
    <wd-picker
      v-model:visible="pickerVisible.dallSize"
      :model-value="[formData.size]"
      :columns="dallSizeOptions"
      @confirm="({ value }) => formData.size = String(value[0])"
    />
    <wd-picker
      v-model:visible="pickerVisible.mjModel"
      :model-value="[formData.modelKey]"
      :columns="MidjourneyModels"
      label-key="name"
      value-key="key"
      @confirm="handleMjModelConfirm"
    />
    <wd-picker
      v-model:visible="pickerVisible.mjSize"
      :model-value="[formData.size]"
      :columns="mjSizeOptions"
      @confirm="({ value }) => formData.size = String(value[0])"
    />
    <wd-picker
      v-model:visible="pickerVisible.version"
      :model-value="[formData.version]"
      :columns="versionOptions"
      @confirm="({ value }) => formData.version = String(value[0])"
    />
    <wd-picker
      v-model:visible="pickerVisible.sampler"
      :model-value="[formData.sampler]"
      :columns="StableDiffusionSamplers"
      label-key="name"
      value-key="key"
      @confirm="({ value }) => formData.sampler = String(value[0])"
    />
    <wd-picker
      v-model:visible="pickerVisible.clip"
      :model-value="[formData.clipGuidancePreset]"
      :columns="StableDiffusionClipGuidancePresets"
      label-key="name"
      value-key="key"
      @confirm="({ value }) => formData.clipGuidancePreset = String(value[0])"
    />
    <wd-picker
      v-model:visible="pickerVisible.sdStyle"
      :model-value="[formData.stylePreset]"
      :columns="StableDiffusionStylePresets"
      label-key="name"
      value-key="key"
      @confirm="({ value }) => formData.stylePreset = String(value[0])"
    />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ImageVO } from '@/api/ai/image'
import type { ModelVO } from '@/api/ai/model/model'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { deleteImageMy, drawImage, getImagePageMy, midjourneyAction, midjourneyImagine } from '@/api/ai/image'
import { getModelSimpleList } from '@/api/ai/model/model'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import {
  AiModelTypeEnum,
  AiPlatformEnum,
  Dall3Models,
  Dall3SizeList,
  Dall3StyleList,
  ImageHotEnglishWords,
  ImageHotWords,
  MidjourneyModels,
  MidjourneySizeList,
  MidjourneyVersions,
  NijiVersionList,
  OtherPlatformList,
  StableDiffusionClipGuidancePresets,
  StableDiffusionSamplers,
  StableDiffusionStylePresets,
} from '@/pages-ai/utils/constants'

type ImagePlatformMode = 'common' | 'dall3' | 'midjourney' | 'stableDiffusion'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const tabIndex = ref(0)
const list = ref<ImageVO[]>([]) // 绘图列表
const models = ref<ModelVO[]>([]) // 图片模型列表
const pagingRef = ref<any>() // 分页组件引用
const formRef = ref<FormInstance>() // 表单组件引用
const drawing = ref(false) // 图片生成状态
const actionLoadingId = ref('') // MJ 操作加载标识
const pickerVisible = reactive({
  model: false,
  size: false,
  dallModel: false,
  dallStyle: false,
  dallSize: false,
  mjModel: false,
  mjSize: false,
  version: false,
  sampler: false,
  clip: false,
  sdStyle: false,
}) // 选择弹窗显示状态
const formData = reactive({
  platformMode: 'common' as ImagePlatformMode,
  modelId: undefined as number | undefined,
  modelKey: '',
  prompt: '',
  size: '512x512',
  style: '',
  version: '6.0',
  referImageUrl: '',
  width: 512,
  height: 512,
  sampler: 'DDIM',
  steps: 20,
  seed: 42,
  scale: 7.5,
  clipGuidancePreset: 'NONE',
  stylePreset: '3d-model',
}) // 绘图表单数据
const platformModeOptions = [
  { label: '通用', value: 'common' },
  { label: 'DALL·E', value: 'dall3' },
  { label: 'MJ', value: 'midjourney' },
  { label: 'SD', value: 'stableDiffusion' },
]
const sizeOptions = [
  { label: '512 x 512', value: '512x512' },
  { label: '768 x 768', value: '768x768' },
  { label: '1024 x 1024', value: '1024x1024' },
  { label: '1024 x 768', value: '1024x768' },
  { label: '768 x 1024', value: '768x1024' },
]
const dallSizeOptions = Dall3SizeList.map(item => ({ label: `${item.name} ${item.key}`, value: item.key }))
const mjSizeOptions = MidjourneySizeList.map(item => ({ label: item.key, value: item.key }))
const isCommonMode = computed(() => formData.platformMode === 'common')
const isDall3Mode = computed(() => formData.platformMode === 'dall3')
const isMidjourneyMode = computed(() => formData.platformMode === 'midjourney')
const commonModelOptions = computed(() => {
  const commonPlatforms = OtherPlatformList.map(platform => platform.key)
  const options = models.value.filter(item => ![AiPlatformEnum.OPENAI, AiPlatformEnum.MIDJOURNEY, AiPlatformEnum.STABLE_DIFFUSION].includes(item.platform as any)
    || commonPlatforms.includes(item.platform || ''),
  )
  return options.length > 0 ? options : models.value
})
const modelOptions = computed(() => isCommonMode.value ? commonModelOptions.value : models.value)
const hotWords = computed(() => formData.platformMode === 'stableDiffusion' ? ImageHotEnglishWords : ImageHotWords)
const versionOptions = computed(() => formData.modelKey === 'niji' ? NijiVersionList : MidjourneyVersions)
const selectedSizeLabel = computed(() => sizeOptions.find(item => item.value === formData.size)?.label || formData.size)
const selectedDallSizeLabel = computed(() => dallSizeOptions.find(item => item.value === formData.size)?.label || formData.size)
const selectedMjSizeLabel = computed(() => mjSizeOptions.find(item => item.value === formData.size)?.label || formData.size)
const formSchema = createFormSchema(() => ({
  modelId: [{ required: () => isCommonMode.value, message: '请选择模型' }],
  modelKey: [{ required: () => isDall3Mode.value || isMidjourneyMode.value, message: '请选择模型' }],
  prompt: [{ required: true, message: '请输入提示词' }],
  size: [{ required: () => formData.platformMode !== 'stableDiffusion', message: '请选择尺寸' }],
}))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/index/index')
}

/** 查询绘图列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = tabIndex.value === 1 ? { pageNo, pageSize, publicStatus: true } : { pageNo, pageSize }
    const data = await getImagePageMy(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  pagingRef.value?.reload()
}

/** 平台切换 */
function handlePlatformChange() {
  if (isCommonMode.value) {
    formData.size = '512x512'
    formData.style = ''
    formData.modelKey = ''
    formData.modelId = modelOptions.value[0]?.id
  } else if (isDall3Mode.value) {
    formData.modelKey = 'dall-e-3'
    formData.size = '1024x1024'
    formData.style = 'vivid'
  } else if (isMidjourneyMode.value) {
    formData.modelKey = 'midjourney'
    formData.size = '1:1'
    formData.version = '6.0'
  } else {
    formData.modelKey = 'stable-diffusion-v1-6'
    formData.width = 512
    formData.height = 512
    formData.sampler = 'DDIM'
    formData.clipGuidancePreset = 'NONE'
    formData.stylePreset = '3d-model'
  }
}

/** 选择 MJ 模型 */
function handleMjModelConfirm({ value }: { value: Array<number | string> }) {
  formData.modelKey = String(value[0])
  formData.version = versionOptions.value[0]?.value || ''
}

/** 生成图片 */
async function handleDraw() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  const requestData = buildDrawRequest()
  if (!requestData) {
    return
  }
  drawing.value = true
  try {
    if (isMidjourneyMode.value) {
      await midjourneyImagine(requestData as any)
    } else {
      await drawImage(requestData as any)
    }
    toast.success('已提交生成任务')
    pagingRef.value?.reload()
  } finally {
    drawing.value = false
  }
}

/** 构建绘图请求 */
function buildDrawRequest() {
  if (isCommonMode.value) {
    const [width, height] = formData.size.split('x')
    return {
      prompt: formData.prompt,
      modelId: formData.modelId,
      style: formData.style,
      width,
      height,
      options: {},
    }
  }
  if (isDall3Mode.value) {
    const model = findModel(AiPlatformEnum.OPENAI, formData.modelKey)
    const imageSize = Dall3SizeList.find(item => item.key === formData.size)
    if (!model || !imageSize) {
      toast.warning('该 DALL·E 模型不可用，请先配置模型')
      return undefined
    }
    return {
      prompt: formData.prompt,
      modelId: model.id,
      style: formData.style,
      width: imageSize.width,
      height: imageSize.height,
      options: { style: formData.style },
    }
  }
  if (isMidjourneyMode.value) {
    const model = findModel(AiPlatformEnum.MIDJOURNEY, formData.modelKey)
    const imageSize = MidjourneySizeList.find(item => item.key === formData.size)
    if (!model || !imageSize) {
      toast.warning('该 Midjourney 模型不可用，请先配置模型')
      return undefined
    }
    return {
      prompt: formData.prompt,
      modelId: model.id,
      width: imageSize.width,
      height: imageSize.height,
      version: formData.version,
      referImageUrl: formData.referImageUrl,
    }
  }
  const model = findModel(AiPlatformEnum.STABLE_DIFFUSION, formData.modelKey)
  if (!model) {
    toast.warning('该 Stable Diffusion 模型不可用，请先配置模型')
    return undefined
  }
  return {
    prompt: formData.prompt,
    modelId: model.id,
    width: String(formData.width),
    height: String(formData.height),
    options: {
      seed: formData.seed,
      steps: formData.steps,
      scale: formData.scale,
      sampler: formData.sampler,
      clipGuidancePreset: formData.clipGuidancePreset,
      stylePreset: formData.stylePreset,
    },
  }
}

/** 查找平台模型 */
function findModel(platform: string, model: string) {
  return models.value.find(item => item.platform === platform && item.model === model)
}

/** 预览图片 */
function handlePreview(url?: string) {
  if (!url) {
    return
  }
  uni.previewImage({ urls: [url] })
}

/** 复用绘图参数 */
function handleReuse(item: ImageVO) {
  formData.prompt = item.prompt || ''
  const platform = item.platform || ''
  if (platform === AiPlatformEnum.OPENAI) {
    formData.platformMode = 'dall3'
    formData.modelKey = item.model || 'dall-e-3'
    formData.size = `${item.width}x${item.height}`
    formData.style = item.options?.style || item.options?.stylePreset || 'vivid'
  } else if (platform === AiPlatformEnum.MIDJOURNEY) {
    formData.platformMode = 'midjourney'
    formData.modelKey = item.options?.model || item.model || 'midjourney'
    formData.size = `${item.width}:${item.height}`
    formData.version = item.options?.version || '6.0'
    formData.referImageUrl = item.options?.referImageUrl || ''
  } else if (platform === AiPlatformEnum.STABLE_DIFFUSION) {
    formData.platformMode = 'stableDiffusion'
    formData.width = Number(item.width || 512)
    formData.height = Number(item.height || 512)
    formData.seed = Number(item.options?.seed ?? 42)
    formData.steps = Number(item.options?.steps ?? 20)
    formData.scale = Number(item.options?.scale ?? 7.5)
    formData.sampler = item.options?.sampler || 'DDIM'
    formData.clipGuidancePreset = item.options?.clipGuidancePreset || 'NONE'
    formData.stylePreset = item.options?.stylePreset || '3d-model'
  } else {
    formData.platformMode = 'common'
    formData.modelId = models.value.find(model => model.platform === platform && model.model === item.model)?.id || formData.modelId
    formData.size = `${item.width}x${item.height}`
    formData.style = item.options?.style || item.options?.stylePreset || ''
  }
  tabIndex.value = 0
  uni.pageScrollTo?.({ scrollTop: 0, duration: 200 })
}

/** Midjourney 二次操作 */
async function handleMidjourneyAction(item: ImageVO, customId: string) {
  if (!item.id) {
    return
  }
  actionLoadingId.value = `${item.id}-${customId}`
  try {
    await midjourneyAction({ id: item.id, customId })
    toast.success('已提交操作')
    pagingRef.value?.reload()
  } finally {
    actionLoadingId.value = ''
  }
}

/** 删除绘图记录 */
async function handleDelete(item: ImageVO) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该绘图记录吗？' })
  } catch {
    return
  }
  await deleteImageMy(item.id)
  toast.success('删除成功')
  pagingRef.value?.reload()
}

/** 初始化 */
onMounted(async () => {
  try {
    models.value = await getModelSimpleList(AiModelTypeEnum.IMAGE)
    if (modelOptions.value.length > 0) {
      formData.modelId = modelOptions.value[0].id
    }
  } catch {
    models.value = []
  }
})

/** 监听平台变化 */
watch(() => formData.platformMode, handlePlatformChange)
</script>
