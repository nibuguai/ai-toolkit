<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="添加虚拟评论"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item
            title="商品"
            title-width="220rpx"
            prop="spuId"
            is-link
            :value="getOptionText(spuOptions, formData.spuId)"
            placeholder="请选择商品"
            @click="spuPickerVisible = true"
          />
          <wd-form-item
            v-if="formData.spuId"
            title="商品规格"
            title-width="220rpx"
            prop="skuId"
            is-link
            :value="selectedSkuName"
            placeholder="请选择商品规格"
            @click="handleOpenSku"
          />
          <wd-form-item title="用户头像" title-width="220rpx" prop="userAvatar">
            <yd-upload-img v-model="formData.userAvatar" />
          </wd-form-item>
          <wd-form-item title="用户名称" title-width="220rpx" prop="userNickname">
            <wd-input v-model="formData.userNickname" clearable placeholder="请输入用户名称" />
          </wd-form-item>
          <wd-form-item title="评论内容" title-width="220rpx" prop="content">
            <wd-textarea v-model="formData.content" clearable :maxlength="500" placeholder="请输入评论内容" />
          </wd-form-item>
          <wd-form-item title="描述星级" title-width="220rpx" prop="descriptionScores" center>
            <wd-rate v-model="formData.descriptionScores" />
          </wd-form-item>
          <wd-form-item title="服务星级" title-width="220rpx" prop="benefitScores" center>
            <wd-rate v-model="formData.benefitScores" />
          </wd-form-item>
          <wd-form-item title="评论图片" title-width="220rpx" prop="picUrls">
            <yd-upload-imgs v-model="formData.picUrls" :limit="9" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 商品选择器 -->
    <wd-picker
      v-model:visible="spuPickerVisible"
      :model-value="formData.spuId"
      :columns="spuOptions"
      @confirm="handleSpuConfirm"
    />

    <!-- 商品规格选择器 -->
    <wd-picker
      v-model:visible="skuPickerVisible"
      :model-value="formData.skuId"
      :columns="skuOptions"
      @confirm="({ value }) => formData.skuId = Number(value[0])"
    />

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProductSku } from '@/api/mall/product/spu'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createProductComment } from '@/api/mall/product/comment'
import { getProductSpu, getSimpleProductSpuList } from '@/api/mall/product/spu'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formLoading = ref(false) // 表单提交状态
const spuPickerVisible = ref(false) // 商品选择器状态
const skuPickerVisible = ref(false) // 规格选择器状态
const spuOptions = ref<{ label: string, value: number }[]>([]) // 商品选项
const skuList = ref<ProductSku[]>([]) // 当前商品下的 SKU 列表
const formData = ref({
  spuId: undefined as number | undefined, // 仅用于筛选 SKU，后端创建接口不接收 spuId
  skuId: undefined as number | undefined,
  userAvatar: '',
  userNickname: '',
  content: '',
  descriptionScores: 5,
  benefitScores: 5,
  picUrls: [] as string[],
}) // 表单数据
const formSchema = createFormSchema({
  spuId: [{ required: true, message: '商品不能为空' }],
  skuId: [{ required: true, message: '商品规格不能为空' }],
  userAvatar: [{ required: true, message: '用户头像不能为空' }],
  userNickname: [{ required: true, message: '用户名称不能为空' }],
  content: [{ required: true, message: '评论内容不能为空' }],
  descriptionScores: [{ required: true, message: '描述星级不能为空' }],
  benefitScores: [{ required: true, message: '服务星级不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** SKU 选项：以「规格名 / 属性值」展示 */
const skuOptions = computed(() => skuList.value.map(sku => ({
  label: sku.name || (sku.properties?.map(p => p.valueName).filter(Boolean).join(' ')) || `规格 #${sku.id}`,
  value: Number(sku.id),
})))

/** 已选 SKU 的展示文本 */
const selectedSkuName = computed(() => {
  if (formData.value.skuId == null) {
    return ''
  }
  return skuOptions.value.find(item => item.value === Number(formData.value.skuId))?.label || ''
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/product/comment/index')
}

/** 获取选项文本 */
function getOptionText(options: { label: string, value: number }[], value?: number) {
  if (value == null) {
    return ''
  }
  return options.find(item => Number(item.value) === Number(value))?.label || String(value)
}

/** 加载 SPU 精简列表 */
async function loadSpuOptions() {
  const list = await getSimpleProductSpuList()
  spuOptions.value = list.map(item => ({ label: item.name || String(item.id), value: Number(item.id) }))
}

/** 选择商品后加载其 SKU 列表，并重置已选规格 */
async function handleSpuConfirm({ value }: { value: any[] }) {
  const spuId = Number(value[0])
  formData.value.spuId = spuId
  formData.value.skuId = undefined
  skuList.value = []
  try {
    toast.loading('加载规格...')
    const detail = await getProductSpu(spuId)
    skuList.value = detail.skus || []
  } finally {
    toast.close()
  }
}

/** 打开规格选择器 */
function handleOpenSku() {
  if (!skuOptions.value.length) {
    toast.warning('该商品暂无规格')
    return
  }
  skuPickerVisible.value = true
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    // 后端 ProductCommentCreateReqVO 仅接收 skuId/星级/内容等，不含 spuId
    await createProductComment({
      skuId: formData.value.skuId,
      userAvatar: formData.value.userAvatar,
      userNickname: formData.value.userNickname,
      content: formData.value.content,
      descriptionScores: formData.value.descriptionScores,
      benefitScores: formData.value.benefitScores,
      picUrls: formData.value.picUrls,
    })
    toast.success('新增成功')
    uni.$emit('mall:product-comment:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadSpuOptions()
})
</script>
