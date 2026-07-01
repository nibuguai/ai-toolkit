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
          <wd-form-item title="退货单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入退货单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="退货单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入退货单名称" />
          </wd-form-item>
          <wd-form-item title="采购订单号" title-width="200rpx" prop="purchaseOrderCode">
            <wd-input v-model="formData.purchaseOrderCode" clearable :disabled="isHeaderReadonly" placeholder="请输入采购订单号" />
          </wd-form-item>
          <wd-form-item title="供应商" title-width="200rpx" prop="vendorId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openVendorSelector">
              <text :class="selectedVendorText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedVendorText || '请选择供应商' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item
            title="退货日期"
            title-width="200rpx"
            prop="returnDate"
            is-link
            placeholder="请选择退货日期"
            :value="formatDateTime(formData.returnDate)"
            @click="openReturnDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.returnDate"
            v-model:visible="pickerVisible.returnDate"
            title="请选择退货日期"
            type="datetime"
          />
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_RETURN_VENDOR_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="退货原因" title-width="200rpx" prop="returnReason">
            <wd-textarea
              v-model="formData.returnReason"
              placeholder="请输入退货原因"
              :disabled="isHeaderReadonly"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
          <wd-form-item title="运单号" title-width="200rpx" prop="transportCode">
            <wd-input v-model="formData.transportCode" clearable :disabled="isHeaderReadonly" placeholder="请输入运单号" />
          </wd-form-item>
          <wd-form-item title="联系电话" title-width="200rpx" prop="transportTelephone">
            <wd-input v-model="formData.transportTelephone" clearable :disabled="isHeaderReadonly" placeholder="请输入联系电话" />
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
      <ReturnVendorLineList
        v-if="currentId"
        :return-id="currentId"
        :vendor-id="formData.vendorId"
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
        @click="handleSubmitReturnVendor"
      >
        {{ submitLoading ? '提交中...' : '提交' }}
      </view>
      <view
        v-if="isStock"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="stockLoading ? 'opacity-60' : ''"
        @click="handleStockReturnVendor"
      >
        {{ stockLoading ? '拣货中...' : '执行拣货' }}
      </view>
      <view
        v-if="isFinish"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="finishLoading ? 'opacity-60' : ''"
        @click="handleFinishReturnVendor"
      >
        {{ finishLoading ? '退货中...' : '完成退货' }}
      </view>
    </MesFooterActions>

    <VendorSelector ref="vendorSelectorRef" @confirm="handleVendorConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdVendorVO } from '@/api/mes/md/vendor'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import type { WmReturnVendorCreateReqVO } from '@/api/mes/wm/returnvendor'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  checkReturnVendorQuantity,
  createReturnVendor,
  finishReturnVendor,
  getReturnVendor,
  stockReturnVendor,
  submitReturnVendor,
  updateReturnVendor,
} from '@/api/mes/wm/returnvendor'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmReturnVendorStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import VendorSelector from '../../../md/vendor/components/vendor-selector.vue'
import ReturnVendorLineList from '../components/return-vendor-line-list.vue'

interface WmReturnVendorFormData extends WmReturnVendorCreateReqVO {
  id?: number
  vendorCode?: string
  vendorName?: string
  vendorNickname?: string
  status?: number
}

const props = defineProps<{
  id?: number | string
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
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/wm/returnvendor/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const routeMode = computed(() => String(getRouteQueryValue('mode') || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'stock') {
    return '执行拣货'
  }
  if (currentMode.value === 'finish') {
    return '完成退货'
  }
  return currentId.value ? '编辑采购退货' : '新增采购退货'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const stockLoading = ref(false) // 拣货状态
const finishLoading = ref(false) // 退货状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmReturnVendorFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '退货单编号不能为空' }],
  name: [{ required: true, message: '退货单名称不能为空' }],
  vendorId: [{ required: true, message: '供应商不能为空' }],
  returnDate: [{ required: true, message: '退货日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器引用
const selectedVendor = ref<MdVendorVO>() // 当前选择供应商
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isEditable = computed(() => {
  if (!currentId.value) {
    return true
  }
  return (!currentMode.value || currentMode.value === 'update')
    && formData.value.status === MesWmReturnVendorStatusEnum.PREPARE
})
const isStock = computed(() => currentMode.value === 'stock' && formData.value.status === MesWmReturnVendorStatusEnum.APPROVING)
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmReturnVendorStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => isStock.value || isFinish.value || (Boolean(currentId.value) && !isEditable.value))
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmReturnVendorStatusEnum.PREPARE
))
const selectedVendorText = computed(() => {
  return selectedVendor.value
    ? `${selectedVendor.value.code || '-'} ${selectedVendor.value.name || ''}`.trim()
    : (formData.value.vendorName || '')
})

/** 默认表单数据 */
function getDefaultFormData() {
  return {
    code: '',
    name: '',
    purchaseOrderCode: '',
    vendorId: undefined,
    vendorCode: '',
    vendorName: '',
    vendorNickname: '',
    returnDate: '',
    returnReason: '',
    transportCode: '',
    transportTelephone: '',
    status: undefined,
    remark: '',
  } as WmReturnVendorFormData
}

/** 刷新当前路由参数 */
function refreshRouteState() {
  currentId.value = routeId.value
  currentMode.value = routeMode.value
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/returnvendor/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getReturnVendor(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name || '',
    purchaseOrderCode: data.purchaseOrderCode || '',
    vendorId: data.vendorId,
    vendorCode: data.vendorCode || '',
    vendorName: data.vendorName || '',
    vendorNickname: data.vendorNickname || '',
    returnDate: data.returnDate,
    returnReason: data.returnReason || '',
    transportCode: data.transportCode || '',
    transportTelephone: data.transportTelephone || '',
    status: data.status,
    remark: data.remark || '',
  }
  selectedVendor.value = data.vendorId
    ? {
        id: data.vendorId,
        code: data.vendorCode || '',
        name: data.vendorName || '',
        nickname: data.vendorNickname || null,
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

/** 初始化页面数据 */
async function initPage() {
  const oldId = currentId.value
  refreshRouteState()
  if (!currentId.value) {
    formData.value = getDefaultFormData()
    selectedVendor.value = undefined
    return
  }
  if (oldId !== currentId.value || !formData.value.id) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开退货日期选择 */
function openReturnDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.returnDate = true
}

/** 打开供应商选择器 */
function openVendorSelector() {
  if (isHeaderReadonly.value) {
    return
  }
  vendorSelectorRef.value?.open()
}

/** 确认选择供应商 */
function handleVendorConfirm(vendors: MdVendorVO[]) {
  const vendor = vendors[0]
  if (!vendor) {
    return
  }
  selectedVendor.value = vendor
  formData.value.vendorId = vendor.id
  formData.value.vendorCode = vendor.code
  formData.value.vendorName = vendor.name
  formData.value.vendorNickname = vendor.nickname || ''
}

/** 生成退货单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_RETURN_VENDOR_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData() {
  const data: WmReturnVendorCreateReqVO = {
    code: formData.value.code,
    name: formData.value.name,
    purchaseOrderCode: formData.value.purchaseOrderCode || undefined,
    vendorId: formData.value.vendorId,
    returnDate: formData.value.returnDate,
    returnReason: formData.value.returnReason || undefined,
    transportCode: formData.value.transportCode || undefined,
    transportTelephone: formData.value.transportTelephone || undefined,
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
      await updateReturnVendor({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      const id = await createReturnVendor(data)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmReturnVendorStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:returnvendor:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交供应商退货单 */
async function handleSubmitReturnVendor() {
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
      msg: '确认提交该退货单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateReturnVendor({ ...buildSubmitData(), id: currentId.value })
    await submitReturnVendor(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:returnvendor:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 执行拣货 */
async function handleStockReturnVendor() {
  if (!currentId.value) {
    return
  }
  stockLoading.value = true
  try {
    const quantityMatch = await checkReturnVendorQuantity(currentId.value)
    if (!quantityMatch) {
      await dialog.confirm({
        title: '提示',
        msg: '退货数量与拣货数量不一致，确认执行拣货？',
      })
    } else {
      await dialog.confirm({
        title: '提示',
        msg: '确认执行拣货？执行后供应商退货单将进入待执行退货状态。',
      })
    }
    await stockReturnVendor(currentId.value)
    toast.success('拣货成功')
    uni.$emit('mes:wm:returnvendor:reload')
    delay(handleBack)
  } catch {
  } finally {
    stockLoading.value = false
  }
}

/** 完成退货 */
async function handleFinishReturnVendor() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认完成该退货单并执行退货？',
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishReturnVendor(currentId.value)
    toast.success('完成成功')
    uni.$emit('mes:wm:returnvendor:reload')
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

watch([routeId, routeMode], () => {
  initPage()
})
</script>
