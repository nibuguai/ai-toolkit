<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        关联产品
      </view>
      <wd-button v-if="editable" size="small" type="primary" variant="plain" @click="openForm('create')">
        关联产品
      </wd-button>
    </view>
    <view v-if="loading" class="px-24rpx pb-24rpx text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx pb-24rpx text-26rpx text-[#999]">
      暂无关联产品
    </view>
    <view v-else class="px-24rpx pb-8rpx">
      <view v-for="item in list" :key="item.id" class="mb-20rpx rounded-12rpx bg-[#f8fafc] p-20rpx">
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-30rpx text-[#333] font-semibold">
              {{ item.itemName || '-' }}
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              {{ item.itemCode || '-' }}
            </view>
          </view>
          <view class="flex shrink-0 gap-12rpx">
            <text v-if="editable" class="text-26rpx text-[#1677ff]" @click="openForm('update', item)">
              编辑
            </text>
            <text v-if="editable" class="text-26rpx text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </text>
          </view>
        </view>
        <view class="text-26rpx text-[#666] space-y-8rpx">
          <view>规格型号：{{ item.specification || '-' }}</view>
          <view>单位：{{ item.unitName || '-' }}</view>
          <view>生产数量：{{ item.quantity ?? '-' }}</view>
          <view>
            生产用时：
            <template v-if="item.productionTime != null">
              {{ item.productionTime }}
              <dict-tag v-if="item.timeUnitType" :type="DICT_TYPE.MES_TIME_UNIT_TYPE" :value="item.timeUnitType" />
            </template>
            <text v-else>-</text>
          </view>
          <view v-if="item.remark">
            备注：{{ item.remark }}
          </view>
        </view>
        <RouteProductBomList
          :route-id="routeId"
          :product-id="item.itemId"
          :product-name="item.itemName"
          :editable="editable"
          @changed="handleBomChanged"
        />
      </view>
    </view>
  </view>

  <wd-popup v-model="formVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0; max-height: 86vh;">
    <view class="max-h-[86vh] flex flex-col bg-white">
      <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
        <text class="text-32rpx text-[#333] font-semibold">{{ formTitle }}</text>
        <wd-icon name="close" size="36rpx" @click="formVisible = false" />
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="产品" title-width="220rpx" prop="itemId" is-link :value="productDisplayValue" placeholder="请选择产品" @click="openProductSelector" />
            <wd-form-item title="生产数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" :min="1" :precision="0" />
            </wd-form-item>
            <wd-form-item title="生产用时" title-width="220rpx" prop="productionTime" center>
              <wd-input-number v-model="formData.productionTime" :min="0" :precision="2" :step="0.5" />
            </wd-form-item>
            <wd-form-item title="时间单位" title-width="220rpx" prop="timeUnitType">
              <wd-radio-group v-model="formData.timeUnitType" type="button">
                <wd-radio v-for="dict in getStrDictOptions(DICT_TYPE.MES_TIME_UNIT_TYPE)" :key="dict.value" :value="dict.value">
                  {{ dict.label }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="h-120rpx" />
      </scroll-view>
      <view class="p-24rpx">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </wd-popup>

  <ItemSelector ref="itemSelectorRef" :existing-ids="existingProductIds" :multiple="false" @confirm="handleProductConfirm" />
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItemVO } from '@/api/mes/md/item'
import type {
  ProRouteProductCreateReqVO,
  ProRouteProductUpdateReqVO,
  ProRouteProductVO,
} from '@/api/mes/pro/route/product'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import {
  createRouteProduct,
  deleteRouteProduct,
  getRouteProductListByRoute,
  updateRouteProduct,
} from '@/api/mes/pro/route/product'
import { getStrDictOptions } from '@/hooks/useDict'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import RouteProductBomList from './route-product-bom-list.vue'

const props = defineProps<{
  editable: boolean
  routeId: number
}>()
const emit = defineEmits<{ changed: [] }>()
const dialog = useDialog()
const toast = useToast()
const list = ref<ProRouteProductVO[]>([])
const loading = ref(false)
const formVisible = ref(false)
const formLoading = ref(false)
const formType = ref<'create' | 'update'>('create')
const formData = ref<Partial<ProRouteProductVO>>(createDefaultFormData())
const formRef = ref<FormInstance>()
const selectedProduct = ref<MdItemVO>()
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>()
const formTitle = computed(() => formType.value === 'create' ? '关联产品' : '编辑产品')
const existingProductIds = computed(() => list.value
  .filter(item => formType.value === 'create' || item.itemId !== formData.value.itemId)
  .map(item => item.itemId))
const productDisplayValue = computed(() => {
  if (selectedProduct.value) {
    return `${selectedProduct.value.name || '-'} (${selectedProduct.value.code || '-'})`
  }
  if (formData.value.itemName || formData.value.itemCode) {
    return `${formData.value.itemName || '-'} (${formData.value.itemCode || '-'})`
  }
  return ''
})
const formSchema = createFormSchema({
  itemId: [{ required: true, message: '产品不能为空' }],
  quantity: [
    { required: true, message: '生产数量不能为空' },
    { validator: value => Number(value) >= 1 || '生产数量必须大于 0' },
  ],
  productionTime: [{ validator: value => value == null || Number(value) >= 0 || '生产用时不能小于 0' }],
  timeUnitType: [{ required: true, message: '时间单位不能为空' }],
})

/** 创建默认表单数据 */
function createDefaultFormData(): Partial<ProRouteProductVO> {
  return {
    routeId: props.routeId,
    itemId: undefined,
    quantity: 1,
    productionTime: 1,
    timeUnitType: 'MINUTE',
    remark: '',
  }
}

/** 加载关联产品列表 */
async function getList() {
  if (!props.routeId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getRouteProductListByRoute(props.routeId)
  } finally {
    loading.value = false
  }
}

/** 打开新增或编辑弹层 */
function openForm(type: 'create' | 'update', row?: ProRouteProductVO) {
  formType.value = type
  selectedProduct.value = undefined
  formData.value = row ? { ...row } : createDefaultFormData()
  formVisible.value = true
  // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
  setTimeout(() => formRef.value?.reset(), 0)
}

/** 打开产品选择器 */
function openProductSelector() {
  itemSelectorRef.value?.open()
}

/** 选择产品 */
function handleProductConfirm(items: MdItemVO[]) {
  const product = items[0]
  if (!product) {
    return
  }
  selectedProduct.value = product
  formData.value.itemId = product.id
  formData.value.itemCode = product.code
  formData.value.itemName = product.name
  formData.value.specification = product.specification
  formData.value.unitName = product.unitMeasureName
}

/** 构造提交数据 */
function buildSubmitData(): ProRouteProductCreateReqVO | ProRouteProductUpdateReqVO {
  const data = {
    routeId: props.routeId,
    itemId: Number(formData.value.itemId),
    quantity: formData.value.quantity == null ? undefined : Number(formData.value.quantity),
    productionTime: formData.value.productionTime == null ? undefined : Number(formData.value.productionTime),
    timeUnitType: formData.value.timeUnitType || undefined,
    remark: formData.value.remark || undefined,
  }
  if (formType.value === 'update') {
    return { ...data, id: Number(formData.value.id) }
  }
  return data
}

/** 提交关联产品 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (formType.value === 'update' && !formData.value.id) {
    toast.error('缺少关联产品编号')
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (formType.value === 'create') {
      await createRouteProduct(data)
      toast.success('新增成功')
    } else {
      await updateRouteProduct(data)
      toast.success('修改成功')
    }
    formVisible.value = false
    await getList()
    emit('changed')
  } finally {
    formLoading.value = false
  }
}

/** 删除关联产品 */
async function handleDelete(item: ProRouteProductVO) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemName || item.itemCode}」关联产品吗？删除后将同步删除该产品的路线 BOM 配置。`,
    })
  } catch {
    return
  }
  await deleteRouteProduct(item.id)
  toast.success('删除成功')
  await getList()
  emit('changed')
}

/** BOM 变更后同步概览 */
function handleBomChanged() {
  emit('changed')
}

watch(() => props.routeId, () => {
  getList()
})

onMounted(() => {
  getList()
})

defineExpose({ reload: getList })
</script>
