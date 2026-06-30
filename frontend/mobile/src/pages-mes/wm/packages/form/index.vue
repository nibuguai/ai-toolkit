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
          <wd-form-item title="装箱单编号" title-width="220rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入装箱单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="装箱日期" title-width="220rpx" prop="packageDate">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openPackageDatePicker">
              <text :class="formatDateTime(formData.packageDate) ? 'text-[#333]' : 'text-[#999]'">
                {{ formatDateTime(formData.packageDate) || '请选择装箱日期' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.packageDate"
            v-model:visible="pickerVisible.packageDate"
            title="请选择装箱日期"
            type="date"
          />
          <wd-form-item title="检查员" title-width="220rpx" prop="inspectorUserId">
            <UserPicker
              v-model="formData.inspectorUserId"
              type="radio"
              placeholder="请选择检查员"
              use-default-slot
              :disabled="isHeaderReadonly"
              @confirm="handleInspectorConfirm"
            >
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx">
                <text :class="inspectorDisplayValue ? 'text-[#333]' : 'text-[#999]'">
                  {{ inspectorDisplayValue || '请选择检查员' }}
                </text>
                <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
              </view>
            </UserPicker>
          </wd-form-item>
          <wd-form-item title="销售订单编号" title-width="220rpx" prop="salesOrderCode">
            <wd-input v-model="formData.salesOrderCode" clearable :disabled="isHeaderReadonly" placeholder="请输入销售订单编号" />
          </wd-form-item>
          <wd-form-item title="发票编号" title-width="220rpx" prop="invoiceCode">
            <wd-input v-model="formData.invoiceCode" clearable :disabled="isHeaderReadonly" placeholder="请输入发票编号" />
          </wd-form-item>
          <wd-form-item title="客户" title-width="220rpx" prop="clientId">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click="openClientSelector">
              <text :class="clientDisplayValue ? 'text-[#333]' : 'text-[#999]'">
                {{ clientDisplayValue || '请选择客户' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item
            title="尺寸单位"
            title-width="220rpx"
            prop="sizeUnitId"
            :is-link="!isHeaderReadonly"
            :value="sizeUnitDisplayValue"
            placeholder="请选择尺寸单位"
            @click="openUnitPicker('size')"
          />
          <wd-form-item title="箱长度" title-width="220rpx" prop="length" center>
            <wd-input-number v-model="formData.length" :min="0" :precision="2" :disabled="isHeaderReadonly" />
          </wd-form-item>
          <wd-form-item title="箱宽度" title-width="220rpx" prop="width" center>
            <wd-input-number v-model="formData.width" :min="0" :precision="2" :disabled="isHeaderReadonly" />
          </wd-form-item>
          <wd-form-item title="箱高度" title-width="220rpx" prop="height" center>
            <wd-input-number v-model="formData.height" :min="0" :precision="2" :disabled="isHeaderReadonly" />
          </wd-form-item>
          <wd-form-item
            title="重量单位"
            title-width="220rpx"
            prop="weightUnitId"
            :is-link="!isHeaderReadonly"
            :value="weightUnitDisplayValue"
            placeholder="请选择重量单位"
            @click="openUnitPicker('weight')"
          />
          <wd-form-item title="净重" title-width="220rpx" prop="netWeight" center>
            <wd-input-number v-model="formData.netWeight" :min="0" :precision="2" :disabled="isHeaderReadonly" />
          </wd-form-item>
          <wd-form-item title="毛重" title-width="220rpx" prop="grossWeight" center>
            <wd-input-number v-model="formData.grossWeight" :min="0" :precision="2" :disabled="isHeaderReadonly" />
          </wd-form-item>
          <wd-form-item v-if="currentId" title="单据状态" title-width="220rpx">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_PACKAGE_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
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

      <view v-if="currentId" class="px-24rpx">
        <SubPackageList :package-id="currentId" :editable="isEditable" />
        <PackageLineList :package-id="currentId" :editable="isEditable" />
      </view>
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx text-26rpx text-[#8c8c8c] leading-40rpx">
        请先保存装箱单主表，保存后可继续维护子箱和装箱清单。
      </view>
      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        完成后装箱单将不可编辑；H5 验证仅打开确认框并取消，不确认真实完成。
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions v-if="hasFooterActions" content-class="flex gap-24rpx text-28rpx">
      <view
        v-if="isEditable"
        class="flex-1 rounded-8rpx bg-[#1677ff] py-20rpx text-center text-white"
        :class="formLoading ? 'opacity-60' : ''"
        @click="handleSubmit"
      >
        {{ formLoading ? '保存中...' : '保存' }}
      </view>
      <view
        v-if="canFinish"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="finishLoading ? 'opacity-60' : ''"
        @click="handleFinishPackage"
      >
        {{ finishLoading ? '完成中...' : '完成' }}
      </view>
    </MesFooterActions>

    <ClientSelector ref="clientSelectorRef" :multiple="false" @confirm="handleClientConfirm" />
    <wd-picker
      v-model:visible="unitPickerVisible"
      :model-value="unitPickerValue"
      :columns="unitMeasureOptions"
      label-key="name"
      value-key="id"
      title="选择计量单位"
      @confirm="handleUnitConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MdClientVO } from '@/api/mes/md/client'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import type { MdUnitMeasureVO } from '@/api/mes/md/unitmeasure'
import type { WmPackageCreateReqVO } from '@/api/mes/wm/packages'
import type { User } from '@/api/system/user'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getUnitMeasureSimpleList } from '@/api/mes/md/unitmeasure'
import { createPackage, finishPackage, getPackage, updatePackage } from '@/api/mes/wm/packages'
import UserPicker from '@/components/system-select/user-picker.vue'
import ClientSelector from '@/pages-mes/md/client/components/client-selector.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmPackageStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import PackageLineList from '../components/package-line-list.vue'
import SubPackageList from '../components/sub-package-list.vue'

interface WmPackageFormData {
  id?: number
  code: string
  packageDate?: string | number | Date
  salesOrderCode?: string
  invoiceCode?: string
  clientId?: number
  clientCode?: string
  clientName?: string
  length?: number
  width?: number
  height?: number
  sizeUnitId?: number
  sizeUnitName?: string
  netWeight?: number
  grossWeight?: number
  weightUnitId?: number
  weightUnitName?: string
  inspectorUserId?: number
  inspectorName?: string
  status?: number
  remark?: string
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
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/wm/packages/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const routeMode = computed(() => String(getRouteQueryValue('mode') || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'finish') {
    return '完成装箱单'
  }
  return currentId.value ? '编辑装箱单' : '新增装箱单'
})
const formLoading = ref(false) // 表单提交状态
const finishLoading = ref(false) // 完成状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmPackageFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '装箱单编号不能为空' }],
  packageDate: [{ required: true, message: '装箱日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const clientSelectorRef = ref<InstanceType<typeof ClientSelector>>() // 客户选择器
const unitMeasureOptions = ref<MdUnitMeasureVO[]>([]) // 计量单位选项
const unitPickerVisible = ref(false) // 单位选择器状态
const unitPickerTarget = ref<'size' | 'weight'>('size') // 当前单位字段
const selectedClient = ref<MdClientVO>() // 已选客户
const selectedInspectorText = ref('') // 已选检查员
const isPrepare = computed(() => !currentId.value || formData.value.status === MesWmPackageStatusEnum.PREPARE)
const isFinish = computed(() => currentMode.value === 'finish' && isPrepare.value)
const isEditable = computed(() => isPrepare.value && (!currentMode.value || currentMode.value === 'update'))
const isHeaderReadonly = computed(() => !isEditable.value)
const canFinish = computed(() => {
  return (isEditable.value || isFinish.value)
    && currentId.value
    && formData.value.status === MesWmPackageStatusEnum.PREPARE
})
const hasFooterActions = computed(() => isEditable.value || canFinish.value)
const clientDisplayValue = computed(() => {
  if (selectedClient.value) {
    return `${selectedClient.value.code || '-'} / ${selectedClient.value.name || '-'}`
  }
  const code = formData.value.clientCode || ''
  const name = formData.value.clientName || ''
  return [code, name].filter(Boolean).join(' / ')
})
const inspectorDisplayValue = computed(() => selectedInspectorText.value || formData.value.inspectorName || '')
const sizeUnitDisplayValue = computed(() => getWotPickerFormValue(unitMeasureOptions.value, formData.value.sizeUnitId, { valueKey: 'id', labelKey: 'name' }))
const weightUnitDisplayValue = computed(() => getWotPickerFormValue(unitMeasureOptions.value, formData.value.weightUnitId, { valueKey: 'id', labelKey: 'name' }))
const unitPickerValue = computed(() => {
  const id = unitPickerTarget.value === 'size' ? formData.value.sizeUnitId : formData.value.weightUnitId
  return id === undefined ? [] : [id]
})

/** 默认表单数据 */
function getDefaultFormData(): WmPackageFormData {
  return {
    code: '',
    packageDate: '',
    salesOrderCode: '',
    invoiceCode: '',
    clientId: undefined,
    length: undefined,
    width: undefined,
    height: undefined,
    sizeUnitId: undefined,
    netWeight: undefined,
    grossWeight: undefined,
    weightUnitId: undefined,
    inspectorUserId: undefined,
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
  navigateBackPlus('/pages-mes/wm/packages/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getPackage(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code || '',
    packageDate: data.packageDate || '',
    salesOrderCode: data.salesOrderCode || '',
    invoiceCode: data.invoiceCode || '',
    clientId: data.clientId,
    clientCode: data.clientCode || '',
    clientName: data.clientName || '',
    length: data.length,
    width: data.width,
    height: data.height,
    sizeUnitId: data.sizeUnitId,
    sizeUnitName: data.sizeUnitName || '',
    netWeight: data.netWeight,
    grossWeight: data.grossWeight,
    weightUnitId: data.weightUnitId,
    weightUnitName: data.weightUnitName || '',
    inspectorUserId: data.inspectorUserId,
    inspectorName: data.inspectorName || '',
    status: data.status,
    remark: data.remark || '',
  }
  selectedClient.value = undefined
  selectedInspectorText.value = ''
}

/** 初始化页面数据 */
async function initPage() {
  const oldId = currentId.value
  refreshRouteState()
  if (!currentId.value) {
    formData.value = getDefaultFormData()
    selectedClient.value = undefined
    selectedInspectorText.value = ''
    return
  }
  if (oldId !== currentId.value || !formData.value.id) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 打开装箱日期选择 */
function openPackageDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.packageDate = true
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

/** 确认选择检查员 */
function handleInspectorConfirm(users: User[]) {
  selectedInspectorText.value = users[0]?.nickname || ''
}

/** 打开单位选择器 */
function openUnitPicker(target: 'size' | 'weight') {
  if (isHeaderReadonly.value) {
    return
  }
  unitPickerTarget.value = target
  unitPickerVisible.value = true
}

/** 确认选择单位 */
function handleUnitConfirm({ value }: { value: number[] }) {
  const unitId = value[0]
  if (unitPickerTarget.value === 'size') {
    formData.value.sizeUnitId = unitId
    formData.value.sizeUnitName = unitMeasureOptions.value.find(item => item.id === unitId)?.name || ''
  } else {
    formData.value.weightUnitId = unitId
    formData.value.weightUnitName = unitMeasureOptions.value.find(item => item.id === unitId)?.name || ''
  }
}

/** 生成装箱单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_PACKAGE_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData(): WmPackageCreateReqVO {
  if (!formData.value.packageDate) {
    throw new Error('装箱日期不能为空')
  }
  return {
    code: formData.value.code,
    packageDate: formData.value.packageDate,
    salesOrderCode: formData.value.salesOrderCode || undefined,
    invoiceCode: formData.value.invoiceCode || undefined,
    clientId: formData.value.clientId,
    length: formData.value.length,
    width: formData.value.width,
    height: formData.value.height,
    sizeUnitId: formData.value.sizeUnitId,
    netWeight: formData.value.netWeight,
    grossWeight: formData.value.grossWeight,
    weightUnitId: formData.value.weightUnitId,
    inspectorUserId: formData.value.inspectorUserId,
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
      await updatePackage({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      const id = await createPackage(data)
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmPackageStatusEnum.PREPARE
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:packages:reload')
    await getDetail()
  } finally {
    formLoading.value = false
  }
}

/** 完成装箱单 */
async function handleFinishPackage() {
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
      msg: '确认完成该装箱单？完成后将不可编辑。',
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    if (isEditable.value) {
      await updatePackage({ ...buildSubmitData(), id: currentId.value })
    }
    await finishPackage(currentId.value)
    toast.success('完成成功')
    await getDetail()
    uni.$emit('mes:wm:packages:reload')
  } finally {
    finishLoading.value = false
  }
}

/** 加载单位选项 */
async function loadUnitOptions() {
  unitMeasureOptions.value = await getUnitMeasureSimpleList()
}

/** 初始化 */
onMounted(() => {
  loadUnitOptions()
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
