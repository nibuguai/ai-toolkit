<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="产品详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="产品编号" :value="String(formData?.id || '-')" />
        <wd-cell title="产品名称" :value="formData?.name || '-'" />
        <wd-cell title="ProductKey" :value="formData?.productKey || '-'" />
        <wd-cell title="产品密钥" :value="formData?.productSecret || '-'" />
        <wd-cell title="产品分类" :value="formData?.categoryName || '-'" />
        <wd-cell title="设备类型">
          <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="formData?.deviceType" />
        </wd-cell>
        <wd-cell title="联网方式">
          <dict-tag :type="DICT_TYPE.IOT_NET_TYPE" :value="formData?.netType" />
        </wd-cell>
        <wd-cell title="协议类型">
          <dict-tag :type="DICT_TYPE.IOT_PROTOCOL_TYPE" :value="formData?.protocolType" />
        </wd-cell>
        <wd-cell title="序列化类型">
          <dict-tag :type="DICT_TYPE.IOT_SERIALIZE_TYPE" :value="formData?.serializeType" />
        </wd-cell>
        <wd-cell title="产品状态">
          <dict-tag :type="DICT_TYPE.IOT_PRODUCT_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="设备数量" :value="String(formData?.deviceCount || 0)" />
        <wd-cell title="动态注册" :value="formData?.registerEnabled ? '开启' : '关闭'" />
        <wd-cell title="产品描述" :value="formData?.description || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="info" @click="handleThingModel">
          物模型
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['iot:product:update'])" class="flex-1" :type="isPublished ? 'warning' : 'success'" @click="handleToggleStatus">
          {{ isPublished ? '撤销发布' : '发布' }}
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['iot:product:update'])" class="flex-1" type="warning" :disabled="isPublished" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['iot:product:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/iot/product/product'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteProduct, getProduct, updateProductStatus } from '@/api/iot/product/product'
import { useAccess } from '@/hooks/useAccess'
import { ProductStatusEnum } from '@/pages-iot/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<Product>() // 详情数据
const deleting = ref(false) // 删除状态
const isPublished = computed(() => formData.value?.status === ProductStatusEnum.PUBLISHED) // 是否已发布

/** 返回上一页 */
function handleBack() { navigateBackPlus('/pages-iot/product/product/index') }

/** 加载产品详情 */
async function getDetail() {
  if (!props.id || deleting.value)
    return
  formData.value = await getProduct(Number(props.id))
}

/** 编辑产品 */
function handleEdit() { uni.navigateTo({ url: `/pages-iot/product/product/form/index?id=${props.id}` }) }

/** 查看物模型 */
function handleThingModel() { uni.navigateTo({ url: `/pages-iot/thingmodel/index?productId=${props.id}` }) }

/** 发布 / 撤销发布 */
async function handleToggleStatus() {
  if (!props.id)
    return
  const nextStatus = isPublished.value ? ProductStatusEnum.UNPUBLISHED : ProductStatusEnum.PUBLISHED
  await updateProductStatus(Number(props.id), nextStatus)
  toast.success('操作成功')
  uni.$emit('iot:product:reload')
  getDetail()
}

/** 删除产品 */
async function handleDelete() {
  if (!props.id)
    return
  try { await dialog.confirm({ title: '提示', msg: '确定要删除该产品吗？' }) } catch { return }
  deleting.value = true
  try {
    await deleteProduct(Number(props.id))
    toast.success('删除成功')
    uni.$emit('iot:product:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onShow(() => { getDetail() })
</script>
