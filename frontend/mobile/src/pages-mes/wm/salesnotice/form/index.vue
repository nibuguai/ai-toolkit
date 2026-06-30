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
                :disabled="isHeaderReadonly"
                placeholder="请输入通知单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="通知单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入通知单名称" />
          </wd-form-item>
          <wd-form-item title="销售订单编号" title-width="200rpx" prop="salesOrderCode">
            <wd-input v-model="formData.salesOrderCode" clearable :disabled="isHeaderReadonly" placeholder="请输入销售订单编号" />
          </wd-form-item>
          <wd-form-item title="客户" title-width="200rpx" prop="clientId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openClientSelector">
              <text :class="selectedClientText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedClientText || '请选择客户' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item
            title="发货日期"
            title-width="200rpx"
            prop="salesDate"
            is-link
            placeholder="请选择发货日期"
            :value="formatDateTime(formData.salesDate)"
            @click="openSalesDatePicker"
          />
          <wd-datetime-picker
            v-model="formData.salesDate"
            v-model:visible="pickerVisible.salesDate"
            title="请选择发货日期"
            type="datetime"
          />
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx" prop="status">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_SALES_NOTICE_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="收货人" title-width="200rpx" prop="recipientName">
            <wd-input v-model="formData.recipientName" clearable :disabled="isHeaderReadonly" placeholder="请输入收货人" />
          </wd-form-item>
          <wd-form-item title="联系方式" title-width="200rpx" prop="recipientTelephone">
            <wd-input v-model="formData.recipientTelephone" clearable :disabled="isHeaderReadonly" placeholder="请输入联系方式" />
          </wd-form-item>
          <wd-form-item title="收货地址" title-width="200rpx" prop="recipientAddress">
            <wd-input v-model="formData.recipientAddress" clearable :disabled="isHeaderReadonly" placeholder="请输入收货地址" />
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
      <SalesNoticeLineList v-if="currentId" :notice-id="currentId" :readonly="!isEditable" />
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#ad6800]">
        销售出库模块已完成迁移；点击“执行出库”将带入当前发货通知，进入销售出库新增页继续维护出库单和出库物料。
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
        @click="handleSubmitSalesNotice"
      >
        {{ submitLoading ? '提交中...' : '提交' }}
      </view>
      <view
        v-if="isFinish"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        @click="handleFinishSalesNotice"
      >
        执行出库
      </view>
    </MesFooterActions>

    <ClientSelector ref="clientSelectorRef" @confirm="handleClientConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdClientVO } from '@/api/mes/md/client'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import type { WmSalesNoticeCreateReqVO } from '@/api/mes/wm/salesnotice'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createSalesNotice, getSalesNotice, submitSalesNotice, updateSalesNotice } from '@/api/mes/wm/salesnotice'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmSalesNoticeStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ClientSelector from '../../../md/client/components/client-selector.vue'
import SalesNoticeLineList from '../components/sales-notice-line-list.vue'

interface WmSalesNoticeFormData extends WmSalesNoticeCreateReqVO {
  id?: number
  clientCode?: string
  clientName?: string
  status?: number
}

const props = defineProps<{
  id?: number | string
  mode?: 'finish' | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/wm/salesnotice/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const routeMode = computed(() => String(getRouteQueryValue('mode') || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'finish') {
    return '执行出库'
  }
  return currentId.value ? '编辑发货通知' : '新增发货通知'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmSalesNoticeFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '通知单编号不能为空' }],
  name: [{ required: true, message: '通知单名称不能为空' }],
  clientId: [{ required: true, message: '客户不能为空' }],
  salesDate: [{ required: true, message: '发货日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const clientSelectorRef = ref<InstanceType<typeof ClientSelector>>() // 客户选择器引用
const selectedClient = ref<MdClientVO>() // 当前选择客户
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器显示状态
const isEditable = computed(() => {
  if (!currentId.value) {
    return true
  }
  return (!currentMode.value || currentMode.value === 'update')
    && formData.value.status === MesWmSalesNoticeStatusEnum.PREPARE
})
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmSalesNoticeStatusEnum.APPROVED)
const isHeaderReadonly = computed(() => isFinish.value || (Boolean(currentId.value) && !isEditable.value))
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmSalesNoticeStatusEnum.PREPARE
))
const selectedClientText = computed(() => {
  return selectedClient.value
    ? `${selectedClient.value.code || '-'} ${selectedClient.value.name || ''}`.trim()
    : (formData.value.clientName || '')
})

/** 默认表单数据 */
function getDefaultFormData() {
  return {
    code: '',
    name: '',
    salesOrderCode: '',
    clientId: undefined,
    clientCode: '',
    clientName: '',
    salesDate: '',
    recipientName: '',
    recipientTelephone: '',
    recipientAddress: '',
    status: undefined,
    remark: '',
  } as WmSalesNoticeFormData
}

/** 刷新当前路由参数 */
function refreshRouteState() {
  currentId.value = routeId.value
  currentMode.value = routeMode.value
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/salesnotice/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getSalesNotice(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name || '',
    salesOrderCode: data.salesOrderCode || '',
    clientId: data.clientId,
    clientCode: data.clientCode || '',
    clientName: data.clientName || '',
    salesDate: data.salesDate || '',
    recipientName: data.recipientName || '',
    recipientTelephone: data.recipientTelephone || '',
    recipientAddress: data.recipientAddress || '',
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
}

/** 初始化页面数据 */
async function initPage() {
  const oldId = currentId.value
  refreshRouteState()
  if (!currentId.value) {
    formData.value = getDefaultFormData()
    selectedClient.value = undefined
    return
  }
  if (oldId !== currentId.value || !formData.value.id) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开发货日期选择 */
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

/** 生成通知单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_SALES_NOTICE_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData() {
  const data: WmSalesNoticeCreateReqVO = {
    code: formData.value.code,
    name: formData.value.name,
    salesOrderCode: formData.value.salesOrderCode || undefined,
    clientId: formData.value.clientId,
    salesDate: formData.value.salesDate,
    recipientName: formData.value.recipientName || undefined,
    recipientTelephone: formData.value.recipientTelephone || undefined,
    recipientAddress: formData.value.recipientAddress || undefined,
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
      await updateSalesNotice({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      const id = await createSalesNotice(data)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmSalesNoticeStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:salesnotice:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交发货通知单 */
async function handleSubmitSalesNotice() {
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
      msg: '确认提交该发货通知单？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateSalesNotice({ ...buildSubmitData(), id: currentId.value })
    await submitSalesNotice(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:salesnotice:reload')
    await getDetail()
  } finally {
    submitLoading.value = false
  }
}

/** 执行出库 */
function handleFinishSalesNotice() {
  if (!currentId.value) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/wm/productsales/form/index?noticeId=${currentId.value}` })
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
