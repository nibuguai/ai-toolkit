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
          <wd-form-item title="入库单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入入库单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="入库单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入入库单名称" />
          </wd-form-item>
          <wd-form-item
            title="入库日期"
            title-width="200rpx"
            prop="receiptDate"
            is-link
            placeholder="请选择入库日期"
            :value="formatDate(formData.receiptDate)"
            @click="openReceiptDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.receiptDate"
            v-model:visible="pickerVisible.receiptDate"
            title="请选择入库日期"
            type="date"
          />
          <wd-form-item title="到货通知" title-width="200rpx" prop="noticeId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openNoticeSelector">
              <text :class="selectedNoticeText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedNoticeText || '请选择到货通知单' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="供应商" title-width="200rpx" prop="vendorId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openVendorSelector">
              <text :class="selectedVendorText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedVendorText || '请选择供应商' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="采购订单" title-width="200rpx" prop="purchaseOrderCode">
            <wd-input v-model="formData.purchaseOrderCode" clearable :disabled="isHeaderReadonly" placeholder="请输入采购订单号" />
          </wd-form-item>
          <wd-form-item v-if="formData.iqcCode" title="来料检验" title-width="200rpx" prop="iqcCode">
            <text>{{ formData.iqcCode }}</text>
          </wd-form-item>
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_ITEM_RECEIPT_STATUS" :value="formData.status" />
            <text v-else>-</text>
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
      <ItemReceiptLineList
        v-if="currentId"
        :receipt-id="currentId"
        :notice-id="formData.noticeId"
        :readonly="!isEditable"
        :stock-mode="isStock"
      />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
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
        @click="handleSubmitReceipt"
      >
        {{ submitLoading ? '提交中...' : '提交' }}
      </view>
      <view
        v-if="isStock"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="stockLoading ? 'opacity-60' : ''"
        @click="handleStockReceipt"
      >
        {{ stockLoading ? '上架中...' : '执行上架' }}
      </view>
      <view
        v-if="isFinish"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="finishLoading ? 'opacity-60' : ''"
        @click="handleFinishReceipt"
      >
        {{ finishLoading ? '入库中...' : '执行入库' }}
      </view>
    </MesFooterActions>

    <VendorSelector ref="vendorSelectorRef" @confirm="handleVendorConfirm" />
    <ArrivalNoticeSelector
      ref="noticeSelectorRef"
      :status="MesWmArrivalNoticeStatusEnum.PENDING_RECEIPT"
      @confirm="handleNoticeConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdVendorVO } from '@/api/mes/md/vendor'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import type { WmArrivalNoticeVO } from '@/api/mes/wm/arrivalnotice'
import type { WmItemReceiptCreateReqVO } from '@/api/mes/wm/itemreceipt'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getArrivalNotice } from '@/api/mes/wm/arrivalnotice'
import { createItemReceipt, finishItemReceipt, getItemReceipt, stockItemReceipt, submitItemReceipt, updateItemReceipt } from '@/api/mes/wm/itemreceipt'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmArrivalNoticeStatusEnum, MesWmItemReceiptStatusEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import VendorSelector from '../../../md/vendor/components/vendor-selector.vue'
import ArrivalNoticeSelector from '../../arrivalnotice/components/arrival-notice-selector.vue'
import ItemReceiptLineList from '../components/item-receipt-line-list.vue'

interface WmItemReceiptFormData extends WmItemReceiptCreateReqVO {
  id?: number
  iqcCode?: string
  noticeCode?: string
  status?: number
}

const props = defineProps<{
  id?: number | string
  noticeId?: number | string
  mode?: 'stock' | 'finish' | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/wm/itemreceipt/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const routeNoticeId = computed(() => getRouteQueryNumber('noticeId')) // 路由到货通知编号
const routeMode = computed(() => String(getRouteQueryValue('mode') || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentNoticeId = ref<number>() // 当前到货通知编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'stock') {
    return '执行上架'
  }
  if (currentMode.value === 'finish') {
    return '执行入库'
  }
  return currentId.value ? '编辑采购入库' : '新增采购入库'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const stockLoading = ref(false) // 上架状态
const finishLoading = ref(false) // 入库状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmItemReceiptFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '入库单编号不能为空' }],
  name: [{ required: true, message: '入库单名称不能为空' }],
  vendorId: [{ required: true, message: '供应商不能为空' }],
  receiptDate: [{ required: true, message: '入库日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器引用
const noticeSelectorRef = ref<InstanceType<typeof ArrivalNoticeSelector>>() // 到货通知选择器引用
const selectedVendor = ref<MdVendorVO>() // 当前选择供应商
const selectedNotice = ref<WmArrivalNoticeVO>() // 当前选择到货通知
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isEditable = computed(() => !currentMode.value || currentMode.value === 'update')
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmItemReceiptStatusEnum.APPROVING)
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmItemReceiptStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => isStock.value || isFinish.value)
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmItemReceiptStatusEnum.PREPARE
))
const selectedVendorText = computed(() => {
  return selectedVendor.value
    ? `${selectedVendor.value.code || '-'} ${selectedVendor.value.name || ''}`.trim()
    : ''
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
    iqcId: undefined,
    iqcCode: '',
    noticeId: undefined,
    noticeCode: '',
    vendorId: undefined,
    receiptDate: undefined,
    purchaseOrderCode: '',
    status: undefined,
    remark: '',
  } as WmItemReceiptFormData
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/itemreceipt/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getItemReceipt(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name || '',
    iqcId: data.iqcId,
    iqcCode: data.iqcCode || '',
    noticeId: data.noticeId,
    noticeCode: data.noticeCode || '',
    vendorId: data.vendorId,
    receiptDate: data.receiptDate,
    purchaseOrderCode: data.purchaseOrderCode || '',
    status: data.status,
    remark: data.remark || '',
  }
  selectedNotice.value = data.noticeId
    ? {
        id: data.noticeId,
        code: data.noticeCode || '',
        name: '',
        vendorId: data.vendorId || 0,
        vendorName: data.vendorName || '',
        purchaseOrderCode: data.purchaseOrderCode || '',
      } as WmArrivalNoticeVO
    : undefined
  selectedVendor.value = data.vendorId
    ? {
        id: data.vendorId,
        code: '',
        name: data.vendorName || '',
        nickname: null,
        englishName: null,
        description: null,
        logo: null,
        level: null,
        score: null,
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
}

/** 按到货通知预填新增表单 */
async function loadNoticePreset() {
  if (!currentNoticeId.value || currentId.value) {
    return
  }
  const notice = await getArrivalNotice(currentNoticeId.value)
  handleNoticeConfirm(notice)
  if (!formData.value.name) {
    formData.value.name = notice.name || notice.code || ''
  }
  if (!formData.value.receiptDate) {
    formData.value.receiptDate = notice.arrivalDate
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
    selectedVendor.value = undefined
    selectedNotice.value = undefined
    await loadNoticePreset()
    return
  }
  if (oldId !== currentId.value || !formData.value.id) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开入库日期选择 */
function openReceiptDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.receiptDate = true
}

/** 打开到货通知选择器 */
function openNoticeSelector() {
  if (isHeaderReadonly.value) {
    return
  }
  noticeSelectorRef.value?.open()
}

/** 打开供应商选择器 */
function openVendorSelector() {
  if (isHeaderReadonly.value) {
    return
  }
  vendorSelectorRef.value?.open()
}

/** 确认选择到货通知 */
function handleNoticeConfirm(notice: WmArrivalNoticeVO) {
  selectedNotice.value = notice
  formData.value.noticeId = notice.id
  formData.value.noticeCode = notice.code
  formData.value.vendorId = notice.vendorId
  formData.value.purchaseOrderCode = notice.purchaseOrderCode || formData.value.purchaseOrderCode
  selectedVendor.value = notice.vendorId
    ? {
        id: notice.vendorId,
        code: notice.vendorCode || '',
        name: notice.vendorName || '',
        nickname: null,
        englishName: null,
        description: null,
        logo: null,
        level: null,
        score: null,
        address: null,
        website: null,
        email: null,
        telephone: notice.contactTelephone || null,
        contact1Name: notice.contactName || null,
        contact1Telephone: notice.contactTelephone || null,
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
}

/** 确认选择供应商 */
function handleVendorConfirm(vendors: MdVendorVO[]) {
  const vendor = vendors[0]
  if (!vendor) {
    return
  }
  selectedVendor.value = vendor
  formData.value.vendorId = vendor.id
}

/** 生成入库单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_ITEM_RECEIPT_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData() {
  const data: WmItemReceiptCreateReqVO = {
    code: formData.value.code,
    name: formData.value.name,
    iqcId: formData.value.iqcId,
    noticeId: formData.value.noticeId,
    vendorId: formData.value.vendorId,
    receiptDate: formData.value.receiptDate,
    purchaseOrderCode: formData.value.purchaseOrderCode || undefined,
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
      await updateItemReceipt({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      const id = await createItemReceipt(data)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmItemReceiptStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:itemreceipt:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交采购入库单 */
async function handleSubmitReceipt() {
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
      msg: '确认提交该采购入库单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateItemReceipt({ ...buildSubmitData(), id: currentId.value })
    await submitItemReceipt(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:itemreceipt:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 执行上架 */
async function handleStockReceipt() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行上架？执行后采购入库单将进入待执行入库状态。',
    })
  } catch {
    return
  }
  stockLoading.value = true
  try {
    await stockItemReceipt(currentId.value)
    toast.success('上架成功')
    uni.$emit('mes:wm:itemreceipt:reload')
    delay(handleBack)
  } finally {
    stockLoading.value = false
  }
}

/** 执行入库 */
async function handleFinishReceipt() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行入库？执行后将更新库存台账。',
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishItemReceipt(currentId.value)
    toast.success('入库成功')
    uni.$emit('mes:wm:itemreceipt:reload')
    delay(handleBack)
  } finally {
    finishLoading.value = false
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
