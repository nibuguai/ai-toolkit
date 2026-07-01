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
          <wd-form-item title="转移单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入转移单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="转移单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入转移单名称" />
          </wd-form-item>
          <wd-form-item title="转移单类型" title-width="200rpx" prop="type">
            <wd-radio-group v-model="formData.type" :disabled="isHeaderReadonly" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_TRANSFER_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="转移日期" title-width="200rpx" prop="transferDate">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openTransferDatePicker">
              <text :class="formatDateTime(formData.transferDate) ? 'text-[#333]' : 'text-[#999]'">
                {{ formatDateTime(formData.transferDate) || '请选择转移日期' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.transferDate"
            v-model:visible="pickerVisible.transferDate"
            title="请选择转移日期"
            type="date"
          />
          <wd-form-item v-if="isOuterType" title="是否配送" title-width="200rpx" prop="deliveryFlag" center>
            <wd-switch v-model="formData.deliveryFlag" :disabled="isHeaderReadonly" />
          </wd-form-item>
          <wd-form-item v-if="isOuterType && currentId" title="是否确认" title-width="200rpx" center>
            <wd-switch v-model="formData.confirmFlag" disabled />
          </wd-form-item>
          <wd-form-item v-if="showDeliveryFields" title="收货人" title-width="200rpx" prop="recipientName">
            <wd-input v-model="formData.recipientName" clearable :disabled="isHeaderReadonly" placeholder="请输入收货人" />
          </wd-form-item>
          <wd-form-item v-if="showDeliveryFields" title="联系电话" title-width="200rpx" prop="recipientTelephone">
            <wd-input v-model="formData.recipientTelephone" clearable :disabled="isHeaderReadonly" placeholder="请输入联系电话" />
          </wd-form-item>
          <wd-form-item v-if="showDeliveryFields" title="目的地" title-width="200rpx" prop="destinationAddress">
            <wd-input v-model="formData.destinationAddress" clearable :disabled="isHeaderReadonly" placeholder="请输入目的地" />
          </wd-form-item>
          <wd-form-item v-if="showDeliveryFields" title="承运商" title-width="200rpx" prop="carrier">
            <wd-input v-model="formData.carrier" clearable :disabled="isHeaderReadonly" placeholder="请输入承运商" />
          </wd-form-item>
          <wd-form-item v-if="showDeliveryFields" title="运输单号" title-width="200rpx" prop="shippingNumber">
            <wd-input v-model="formData.shippingNumber" clearable :disabled="isHeaderReadonly" placeholder="请输入运输单号" />
          </wd-form-item>
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_TRANSFER_STATUS" :value="formData.status" />
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

      <transfer-line-list
        v-if="currentId && !detailMissing"
        :transfer-id="currentId"
        :readonly="!isEditable && !isStock"
        :stock-mode="isStock"
      />
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
          调拨物料
        </view>
        <view class="text-26rpx text-[#8c8c8c] leading-40rpx">
          请先保存转移单主表，保存后可继续维护调拨物料和上架明细。
        </view>
      </view>

      <view v-if="isConfirm" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        到货确认后将进入待上架状态；H5 验证仅打开确认框并取消，不确认真实状态流转。
      </view>
      <view v-if="isStock" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#d46b08] leading-42rpx">
        执行上架前需维护完整上架明细；H5 验证仅打开确认框并取消，不确认真实上架。
      </view>
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        执行转移会更新库存台账；H5 验证仅打开确认框并取消，不确认真实转移。
      </view>
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
        @click="handleSubmitTransfer"
      >
        {{ submitLoading ? '提交中...' : '提交' }}
      </view>
      <view
        v-if="isConfirm"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="actionLoading ? 'opacity-60' : ''"
        @click="handleConfirmTransfer"
      >
        {{ actionLoading ? '确认中...' : '到货确认' }}
      </view>
      <view
        v-if="isStock"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="actionLoading ? 'opacity-60' : ''"
        @click="handleStockTransfer"
      >
        {{ actionLoading ? '上架中...' : '执行上架' }}
      </view>
      <view
        v-if="isFinish"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="actionLoading ? 'opacity-60' : ''"
        @click="handleFinishTransfer"
      >
        {{ actionLoading ? '转移中...' : '执行转移' }}
      </view>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { WmTransferCreateReqVO } from '@/api/mes/wm/transfer'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  confirmTransfer,
  createTransfer,
  finishTransfer,
  getTransfer,
  stockTransfer,
  submitTransfer,
  updateTransfer,
} from '@/api/mes/wm/transfer'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import TransferLineList from '@/pages-mes/wm/transfer/components/transfer-line-list.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmTransferStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

interface WmTransferFormData {
  id?: number
  code: string
  name: string
  type?: number
  deliveryFlag: boolean
  recipientName?: string
  recipientTelephone?: string
  destinationAddress?: string
  carrier?: string
  shippingNumber?: string
  confirmFlag?: boolean
  transferDate?: string | number | Date
  status?: number
  remark?: string
}

const props = defineProps<{
  id?: number | string
  mode?: 'confirm' | 'stock' | 'finish' | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/wm/transfer/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const routeMode = computed(() => String(getRouteQueryValue('mode') || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'confirm') {
    return '到货确认'
  }
  if (currentMode.value === 'stock') {
    return '执行上架'
  }
  if (currentMode.value === 'finish') {
    return '执行转移'
  }
  return currentId.value ? '编辑库存调拨' : '新增库存调拨'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const actionLoading = ref(false) // 状态动作状态
const codeLoading = ref(false) // 编码生成状态
const detailMissing = ref(false) // 详情缺失状态
const formData = ref<WmTransferFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '转移单编号不能为空' }],
  name: [{ required: true, message: '转移单名称不能为空' }],
  type: [{ required: true, message: '转移单类型不能为空' }],
  deliveryFlag: [{ required: true, message: '是否配送不能为空' }],
  transferDate: [{ required: true, message: '转移日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const isEditable = computed(() => !currentMode.value || currentMode.value === 'update')
const isConfirm = computed(() => currentMode.value === 'confirm' && formData.value.status === MesWmTransferStatusEnum.UNCONFIRMED)
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmTransferStatusEnum.APPROVING)
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmTransferStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => !!currentMode.value && currentMode.value !== 'update')
const isOuterType = computed(() => Number(formData.value.type) === 2)
const showDeliveryFields = computed(() => isOuterType.value && !!formData.value.deliveryFlag)
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmTransferStatusEnum.PREPARE
))

/** 默认表单数据 */
function getDefaultFormData(): WmTransferFormData {
  return {
    code: '',
    name: '',
    type: undefined,
    deliveryFlag: false,
    recipientName: '',
    recipientTelephone: '',
    destinationAddress: '',
    carrier: '',
    shippingNumber: '',
    confirmFlag: false,
    transferDate: '',
    remark: '',
  }
}

/** 刷新当前路由参数 */
function refreshRouteState() {
  currentId.value = routeId.value
  currentMode.value = routeMode.value
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/transfer/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getTransfer(currentId.value)
  if (!data) {
    detailMissing.value = true
    formData.value = getDefaultFormData()
    toast.warning('库存调拨单不存在或已被删除')
    return
  }
  detailMissing.value = false
  formData.value = {
    id: data.id,
    code: data.code || '',
    name: data.name || '',
    type: data.type,
    deliveryFlag: !!data.deliveryFlag,
    recipientName: data.recipientName || '',
    recipientTelephone: data.recipientTelephone || '',
    destinationAddress: data.destinationAddress || '',
    carrier: data.carrier || '',
    shippingNumber: data.shippingNumber || '',
    confirmFlag: !!data.confirmFlag,
    transferDate: data.transferDate,
    status: data.status,
    remark: data.remark || '',
  }
}

/** 初始化页面数据 */
async function initPage() {
  const oldId = currentId.value
  refreshRouteState()
  if (!currentId.value) {
    detailMissing.value = false
    formData.value = getDefaultFormData()
    return
  }
  if (oldId !== currentId.value || !formData.value.id) {
    detailMissing.value = false
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开转移日期选择 */
function openTransferDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.transferDate = true
}

/** 生成转移单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.TRANSFER_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData(): WmTransferCreateReqVO {
  if (formData.value.type == null || !formData.value.transferDate) {
    throw new Error('转移单类型和转移日期不能为空')
  }
  return {
    code: formData.value.code,
    name: formData.value.name,
    type: formData.value.type,
    deliveryFlag: !!formData.value.deliveryFlag,
    recipientName: showDeliveryFields.value ? formData.value.recipientName || undefined : undefined,
    recipientTelephone: showDeliveryFields.value ? formData.value.recipientTelephone || undefined : undefined,
    destinationAddress: showDeliveryFields.value ? formData.value.destinationAddress || undefined : undefined,
    carrier: showDeliveryFields.value ? formData.value.carrier || undefined : undefined,
    shippingNumber: showDeliveryFields.value ? formData.value.shippingNumber || undefined : undefined,
    transferDate: formData.value.transferDate,
    remark: formData.value.remark || undefined,
  }
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
      await updateTransfer({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      const id = await createTransfer(data)
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmTransferStatusEnum.PREPARE
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:transfer:reload')
    await getDetail()
  } finally {
    formLoading.value = false
  }
}

/** 提交转移单 */
async function handleSubmitTransfer() {
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
      msg: '确认提交该转移单？提交前请确认已维护调拨物料，提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateTransfer({ ...buildSubmitData(), id: currentId.value })
    await submitTransfer(currentId.value)
    toast.success('提交成功')
    await getDetail()
    uni.$emit('mes:wm:transfer:reload')
  } finally {
    submitLoading.value = false
  }
}

/** 到货确认 */
async function handleConfirmTransfer() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认到货后，将进入待上架状态，是否继续？',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await confirmTransfer(currentId.value)
    toast.success('确认成功')
    await getDetail()
    uni.$emit('mes:wm:transfer:reload')
  } finally {
    actionLoading.value = false
  }
}

/** 执行上架 */
async function handleStockTransfer() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行上架？请先确认已维护完整上架明细。',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await stockTransfer(currentId.value)
    toast.success('上架成功')
    await getDetail()
    uni.$emit('mes:wm:transfer:reload')
  } finally {
    actionLoading.value = false
  }
}

/** 执行转移 */
async function handleFinishTransfer() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行调拨？执行后将更新库存台账。',
    })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await finishTransfer(currentId.value)
    toast.success('执行成功')
    await getDetail()
    uni.$emit('mes:wm:transfer:reload')
  } finally {
    actionLoading.value = false
  }
}

watch(
  () => formData.value.type,
  () => {
    if (!isOuterType.value) {
      formData.value.deliveryFlag = false
      formData.value.recipientName = ''
      formData.value.recipientTelephone = ''
      formData.value.destinationAddress = ''
      formData.value.carrier = ''
      formData.value.shippingNumber = ''
    }
  },
)

/** 初始化 */
onMounted(() => {
  initPage()
})

/** 页面显示时刷新 */
onShow(() => {
  initPage()
})

watch([routeId, routeMode], () => {
  initPage()
})
</script>
