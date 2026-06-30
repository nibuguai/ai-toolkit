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
          <wd-form-item title="通知单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                placeholder="请输入通知单编号"
              />
              <wd-button size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="通知单名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入通知单名称"
            />
          </wd-form-item>
          <wd-form-item title="采购订单" title-width="200rpx" prop="purchaseOrderCode">
            <wd-input
              v-model="formData.purchaseOrderCode"
              clearable
              placeholder="请输入采购订单编号"
            />
          </wd-form-item>
          <wd-form-item title="供应商" title-width="200rpx" prop="vendorId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openVendorSelector">
              <text :class="selectedVendorText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedVendorText || '请选择供应商' }}
              </text>
              <wd-icon name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item
            title="到货日期"
            title-width="200rpx"
            prop="arrivalDate"
            is-link
            placeholder="请选择到货日期"
            :value="formatDate(formData.arrivalDate)"
            @click="pickerVisible.arrivalDate = true"
          />
          <wd-datetime-picker
            v-model="formData.arrivalDate"
            v-model:visible="pickerVisible.arrivalDate"
            title="请选择到货日期"
            type="date"
          />
          <wd-form-item title="联系人" title-width="200rpx" prop="contactName">
            <wd-input
              v-model="formData.contactName"
              clearable
              placeholder="请输入联系人"
            />
          </wd-form-item>
          <wd-form-item title="联系方式" title-width="200rpx" prop="contactTelephone">
            <wd-input
              v-model="formData.contactTelephone"
              clearable
              placeholder="请输入联系方式"
            />
          </wd-form-item>
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_ARRIVAL_NOTICE_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <ArrivalNoticeLineList v-if="currentId" :notice-id="currentId" :readonly="false" />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions content-class="flex gap-24rpx text-28rpx">
      <view
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
        @click="handleSubmitNotice"
      >
        {{ submitLoading ? '提交中...' : '提交' }}
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
import type { WmArrivalNoticeCreateReqVO } from '@/api/mes/wm/arrivalnotice'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createArrivalNotice, getArrivalNotice, submitArrivalNotice, updateArrivalNotice } from '@/api/mes/wm/arrivalnotice'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmArrivalNoticeStatusEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import VendorSelector from '../../../md/vendor/components/vendor-selector.vue'
import ArrivalNoticeLineList from '../components/arrival-notice-line-list.vue'

interface WmArrivalNoticeFormData extends WmArrivalNoticeCreateReqVO {
  id?: number
  status?: number
}

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/arrivalnotice/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const currentId = ref<number>() // 当前编辑编号
const getTitle = computed(() => currentId.value ? '编辑到货通知' : '新增到货通知')
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmArrivalNoticeFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '通知单编号不能为空' }],
  name: [{ required: true, message: '通知单名称不能为空' }],
  vendorId: [{ required: true, message: '供应商不能为空' }],
  arrivalDate: [{ required: true, message: '到货日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器引用
const selectedVendor = ref<MdVendorVO>() // 当前选择供应商
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const canSubmit = computed(() => (
  currentId.value
  && formData.value.status === MesWmArrivalNoticeStatusEnum.PREPARE
))
const selectedVendorText = computed(() => {
  return selectedVendor.value
    ? `${selectedVendor.value.code || '-'} ${selectedVendor.value.name || ''}`.trim()
    : ''
})

/** 默认表单数据 */
function getDefaultFormData() {
  return {
    code: '',
    name: '',
    purchaseOrderCode: '',
    vendorId: undefined,
    arrivalDate: undefined,
    contactName: '',
    contactTelephone: '',
    status: undefined,
    remark: '',
  } as WmArrivalNoticeFormData
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/arrivalnotice/index')
}

/** 刷新当前路由参数 */
function refreshRouteState() {
  currentId.value = routeId.value
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getArrivalNotice(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name,
    purchaseOrderCode: data.purchaseOrderCode || '',
    vendorId: data.vendorId,
    arrivalDate: data.arrivalDate,
    contactName: data.contactName || '',
    contactTelephone: data.contactTelephone || '',
    status: data.status,
    remark: data.remark || '',
  }
  selectedVendor.value = {
    id: data.vendorId,
    code: data.vendorCode || '',
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
    telephone: data.contactTelephone || null,
    contact1Name: data.contactName || null,
    contact1Telephone: data.contactTelephone || null,
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

/** 打开供应商选择器 */
function openVendorSelector() {
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
  formData.value.contactName = vendor.contact1Name || formData.value.contactName
  formData.value.contactTelephone = vendor.contact1Telephone || vendor.telephone || formData.value.contactTelephone
}

/** 生成通知单编号 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_ARRIVAL_NOTICE_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData() {
  const data: WmArrivalNoticeCreateReqVO = {
    code: formData.value.code,
    name: formData.value.name,
    purchaseOrderCode: formData.value.purchaseOrderCode || undefined,
    vendorId: formData.value.vendorId,
    arrivalDate: formData.value.arrivalDate,
    contactName: formData.value.contactName || undefined,
    contactTelephone: formData.value.contactTelephone || undefined,
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
      await updateArrivalNotice({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      await createArrivalNotice(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:arrivalnotice:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 提交到货通知单 */
async function handleSubmitNotice() {
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
      msg: '确认提交该到货通知单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateArrivalNotice({ ...buildSubmitData(), id: currentId.value })
    await submitArrivalNotice(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:arrivalnotice:reload')
    delay(handleBack)
  } finally {
    submitLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})

onShow(() => {
  initPage()
})

watch(routeId, () => {
  initPage()
})
</script>
