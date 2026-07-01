<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="检验单编号" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="检验单名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入检验单名称" clearable />
          </wd-form-item>

          <template v-if="isFromPendingTask">
            <wd-cell title="来源单据类型">
              <dict-tag v-if="formData.sourceDocType != null" :type="DICT_TYPE.MES_QC_SOURCE_DOC_TYPE" :value="formData.sourceDocType" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="来源单据编号" :value="formData.sourceDocCode || '-'" />
          </template>

          <wd-form-item title="供应商" title-width="220rpx" prop="vendorId">
            <view class="w-full py-8rpx text-28rpx" :class="isFromPendingTask ? 'text-[#999]' : 'text-[#333]'" @click="openVendorSelector">
              {{ selectedVendorText || (isFromPendingTask ? '由待检任务带入' : '请选择供应商') }}
            </view>
          </wd-form-item>
          <wd-form-item title="供应商批次" title-width="220rpx" prop="vendorBatch">
            <wd-input v-model="formData.vendorBatch" placeholder="请输入供应商批次号" clearable />
          </wd-form-item>

          <wd-form-item title="产品物料" title-width="220rpx" prop="itemId">
            <view class="w-full py-8rpx text-28rpx" :class="isFromPendingTask || currentId ? 'text-[#999]' : 'text-[#333]'" @click="openItemSelector">
              {{ selectedItemText || (isFromPendingTask || currentId ? '由单据带入' : '请选择产品物料') }}
            </view>
          </wd-form-item>
          <wd-cell v-if="formData.itemSpecification || formData.unitName" title="规格单位" :value="`${formData.itemSpecification || '-'} / ${formData.unitName || '-'}`" />

          <wd-form-item title="接收数量" title-width="220rpx" prop="receivedQuantity" center>
            <wd-input-number v-model="formData.receivedQuantity" :min="0" :precision="2" :disabled="isFromPendingTask" />
          </wd-form-item>
          <wd-form-item title="合格数量" title-width="220rpx" prop="qualifiedQuantity" center>
            <wd-input-number v-model="formData.qualifiedQuantity" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="不合格数量" title-width="220rpx" prop="unqualifiedQuantity" center>
            <wd-input-number v-model="formData.unqualifiedQuantity" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="来料日期" title-width="220rpx" prop="receiveDate">
            <wd-datetime-picker v-model="formData.receiveDate" type="date" placeholder="请选择来料日期" />
          </wd-form-item>
          <UserPicker v-model="formData.inspectorUserId" label="检测人员" label-width="220rpx" prop="inspectorUserId" type="radio" placeholder="请选择检测人员" />
          <wd-form-item title="检测日期" title-width="220rpx" prop="inspectDate">
            <wd-datetime-picker v-model="formData.inspectDate" type="date" placeholder="请选择检测日期" />
          </wd-form-item>
          <wd-form-item title="检测结果" title-width="220rpx" prop="checkResult">
            <wd-radio-group v-model="formData.checkResult" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_CHECK_RESULT)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <view class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#8a5a00]">
        保存时需满足“合格数量 + 不合格数量 = 接收数量”。检验项和检测结果当前为只读展示，维护请进入检验单详情页。
      </view>
      <template v-if="currentId">
        <QcLineSection type="iqc" :order-id="currentId" :qc-type="MesQcTypeEnum.IQC" />
        <QcIndicatorResultSection :qc-id="currentId" :qc-type="MesQcTypeEnum.IQC" />
      </template>
      <view v-else class="mx-24rpx mt-20rpx rounded-12rpx bg-[#f6ffed] p-20rpx text-24rpx text-[#389e0d]">
        新增检验单保存后，可在详情页查看检验项、检测结果和缺陷记录。
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions>
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </MesFooterActions>

    <VendorSelector ref="vendorSelectorRef" title="选择供应商" :multiple="false" @confirm="handleVendorConfirm" />
    <ItemSelector ref="itemSelectorRef" title="选择产品物料" :multiple="false" @confirm="handleItemConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItemVO } from '@/api/mes/md/item'
import type { MdVendorVO } from '@/api/mes/md/vendor'
import type { QcIqcCreateReqVO, QcIqcUpdateReqVO } from '@/api/mes/qc/iqc'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import VendorSelector from '@/pages-mes/md/vendor/components/vendor-selector.vue'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createIqc, getIqc, updateIqc } from '@/api/mes/qc/iqc'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import QcIndicatorResultSection from '../../components/qc-indicator-result-section.vue'
import QcLineSection from '../../components/qc-line-section.vue'

interface QcIqcFormData {
  id?: number
  code: string
  name: string
  sourceDocType?: number
  sourceDocId?: number
  sourceLineId?: number
  sourceDocCode: string
  vendorId?: number
  vendorNickname: string
  vendorBatch: string
  itemId?: number
  itemCode: string
  itemName: string
  itemSpecification: string
  unitName: string
  receivedQuantity?: number
  qualifiedQuantity?: number
  unqualifiedQuantity?: number
  inspectorUserId?: number
  inspectDate?: string
  checkResult?: number
  receiveDate?: string
  remark: string
}

const props = defineProps<{
  id?: number | string
  name?: string
  sourceDocType?: number | string
  sourceDocId?: number | string
  sourceLineId?: number | string
  sourceDocCode?: string
  vendorId?: number | string
  vendorNickname?: string
  itemId?: number | string
  itemCode?: string
  itemName?: string
  itemSpecification?: string
  unitName?: string
  quantity?: number | string
  recordTime?: string
}>()

const MesAutoCodeRuleCode = {
  QC_IQC_CODE: 'QC_IQC_CODE',
} as const
const MesQcTypeEnum = {
  IQC: 1,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/qc/iqc/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑来料检验单（IQC）' : '新增来料检验单（IQC）')
const formLoading = ref(false) // 表单提交状态
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器引用
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const formData = ref<QcIqcFormData>({
  code: '',
  name: '',
  sourceDocCode: '',
  vendorNickname: '',
  vendorBatch: '',
  itemCode: '',
  itemName: '',
  itemSpecification: '',
  unitName: '',
  receivedQuantity: 0,
  qualifiedQuantity: 0,
  unqualifiedQuantity: 0,
  inspectDate: '',
  receiveDate: '',
  remark: '',
}) // 表单数据
const isFromPendingTask = computed(() => !currentId.value && formData.value.sourceDocId != null)
const selectedVendorText = computed(() => {
  if (!formData.value.vendorId) {
    return ''
  }
  return `${formData.value.vendorNickname || ''}${formData.value.vendorNickname ? ' / ' : ''}${formData.value.vendorId}`
})
const selectedItemText = computed(() => {
  if (!formData.value.itemId) {
    return ''
  }
  return `${formData.value.itemCode || '-'} / ${formData.value.itemName || '-'}`
})
const formSchema = createFormSchema({
  code: [{ required: true, message: '检验单编号不能为空' }],
  name: [{ required: true, message: '检验单名称不能为空' }],
  vendorId: [{ required: true, message: '供应商不能为空' }],
  itemId: [{ required: true, message: '产品物料不能为空' }],
  receivedQuantity: [
    { required: true, message: '接收数量不能为空' },
    { validator: value => Number(value) >= 0 || '接收数量不能小于 0' },
  ],
  qualifiedQuantity: [
    { required: true, message: '合格数量不能为空' },
    { validator: value => Number(value) >= 0 || '合格数量不能小于 0' },
    { validator: () => validateQuantitySum() },
  ],
  unqualifiedQuantity: [
    { required: true, message: '不合格数量不能为空' },
    { validator: value => Number(value) >= 0 || '不合格数量不能小于 0' },
    { validator: () => validateQuantitySum() },
  ],
  receiveDate: [{ required: true, message: '来料日期不能为空' }],
  inspectorUserId: [{ required: true, message: '检测人员不能为空' }],
  inspectDate: [{ required: true, message: '检测日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 转换数字参数 */
function toNumber(value?: number | string) {
  if (value === undefined || value === '') {
    return undefined
  }
  return Number(value)
}

/** 解码 URL 文本参数 */
function decodeText(value?: string) {
  if (!value) {
    return ''
  }
  let result = value
  for (let i = 0; i < 3 && result.includes('%'); i++) {
    try {
      const decoded = decodeURIComponent(result)
      if (decoded === result) {
        break
      }
      result = decoded
    } catch {
      break
    }
  }
  return result
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/iqc/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getIqc(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code || '',
    name: data.name || '',
    sourceDocType: data.sourceDocType,
    sourceDocId: data.sourceDocId,
    sourceLineId: data.sourceLineId,
    sourceDocCode: data.sourceDocCode || '',
    vendorId: data.vendorId,
    vendorNickname: data.vendorNickname || '',
    vendorBatch: data.vendorBatch || '',
    itemId: data.itemId,
    itemCode: data.itemCode || '',
    itemName: data.itemName || '',
    itemSpecification: data.itemSpecification || '',
    unitName: data.unitName || '',
    receivedQuantity: Number(data.receivedQuantity),
    qualifiedQuantity: Number(data.qualifiedQuantity),
    unqualifiedQuantity: Number(data.unqualifiedQuantity),
    inspectorUserId: data.inspectorUserId,
    inspectDate: normalizeDate(data.inspectDate),
    checkResult: data.checkResult,
    receiveDate: normalizeDate(data.receiveDate),
    remark: data.remark || '',
  }
}

/** 应用待检任务预填 */
function applyPendingInspectPreset() {
  if (currentId.value) {
    return
  }
  formData.value.name = decodeText(getRouteQueryValue('name') as string | undefined) || formData.value.name
  formData.value.sourceDocType = toNumber(getRouteQueryValue('sourceDocType'))
  formData.value.sourceDocId = toNumber(getRouteQueryValue('sourceDocId'))
  formData.value.sourceLineId = toNumber(getRouteQueryValue('sourceLineId'))
  formData.value.sourceDocCode = decodeText(getRouteQueryValue('sourceDocCode') as string | undefined) || formData.value.sourceDocCode
  formData.value.vendorId = toNumber(getRouteQueryValue('vendorId'))
  formData.value.vendorNickname = decodeText(getRouteQueryValue('vendorNickname') as string | undefined) || formData.value.vendorNickname
  formData.value.itemId = toNumber(getRouteQueryValue('itemId'))
  formData.value.itemCode = decodeText(getRouteQueryValue('itemCode') as string | undefined) || formData.value.itemCode
  formData.value.itemName = decodeText(getRouteQueryValue('itemName') as string | undefined) || formData.value.itemName
  formData.value.itemSpecification = decodeText(getRouteQueryValue('itemSpecification') as string | undefined) || formData.value.itemSpecification
  formData.value.unitName = decodeText(getRouteQueryValue('unitName') as string | undefined) || formData.value.unitName
  const receivedQuantity = toNumber(getRouteQueryValue('quantity'))
  if (receivedQuantity !== undefined) {
    formData.value.receivedQuantity = receivedQuantity
  }
  formData.value.receiveDate = normalizeDate(decodeText(getRouteQueryValue('recordTime') as string | undefined))
}

/** 打开供应商选择器 */
function openVendorSelector() {
  if (isFromPendingTask.value) {
    return
  }
  vendorSelectorRef.value?.open()
}

/** 确认供应商 */
function handleVendorConfirm(vendors: MdVendorVO[]) {
  const vendor = vendors[0]
  formData.value.vendorId = vendor?.id
  formData.value.vendorNickname = vendor?.nickname || vendor?.name || ''
}

/** 打开物料选择器 */
function openItemSelector() {
  if (isFromPendingTask.value || currentId.value) {
    return
  }
  itemSelectorRef.value?.open()
}

/** 确认物料 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  formData.value.itemId = item?.id
  formData.value.itemCode = item?.code || ''
  formData.value.itemName = item?.name || ''
  formData.value.itemSpecification = item?.specification || ''
  formData.value.unitName = item?.unitMeasureName || ''
}

/** 生成检验单编号 */
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.QC_IQC_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

/** 日期归一化 */
function normalizeDate(value?: Date | number | string) {
  if (!value) {
    return ''
  }
  const date = dayjs(value)
  return date.isValid() ? date.format('YYYY-MM-DD') : String(value)
}

/** 提交日期格式 */
function toSubmitDate(value?: string) {
  if (!value) {
    return ''
  }
  const date = dayjs(value)
  return date.isValid() ? date.startOf('day').format('YYYY-MM-DD HH:mm:ss') : value
}

/** 校验数量平衡 */
function validateQuantitySum() {
  const received = Number(formData.value.receivedQuantity)
  const qualified = Number(formData.value.qualifiedQuantity)
  const unqualified = Number(formData.value.unqualifiedQuantity)
  if ([received, qualified, unqualified].some(Number.isNaN)) {
    return true
  }
  return Math.abs(qualified + unqualified - received) < 0.000001 || '合格数量与不合格数量之和必须等于接收数量'
}

/** 构造提交数据 */
function buildSubmitData(): QcIqcCreateReqVO | QcIqcUpdateReqVO {
  const data: QcIqcCreateReqVO = {
    code: formData.value.code,
    name: formData.value.name,
    sourceDocType: formData.value.sourceDocType,
    sourceDocId: formData.value.sourceDocId,
    sourceLineId: formData.value.sourceLineId,
    vendorId: Number(formData.value.vendorId),
    vendorBatch: formData.value.vendorBatch || undefined,
    itemId: Number(formData.value.itemId),
    receivedQuantity: Number(formData.value.receivedQuantity),
    qualifiedQuantity: Number(formData.value.qualifiedQuantity),
    unqualifiedQuantity: Number(formData.value.unqualifiedQuantity),
    inspectorUserId: Number(formData.value.inspectorUserId),
    inspectDate: toSubmitDate(formData.value.inspectDate),
    checkResult: formData.value.checkResult,
    receiveDate: toSubmitDate(formData.value.receiveDate),
    remark: formData.value.remark || undefined,
  }
  if (currentId.value) {
    return { ...data, id: currentId.value }
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
      await updateIqc(data)
      toast.success('修改成功')
    } else {
      await createIqc(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:qc:iqc:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  applyPendingInspectPreset()
  getDetail()
})
</script>
