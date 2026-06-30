<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="流转卡编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :disabled="headerReadonly" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="生产工单" title-width="220rpx" prop="workOrderId" is-link :value="selectedWorkOrderText" placeholder="请选择已确认工单" @click="openWorkOrderSelector" />
          <wd-form-item title="产品" title-width="220rpx" prop="itemId" is-link :value="selectedProductText" placeholder="请选择产品" @click="openItemSelector" />
          <wd-cell title="规格型号" :value="productSpecText" />
          <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
            <wd-input v-model="formData.batchCode" placeholder="请输入批次号" clearable :disabled="headerReadonly" />
          </wd-form-item>
          <wd-form-item title="流转数量" title-width="220rpx" prop="transferedQuantity" center>
            <wd-input-number v-model="formData.transferedQuantity" :min="0.01" :precision="2" :disabled="headerReadonly" />
          </wd-form-item>
          <wd-cell v-if="formData.status != null" title="单据状态">
            <dict-tag :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="formData.status" />
          </wd-cell>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable :disabled="headerReadonly" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <view v-if="formData.id" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#8a5a00]">
        草稿流转卡可维护工序记录并提交；提交后进入已确认状态，只能完成或取消，不能再修改基础信息。
      </view>
      <CardProcessList v-if="formData.id" :card-id="formData.id" :editable="isEditable" @changed="handleProcessChanged" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions content-class="flex gap-16rpx">
      <wd-button v-if="isEditable" class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
      <wd-button v-if="canSubmit" class="flex-1" type="warning" :loading="formLoading" @click="handleSubmitCard">
        提交
      </wd-button>
    </MesFooterActions>

    <WorkOrderSelector ref="workOrderSelectorRef" @confirm="handleWorkOrderConfirm" />
    <ItemSelector ref="itemSelectorRef" item-or-product="PRODUCT" title="选择产品" :multiple="false" @confirm="handleItemConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItemVO } from '@/api/mes/md/item'
import type { ProCardCreateReqVO, ProCardUpdateReqVO, ProCardVO } from '@/api/mes/pro/card'
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createCard, getCard, submitCard, updateCard } from '@/api/mes/pro/card'
import { getWorkOrder } from '@/api/mes/pro/workorder'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import CardProcessList from '../components/card-process-list.vue'
import WorkOrderSelector from '../components/workorder-selector.vue'

interface CardFormData {
  id?: number
  code: string
  workOrderId?: number
  itemId?: number
  batchCode: string
  transferedQuantity?: number
  status?: number
  remark: string
}

interface CardProductInfo {
  id: number
  code?: string
  name?: string
  specification?: string
  unitMeasureName?: string
}

const props = defineProps<{
  id?: number | string
}>()
const MesAutoCodeRuleCode = {
  PRO_CARD_CODE: 'PRO_CARD_CODE',
} as const
const MesProCardStatusEnum = {
  PREPARE: 0,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/pro/card/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑流转卡' : '新增流转卡')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const workOrderSelectorRef = ref<InstanceType<typeof WorkOrderSelector>>() // 工单选择器
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 产品选择器
const selectedWorkOrder = ref<ProWorkOrderVO>() // 当前工单
const selectedItem = ref<CardProductInfo>() // 当前产品
const formData = ref<CardFormData>(getDefaultFormData())
const formSchema = createFormSchema({
  code: [{ required: true, message: '流转卡编码不能为空' }],
  workOrderId: [{ required: true, message: '生产工单不能为空' }],
  itemId: [
    { required: true, message: '产品不能为空' },
    {
      validator: (value) => {
        if (!selectedWorkOrder.value?.productId || value === selectedWorkOrder.value.productId) {
          return true
        }
        return '产品必须与生产工单产品一致'
      },
    },
  ],
  transferedQuantity: [{ required: true, message: '流转数量不能为空' }],
})
const isEditable = computed(() => !formData.value.id || formData.value.status === MesProCardStatusEnum.PREPARE)
const canSubmit = computed(() => formData.value.id && formData.value.status === MesProCardStatusEnum.PREPARE)
const headerReadonly = computed(() => !isEditable.value)
const selectedWorkOrderText = computed(() => {
  if (!selectedWorkOrder.value) {
    return ''
  }
  return `${selectedWorkOrder.value.code || '-'} / ${selectedWorkOrder.value.name || '-'}`
})
const selectedProductText = computed(() => {
  if (selectedItem.value) {
    return `${selectedItem.value.code || '-'} / ${selectedItem.value.name || '-'}`
  }
  if (selectedWorkOrder.value) {
    return `${selectedWorkOrder.value.productCode || '-'} / ${selectedWorkOrder.value.productName || '-'}`
  }
  return formData.value.itemId ? `产品 #${formData.value.itemId}` : '-'
})
const productSpecText = computed(() => {
  if (selectedItem.value) {
    return `${selectedItem.value.specification || '-'} / ${selectedItem.value.unitMeasureName || '-'}`
  }
  if (!selectedWorkOrder.value) {
    return '-'
  }
  return `${selectedWorkOrder.value.productSpecification || '-'} / ${selectedWorkOrder.value.unitMeasureName || '-'}`
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/card/index')
}

/** 默认表单数据 */
function getDefaultFormData(): CardFormData {
  return {
    code: '',
    workOrderId: undefined,
    itemId: undefined,
    batchCode: '',
    transferedQuantity: 1,
    status: undefined,
    remark: '',
  }
}

/** 重置表单上下文 */
function resetFormContext() {
  formData.value = getDefaultFormData()
  selectedWorkOrder.value = undefined
  selectedItem.value = undefined
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    resetFormContext()
    return
  }
  const detail = await getCard(currentId.value)
  setFormData(detail)
  if (detail.workOrderId) {
    selectedWorkOrder.value = await getWorkOrder(detail.workOrderId)
  }
  if (selectedWorkOrder.value?.productId === detail.itemId) {
    selectedItem.value = {
      id: detail.itemId,
      code: detail.itemCode || selectedWorkOrder.value.productCode || '',
      name: detail.itemName || selectedWorkOrder.value.productName || '',
      specification: detail.specification || selectedWorkOrder.value.productSpecification || '',
      unitMeasureName: detail.unitMeasureName || selectedWorkOrder.value.unitMeasureName,
    }
  }
}

/** 设置表单数据 */
function setFormData(data: ProCardVO) {
  formData.value = {
    id: data.id,
    code: data.code || '',
    workOrderId: data.workOrderId,
    itemId: data.itemId,
    batchCode: data.batchCode || '',
    transferedQuantity: data.transferedQuantity,
    status: data.status,
    remark: data.remark || '',
  }
}

/** 打开工单选择器 */
function openWorkOrderSelector() {
  if (headerReadonly.value) {
    return
  }
  workOrderSelectorRef.value?.open(formData.value.workOrderId)
}

/** 打开产品选择器 */
function openItemSelector() {
  if (headerReadonly.value) {
    return
  }
  itemSelectorRef.value?.open()
}

/** 选择工单 */
function handleWorkOrderConfirm(item: ProWorkOrderVO) {
  selectedWorkOrder.value = item
  formData.value.workOrderId = item.id
  formData.value.itemId = item.productId
  selectedItem.value = {
    id: item.productId,
    code: item.productCode || '',
    name: item.productName || '',
    specification: item.productSpecification || '',
    unitMeasureName: item.unitMeasureName,
  }
  formData.value.batchCode = item.batchCode || formData.value.batchCode
  formData.value.transferedQuantity = item.quantity
}

/** 选择产品 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  selectedItem.value = item
  formData.value.itemId = item.id
}

/** 生成流转卡编码 */
async function handleGenerateCode() {
  if (headerReadonly.value) {
    return
  }
  formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.PRO_CARD_CODE)
}

/** 构造提交数据 */
function buildSubmitData(): ProCardCreateReqVO | ProCardUpdateReqVO {
  const data = {
    code: formData.value.code,
    workOrderId: Number(formData.value.workOrderId),
    itemId: Number(formData.value.itemId),
    batchCode: formData.value.batchCode || undefined,
    transferedQuantity: Number(formData.value.transferedQuantity),
    remark: formData.value.remark || undefined,
  }
  if (formData.value.id) {
    return { ...data, id: formData.value.id }
  }
  return data
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (formData.value.id) {
      await updateCard(data)
      toast.success('修改成功')
      setFormData(await getCard(formData.value.id))
    } else {
      const id = await createCard(data)
      toast.success('新增成功')
      setFormData(await getCard(id))
    }
    uni.$emit('mes:pro:card:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交流转卡 */
async function handleSubmitCard() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!formData.value.id) {
    await handleSubmit()
  }
  if (!formData.value.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确认提交该流转卡？提交后将不能修改。' })
  } catch {
    return
  }
  formLoading.value = true
  try {
    await submitCard(formData.value.id)
    toast.success('提交成功')
    uni.$emit('mes:pro:card:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 工序记录变更 */
function handleProcessChanged() {
  uni.$emit('mes:pro:card:reload')
}

onMounted(() => {
  getDetail()
})

watch(currentId, () => {
  getDetail()
})
</script>
