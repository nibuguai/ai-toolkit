<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="出库单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入出库单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="出库单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入出库单名称" />
          </wd-form-item>
          <wd-form-item title="发货通知单" title-width="200rpx" prop="noticeId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openNoticeSelector">
              <text :class="selectedNoticeText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedNoticeText || '请选择发货通知单' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="销售订单编号" title-width="200rpx" prop="salesOrderCode">
            <wd-input v-model="formData.salesOrderCode" clearable :disabled="isHeaderReadonly" placeholder="请输入销售订单编号" />
          </wd-form-item>
          <wd-form-item
            title="出库日期"
            title-width="200rpx"
            prop="salesDate"
            is-link
            placeholder="请选择出库日期"
            :value="formatDateTime(formData.salesDate)"
            @click="openSalesDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.salesDate"
            v-model:visible="pickerVisible.salesDate"
            title="请选择出库日期"
            type="datetime"
          />
          <wd-form-item title="客户" title-width="200rpx" prop="clientId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openClientSelector">
              <text :class="selectedClientText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedClientText || '请选择客户' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_PRODUCT_SALES_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="收货人" title-width="200rpx" prop="contactName">
            <wd-input v-model="formData.contactName" clearable :disabled="isHeaderReadonly" placeholder="请输入收货人" />
          </wd-form-item>
          <wd-form-item title="联系方式" title-width="200rpx" prop="contactTelephone">
            <wd-input v-model="formData.contactTelephone" clearable :disabled="isHeaderReadonly" placeholder="请输入联系方式" />
          </wd-form-item>
          <wd-form-item title="收货地址" title-width="200rpx" prop="contactAddress">
            <wd-input v-model="formData.contactAddress" clearable :disabled="isHeaderReadonly" placeholder="请输入收货地址" />
          </wd-form-item>
          <wd-form-item v-if="showShippingInfo" title="承运商" title-width="200rpx" prop="carrier">
            <wd-input v-model="formData.carrier" clearable :disabled="!isShippingEditable" placeholder="请输入承运商" />
          </wd-form-item>
          <wd-form-item v-if="showShippingInfo" title="运输单号" title-width="200rpx" prop="shippingNumber">
            <wd-input v-model="formData.shippingNumber" clearable :disabled="!isShippingEditable" placeholder="请输入运输单号" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :disabled="isHeaderReadonly"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <ProductSalesLineList
        v-if="currentId"
        :sales-id="currentId"
        :notice-id="formData.noticeId"
        :readonly="!isEditable"
        :stock-mode="isStock"
      />
      <view v-if="isStock" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#ad6800]">
        执行拣货会影响后续库存出库流程；H5 验证仅到拣货明细弹层、必填校验和确认提示，不在真实数据上确认保存或执行。
      </view>
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#ad6800]">
        执行出库会扣减库存；H5 验证仅到确认提示，不在真实数据上确认执行。
      </view>
      <view v-if="isCancel" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff1f0] p-24rpx text-26rpx text-[#cf1322]">
        取消后不可恢复；H5 验证仅到确认提示，不在真实数据上确认取消。
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions content-class="flex gap-24rpx text-28rpx">
      <view
        v-if="isEditable"
        class="flex-1 rounded-8rpx bg-[#1677ff] py-20rpx text-center text-white"
        :class="formLoading ? 'opacity-60' : ''"
        @click="handleSubmit"
      >
        {{ formLoading ? '保存中...' : '保存' }}
      </view>
      <view
        v-if="canSubmit"
        class="flex-1 rounded-8rpx bg-[#faad14] py-20rpx text-center text-white"
        :class="submitLoading ? 'opacity-60' : ''"
        @click="handleSubmitProductSales"
      >
        {{ submitLoading ? '提交中...' : '提交' }}
      </view>
      <view
        v-if="isStock"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="actionLoading ? 'opacity-60' : ''"
        @click="handleStockProductSales"
      >
        {{ actionLoading ? '处理中...' : '执行拣货' }}
      </view>
      <view
        v-if="isShipping"
        class="flex-1 rounded-8rpx bg-[#faad14] py-20rpx text-center text-white"
        :class="actionLoading ? 'opacity-60' : ''"
        @click="handleShippingProductSales"
      >
        {{ actionLoading ? '处理中...' : '确认填写' }}
      </view>
      <view
        v-if="isFinish"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="actionLoading ? 'opacity-60' : ''"
        @click="handleFinishProductSales"
      >
        {{ actionLoading ? '处理中...' : '确认出库' }}
      </view>
      <view
        v-if="isCancel"
        class="flex-1 rounded-8rpx bg-[#f56c6c] py-20rpx text-center text-white"
        :class="actionLoading ? 'opacity-60' : ''"
        @click="handleCancelProductSales"
      >
        {{ actionLoading ? '处理中...' : '确认取消' }}
      </view>
    </MesFooterActions>

    <ClientSelector ref="clientSelectorRef" @confirm="handleClientConfirm" />
    <SalesNoticeSelector ref="noticeSelectorRef" @confirm="handleNoticeConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdClientVO } from '@/api/mes/md/client'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import type { WmProductSalesCreateReqVO } from '@/api/mes/wm/productsales'
import type { WmSalesNoticeVO } from '@/api/mes/wm/salesnotice'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  cancelProductSales,
  checkProductSalesQuantity,
  createProductSales,
  finishProductSales,
  getProductSales,
  shippingProductSales,
  stockProductSales,
  submitProductSales,
  updateProductSales,
} from '@/api/mes/wm/productsales'
import { getSalesNotice } from '@/api/mes/wm/salesnotice'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmProductSalesStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ClientSelector from '../../../md/client/components/client-selector.vue'
import SalesNoticeSelector from '../../salesnotice/components/sales-notice-selector.vue'
import ProductSalesLineList from '../components/product-sales-line-list.vue'

interface WmProductSalesFormData extends WmProductSalesCreateReqVO {
  id?: number
  clientCode?: string
  clientName?: string
  noticeCode?: string
  status?: number
}

const props = defineProps<{
  id?: number | string
  noticeId?: number | string
  mode?: 'stock' | 'shipping' | 'finish' | 'cancel' | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/wm/productsales/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const routeNoticeId = computed(() => getRouteQueryNumber('noticeId')) // 路由发货通知编号
const routeMode = computed(() => String(getRouteQueryValue('mode') || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentNoticeId = ref<number>() // 当前发货通知编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'stock') {
    return '执行拣货'
  }
  if (currentMode.value === 'shipping') {
    return '填写运单'
  }
  if (currentMode.value === 'finish') {
    return '执行出库'
  }
  if (currentMode.value === 'cancel') {
    return '取消销售出库'
  }
  return currentId.value ? '编辑销售出库' : '新增销售出库'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const actionLoading = ref(false) // 状态动作状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmProductSalesFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '出库单编号不能为空' }],
  name: [{ required: true, message: '出库单名称不能为空' }],
  clientId: [{ required: true, message: '客户不能为空' }],
  salesDate: [{ required: true, message: '出库日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const clientSelectorRef = ref<InstanceType<typeof ClientSelector>>() // 客户选择器引用
const noticeSelectorRef = ref<InstanceType<typeof SalesNoticeSelector>>() // 发货通知选择器引用
const selectedClient = ref<MdClientVO>() // 当前选择客户
const selectedNotice = ref<WmSalesNoticeVO>() // 当前选择发货通知
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmProductSalesStatusEnum.APPROVING)
const isShipping = computed(() => currentMode.value === 'shipping' && formData.value.status === MesWmProductSalesStatusEnum.SHIPPING)
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmProductSalesStatusEnum.APPROVED)
const isCancel = computed(() => currentMode.value === 'cancel' && [
  MesWmProductSalesStatusEnum.CONFIRMED,
  MesWmProductSalesStatusEnum.APPROVING,
  MesWmProductSalesStatusEnum.SHIPPING,
  MesWmProductSalesStatusEnum.APPROVED,
].includes(formData.value.status || -1))
const isEditable = computed(() => {
  if (!currentId.value) {
    return true
  }
  return (!currentMode.value || currentMode.value === 'update')
    && formData.value.status === MesWmProductSalesStatusEnum.PREPARE
})
const isHeaderReadonly = computed(() => Boolean(currentId.value) && !isEditable.value)
const isShippingEditable = computed(() => isShipping.value)
const showShippingInfo = computed(() => (
  isShipping.value
  || Boolean(formData.value.carrier)
  || Boolean(formData.value.shippingNumber)
))
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmProductSalesStatusEnum.PREPARE
))
const selectedClientText = computed(() => {
  return selectedClient.value
    ? `${selectedClient.value.code || '-'} ${selectedClient.value.name || ''}`.trim()
    : (formData.value.clientName || '')
})
const selectedNoticeText = computed(() => {
  return selectedNotice.value
    ? `${selectedNotice.value.code || '-'} ${selectedNotice.value.name || ''}`.trim()
    : (formData.value.noticeCode || '')
})

/** 默认表单数据 */
function getDefaultFormData() {
  return {
    code: '',
    name: '',
    noticeId: undefined,
    noticeCode: '',
    salesOrderCode: '',
    salesDate: '',
    clientId: undefined,
    clientCode: '',
    clientName: '',
    contactName: '',
    contactTelephone: '',
    contactAddress: '',
    carrier: '',
    shippingNumber: '',
    status: undefined,
    remark: '',
  } as WmProductSalesFormData
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/productsales/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getProductSales(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name || '',
    noticeId: data.noticeId,
    noticeCode: data.noticeCode || '',
    salesOrderCode: data.salesOrderCode || '',
    salesDate: data.salesDate || data.shipmentDate || '',
    clientId: data.clientId,
    clientCode: data.clientCode || '',
    clientName: data.clientName || '',
    contactName: data.contactName || '',
    contactTelephone: data.contactTelephone || '',
    contactAddress: data.contactAddress || '',
    carrier: data.carrier || '',
    shippingNumber: data.shippingNumber || '',
    status: data.status,
    remark: data.remark || '',
  }
  selectedClient.value = data.clientId
    ? {
        id: data.clientId,
        code: data.clientCode || '',
        name: data.clientName || '',
        nickname: null,
        englishName: null,
        description: null,
        logo: null,
        type: 0,
        address: null,
        website: null,
        email: null,
        telephone: null,
        contact1Name: null,
        contact1Telephone: null,
        contact1Email: null,
        contact2Name: null,
        contact2Telephone: null,
        contact2Email: null,
        creditCode: null,
        status: 0,
        remark: null,
        createTime: '',
      }
    : undefined
  selectedNotice.value = data.noticeId
    ? {
        id: data.noticeId,
        code: data.noticeCode || '',
        name: '',
        clientId: data.clientId,
        clientCode: data.clientCode || '',
        clientName: data.clientName || '',
        status: 0,
      }
    : undefined
}

/** 按发货通知预填新增表单 */
async function loadNoticePreset() {
  if (!currentNoticeId.value || currentId.value) {
    return
  }
  const notice = await getSalesNotice(currentNoticeId.value)
  handleNoticeConfirm(notice)
  if (!formData.value.name) {
    formData.value.name = notice.name || notice.code || ''
  }
  if (!formData.value.salesDate) {
    formData.value.salesDate = notice.salesDate || ''
  }
}

/** 初始化页面数据 */
async function initPage() {
  const oldId = currentId.value
  currentId.value = routeId.value
  currentNoticeId.value = routeNoticeId.value
  currentMode.value = routeMode.value
  if (!currentId.value) {
    formData.value = getDefaultFormData()
    selectedClient.value = undefined
    selectedNotice.value = undefined
    await loadNoticePreset()
    return
  }
  if (oldId !== currentId.value || !formData.value.id) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开出库日期选择 */
function openSalesDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.salesDate = true
}

/** 打开客户选择器 */
function openClientSelector() {
  if (isHeaderReadonly.value) {
    return
  }
  clientSelectorRef.value?.open()
}

/** 打开发货通知选择器 */
function openNoticeSelector() {
  if (isHeaderReadonly.value) {
    return
  }
  noticeSelectorRef.value?.open()
}

/** 确认选择客户 */
function handleClientConfirm(clients: MdClientVO[]) {
  const client = clients[0]
  if (!client) {
    return
  }
  selectedClient.value = client
  formData.value.clientId = client.id
  formData.value.clientCode = client.code
  formData.value.clientName = client.name
}

/** 确认选择发货通知 */
function handleNoticeConfirm(notice: WmSalesNoticeVO) {
  selectedNotice.value = notice
  formData.value.noticeId = notice.id
  formData.value.noticeCode = notice.code
  formData.value.salesOrderCode = notice.salesOrderCode || ''
  formData.value.clientId = notice.clientId
  formData.value.clientCode = notice.clientCode || ''
  formData.value.clientName = notice.clientName || ''
  formData.value.contactName = notice.recipientName || ''
  formData.value.contactTelephone = notice.recipientTelephone || ''
  formData.value.contactAddress = notice.recipientAddress || ''
  selectedClient.value = {
    id: notice.clientId,
    code: notice.clientCode || '',
    name: notice.clientName || '',
    nickname: null,
    englishName: null,
    description: null,
    logo: null,
    type: 0,
    address: null,
    website: null,
    email: null,
    telephone: null,
    contact1Name: null,
    contact1Telephone: null,
    contact1Email: null,
    contact2Name: null,
    contact2Telephone: null,
    contact2Email: null,
    creditCode: null,
    status: 0,
    remark: null,
    createTime: '',
  }
}

/** 生成出库单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_PRODUCT_SALES_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData() {
  const data: WmProductSalesCreateReqVO = {
    code: formData.value.code,
    name: formData.value.name,
    noticeId: formData.value.noticeId,
    salesOrderCode: formData.value.salesOrderCode || undefined,
    salesDate: formData.value.salesDate,
    clientId: formData.value.clientId,
    contactName: formData.value.contactName || undefined,
    contactTelephone: formData.value.contactTelephone || undefined,
    contactAddress: formData.value.contactAddress || undefined,
    carrier: formData.value.carrier || undefined,
    shippingNumber: formData.value.shippingNumber || undefined,
    remark: formData.value.remark || undefined,
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
    if (currentId.value) {
      await updateProductSales({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      const id = await createProductSales(data)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmProductSalesStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:productsales:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交销售出库单 */
async function handleSubmitProductSales() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该销售出库单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateProductSales({ ...buildSubmitData(), id: currentId.value })
    await submitProductSales(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:productsales:reload')
    await getDetail()
  } finally {
    submitLoading.value = false
  }
}

/** 执行拣货 */
async function handleStockProductSales() {
  if (!currentId.value) {
    return
  }
  actionLoading.value = true
  try {
    const quantityMatch = await checkProductSalesQuantity(currentId.value)
    if (!quantityMatch) {
      try {
        await dialog.confirm({
          title: '提示',
          msg: '出库数量与拣货数量不一致，确认执行拣货？',
        })
      } catch {
        return
      }
    } else {
      try {
        await dialog.confirm({
          title: '提示',
          msg: '确认执行拣货？',
        })
      } catch {
        return
      }
    }
    await stockProductSales(currentId.value)
    toast.success('拣货成功')
    uni.$emit('mes:wm:productsales:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 填写运单 */
async function handleShippingProductSales() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交运单信息？',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await shippingProductSales({
      id: currentId.value,
      carrier: formData.value.carrier || undefined,
      shippingNumber: formData.value.shippingNumber || undefined,
    })
    toast.success('运单信息填写成功')
    uni.$emit('mes:wm:productsales:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 执行出库 */
async function handleFinishProductSales() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行出库？执行后将扣减库存。',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await finishProductSales(currentId.value)
    toast.success('出库成功')
    uni.$emit('mes:wm:productsales:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 取消销售出库单 */
async function handleCancelProductSales() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认取消该销售出库单？取消后不可恢复。',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await cancelProductSales(currentId.value)
    toast.success('取消成功')
    uni.$emit('mes:wm:productsales:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})

onShow(() => {
  initPage()
})

watch([routeId, routeNoticeId, routeMode], () => {
  initPage()
})
</script>
