<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell v-if="parentWorkOrder" title="父工单" :value="`${parentWorkOrder.code} / ${parentWorkOrder.name}`" />
          <wd-form-item title="工单编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="工单名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入工单名称" clearable />
          </wd-form-item>
          <wd-form-item title="工单来源" title-width="220rpx" prop="orderSourceType">
            <wd-radio-group v-model="formData.orderSourceType" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item v-if="formData.orderSourceType === MesProWorkOrderSourceTypeEnum.ORDER" title="来源单据" title-width="220rpx" prop="orderSourceCode">
            <wd-input v-model="formData.orderSourceCode" placeholder="请输入来源单据编号" clearable />
          </wd-form-item>
          <wd-form-item title="工单类型" title-width="220rpx" prop="type">
            <wd-radio-group v-model="formData.type" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="产品" title-width="220rpx" prop="productId" is-link :value="selectedProductText" placeholder="请选择产品" @click="openProductSelector" />
          <wd-form-item title="工单数量" title-width="220rpx" prop="quantity" center>
            <wd-input-number v-model="formData.quantity" :min="1" :precision="2" />
          </wd-form-item>
          <wd-form-item v-if="formData.orderSourceType === MesProWorkOrderSourceTypeEnum.ORDER" title="客户" title-width="220rpx" prop="clientId" is-link :value="selectedClientText" placeholder="请选择客户" @click="clientPickerVisible = true" />
          <wd-form-item v-if="showVendor" title="供应商" title-width="220rpx" prop="vendorId" is-link :value="selectedVendorText" placeholder="请选择供应商" @click="vendorPickerVisible = true" />
          <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
            <wd-input v-model="formData.batchCode" placeholder="请输入批次号" clearable />
          </wd-form-item>
          <wd-form-item title="需求日期" title-width="220rpx" prop="requestDate">
            <wd-datetime-picker v-model="formData.requestDate" type="date" placeholder="请选择需求日期" />
          </wd-form-item>
          <wd-cell v-if="formData.status != null" title="工单状态">
            <dict-tag :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="formData.status" />
          </wd-cell>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <view v-if="currentId" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#8a5a00]">
        草稿工单可继续编辑并确认；确认后将进入排产、流转卡和报工链路，不能再修改工单基础信息。
      </view>
      <WorkOrderBomList v-if="workOrderId" :work-order-id="workOrderId" mode="bom" />
      <WorkOrderBomList v-if="workOrderId" :work-order-id="workOrderId" mode="item" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部按钮 -->
    <MesFooterActions content-class="flex gap-16rpx">
      <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
      <wd-button v-if="canConfirm" class="flex-1" type="warning" :loading="formLoading" @click="handleConfirm">
        确认
      </wd-button>
    </MesFooterActions>

    <ItemSelector ref="productSelectorRef" item-or-product="PRODUCT" title="选择产品" :multiple="false" @confirm="handleProductConfirm" />
    <wd-picker v-model:visible="clientPickerVisible" :model-value="clientPickerValue" title="选择客户" :columns="clientOptions" label-key="label" value-key="value" @confirm="handleClientConfirm" />
    <wd-picker v-model:visible="vendorPickerVisible" :model-value="vendorPickerValue" title="选择供应商" :columns="vendorOptions" label-key="label" value-key="value" @confirm="handleVendorConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdClientVO } from '@/api/mes/md/client'
import type { MdItemVO } from '@/api/mes/md/item'
import type { MdVendorVO } from '@/api/mes/md/vendor'
import type { ProWorkOrderCreateReqVO, ProWorkOrderUpdateReqVO, ProWorkOrderVO } from '@/api/mes/pro/workorder'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, onMounted, ref, watch } from 'vue'
import { getClientPage } from '@/api/mes/md/client'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getVendorPage } from '@/api/mes/md/vendor'
import { confirmWorkOrder, createWorkOrder, getWorkOrder, updateWorkOrder } from '@/api/mes/pro/workorder'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import WorkOrderBomList from '../components/workorder-bom-list.vue'

interface PickerOption {
  label: string
  value: number
}

interface WorkOrderFormData {
  id?: number
  parentId?: number
  code: string
  name: string
  type?: number
  orderSourceType?: number
  orderSourceCode: string
  productId?: number
  quantity?: number
  clientId?: number
  vendorId?: number
  batchCode: string
  requestDate: string
  status?: number
  remark: string
}

const props = defineProps<{
  id?: number | string
  parentId?: number | string
}>()
const MesAutoCodeRuleCode = {
  PRO_WORK_ORDER_CODE: 'PRO_WORK_ORDER_CODE',
} as const
const MesProWorkOrderStatusEnum = {
  PREPARE: 0,
} as const
const MesProWorkOrderTypeEnum = {
  OUTSOURCE: 2,
  PURCHASE: 3,
} as const
const MesProWorkOrderSourceTypeEnum = {
  ORDER: 1,
  STORE: 2,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/pro/workorder/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const currentParentId = computed(() => getRouteQueryNumber('parentId'))
const getTitle = computed(() => currentParentId.value ? '新增子工单' : currentId.value ? '编辑生产工单' : '新增生产工单')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const productSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 产品选择器
const selectedProduct = ref<MdItemVO>() // 当前产品
const parentWorkOrder = ref<ProWorkOrderVO>() // 父工单
const clientList = ref<MdClientVO[]>([]) // 客户列表
const vendorList = ref<MdVendorVO[]>([]) // 供应商列表
const clientPickerVisible = ref(false) // 客户选择显示状态
const vendorPickerVisible = ref(false) // 供应商选择显示状态
const formData = ref<WorkOrderFormData>(getDefaultFormData())
const formSchema = createFormSchema({
  code: [{ required: true, message: '工单编码不能为空' }],
  name: [{ required: true, message: '工单名称不能为空' }],
  type: [{ required: true, message: '工单类型不能为空' }],
  orderSourceType: [{ required: true, message: '工单来源不能为空' }],
  productId: [{ required: true, message: '产品不能为空' }],
  quantity: [{ required: true, message: '工单数量不能为空' }],
  requestDate: [{ required: true, message: '需求日期不能为空' }],
})
const workOrderId = computed(() => formData.value.id)
const canConfirm = computed(() => !!formData.value.id && formData.value.status === MesProWorkOrderStatusEnum.PREPARE)
const showVendor = computed(() =>
  formData.value.type === MesProWorkOrderTypeEnum.OUTSOURCE || formData.value.type === MesProWorkOrderTypeEnum.PURCHASE,
)
const selectedProductText = computed(() => {
  if (selectedProduct.value) {
    return `${selectedProduct.value.code} / ${selectedProduct.value.name}`
  }
  return formData.value.productId ? `产品 #${formData.value.productId}` : ''
})
const clientOptions = computed<PickerOption[]>(() => clientList.value.map(item => ({
  label: `${item.code} / ${item.name}`,
  value: item.id,
})))
const vendorOptions = computed<PickerOption[]>(() => vendorList.value.map(item => ({
  label: `${item.code} / ${item.name}`,
  value: item.id,
})))
const selectedClientText = computed(() => clientOptions.value.find(item => item.value === formData.value.clientId)?.label || '')
const selectedVendorText = computed(() => vendorOptions.value.find(item => item.value === formData.value.vendorId)?.label || '')
const clientPickerValue = computed(() => formData.value.clientId ? [formData.value.clientId] : [])
const vendorPickerValue = computed(() => formData.value.vendorId ? [formData.value.vendorId] : [])

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/workorder/index')
}

/** 日期转接口日期时间 */
function toDateTime(day: string) {
  return `${dayjs(day).format('YYYY-MM-DD')} 00:00:00`
}

/** 默认表单数据 */
function getDefaultFormData(): WorkOrderFormData {
  return {
    code: '',
    name: '',
    type: undefined,
    orderSourceType: MesProWorkOrderSourceTypeEnum.STORE,
    orderSourceCode: '',
    productId: undefined,
    quantity: 1,
    clientId: undefined,
    vendorId: undefined,
    batchCode: '',
    requestDate: dayjs().format('YYYY-MM-DD'),
    remark: '',
  }
}

/** 重置表单上下文 */
function resetFormContext() {
  formData.value = getDefaultFormData()
  selectedProduct.value = undefined
  parentWorkOrder.value = undefined
}

/** 加载详情 */
async function getDetail() {
  resetFormContext()
  if (currentParentId.value && !currentId.value) {
    parentWorkOrder.value = await getWorkOrder(currentParentId.value)
    formData.value.parentId = parentWorkOrder.value.id
    formData.value.type = parentWorkOrder.value.type
    formData.value.orderSourceType = parentWorkOrder.value.orderSourceType
    formData.value.orderSourceCode = parentWorkOrder.value.orderSourceCode || ''
    formData.value.clientId = parentWorkOrder.value.clientId
    formData.value.vendorId = parentWorkOrder.value.vendorId
    formData.value.requestDate = dayjs(parentWorkOrder.value.requestDate).format('YYYY-MM-DD')
    return
  }
  if (!currentId.value) {
    return
  }
  const detail = await getWorkOrder(currentId.value)
  formData.value = {
    id: detail.id,
    parentId: detail.parentId,
    code: detail.code || '',
    name: detail.name || '',
    type: detail.type,
    orderSourceType: detail.orderSourceType,
    orderSourceCode: detail.orderSourceCode || '',
    productId: detail.productId,
    quantity: detail.quantity,
    clientId: detail.clientId,
    vendorId: detail.vendorId,
    batchCode: detail.batchCode || '',
    requestDate: dayjs(detail.requestDate).format('YYYY-MM-DD'),
    status: detail.status,
    remark: detail.remark || '',
  }
  selectedProduct.value = detail.productId
    ? {
        id: detail.productId,
        code: detail.productCode || '',
        name: detail.productName || '',
        specification: detail.productSpecification || '',
        unitMeasureId: 0,
        unitMeasureName: detail.unitMeasureName,
        itemTypeId: 0,
        status: CommonStatusEnum.ENABLE,
        safeStockFlag: false,
        minStock: 0,
        maxStock: 0,
        highValue: false,
        batchFlag: false,
        remark: '',
      }
    : undefined
}

/** 加载选择数据 */
async function loadOptions() {
  const [clients, vendors] = await Promise.all([
    getClientPage({ pageNo: 1, pageSize: 100, status: CommonStatusEnum.ENABLE }),
    getVendorPage({ pageNo: 1, pageSize: 100, status: CommonStatusEnum.ENABLE }),
  ])
  clientList.value = clients.list
  vendorList.value = vendors.list
}

/** 生成工单编码 */
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.PRO_WORK_ORDER_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

/** 打开产品选择 */
function openProductSelector() {
  productSelectorRef.value?.open()
}

/** 选择产品 */
function handleProductConfirm(items: MdItemVO[]) {
  const product = items[0]
  if (!product) {
    return
  }
  selectedProduct.value = product
  formData.value.productId = product.id
  if (!formData.value.name) {
    formData.value.name = product.name
  }
}

/** 选择客户 */
function handleClientConfirm({ value }: { value: number[] }) {
  formData.value.clientId = Number(value[0])
}

/** 选择供应商 */
function handleVendorConfirm({ value }: { value: number[] }) {
  formData.value.vendorId = Number(value[0])
}

/** 构造提交数据 */
function buildSubmitData(): ProWorkOrderCreateReqVO | ProWorkOrderUpdateReqVO {
  const data = {
    parentId: formData.value.parentId,
    code: formData.value.code,
    name: formData.value.name,
    type: Number(formData.value.type),
    orderSourceType: Number(formData.value.orderSourceType),
    orderSourceCode: formData.value.orderSourceType === MesProWorkOrderSourceTypeEnum.ORDER ? formData.value.orderSourceCode || undefined : undefined,
    productId: Number(formData.value.productId),
    quantity: Number(formData.value.quantity),
    clientId: formData.value.orderSourceType === MesProWorkOrderSourceTypeEnum.ORDER ? formData.value.clientId : undefined,
    vendorId: showVendor.value ? formData.value.vendorId : undefined,
    batchCode: formData.value.batchCode || undefined,
    requestDate: toDateTime(formData.value.requestDate),
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
      await updateWorkOrder(data)
      toast.success('修改成功')
    } else {
      const id = await createWorkOrder(data)
      formData.value.id = id
      formData.value.status = MesProWorkOrderStatusEnum.PREPARE
      toast.success('新增成功')
    }
    uni.$emit('mes:pro:workorder:reload')
  } finally {
    formLoading.value = false
  }
}

/** 确认工单 */
async function handleConfirm() {
  if (!formData.value.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确认要完成工单编制吗？确认后将不能更改。' })
  } catch {
    return
  }
  formLoading.value = true
  try {
    await confirmWorkOrder(formData.value.id)
    toast.success('工单已确认')
    uni.$emit('mes:pro:workorder:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

watch(
  () => formData.value.orderSourceType,
  (val) => {
    if (val !== MesProWorkOrderSourceTypeEnum.ORDER) {
      formData.value.orderSourceCode = ''
      formData.value.clientId = undefined
    }
  },
)

watch(
  () => formData.value.type,
  () => {
    if (!showVendor.value) {
      formData.value.vendorId = undefined
    }
  },
)

onMounted(async () => {
  await loadOptions()
  await getDetail()
})

watch([currentId, currentParentId], () => {
  getDetail()
})
</script>
