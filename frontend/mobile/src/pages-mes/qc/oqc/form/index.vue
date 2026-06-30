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

          <wd-form-item title="客户" title-width="220rpx" prop="clientId">
            <view class="w-full py-8rpx text-28rpx" :class="isFromPendingTask ? 'text-[#999]' : 'text-[#333]'" @click="openClientSelector">
              {{ selectedClientText || (isFromPendingTask ? '由待检任务带入' : '请选择客户') }}
            </view>
          </wd-form-item>
          <wd-form-item title="产品物料" title-width="220rpx" prop="itemId">
            <view class="w-full py-8rpx text-28rpx" :class="isFromPendingTask || currentId ? 'text-[#999]' : 'text-[#333]'" @click="openItemSelector">
              {{ selectedItemText || (isFromPendingTask || currentId ? '由单据带入' : '请选择产品物料') }}
            </view>
          </wd-form-item>
          <wd-cell v-if="formData.itemSpecification || formData.unitName" title="规格单位" :value="`${formData.itemSpecification || '-'} / ${formData.unitName || '-'}`" />
          <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
            <wd-input v-model="formData.batchCode" placeholder="请输入批次号" clearable />
          </wd-form-item>

          <wd-form-item title="发货数量" title-width="220rpx" prop="outQuantity" center>
            <wd-input-number v-model="formData.outQuantity" :min="0" :precision="2" :disabled="isFromPendingTask" />
          </wd-form-item>
          <wd-form-item title="检测数量" title-width="220rpx" prop="checkQuantity" center>
            <wd-input-number v-model="formData.checkQuantity" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="合格数量" title-width="220rpx" prop="qualifiedQuantity" center>
            <wd-input-number v-model="formData.qualifiedQuantity" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="不合格数量" title-width="220rpx" prop="unqualifiedQuantity" center>
            <wd-input-number v-model="formData.unqualifiedQuantity" :min="0" :precision="2" />
          </wd-form-item>
          <UserPicker v-model="formData.inspectorUserId" label="检测人员" label-width="220rpx" prop="inspectorUserId" type="radio" placeholder="请选择检测人员" />
          <wd-form-item title="出货日期" title-width="220rpx" prop="outDate">
            <wd-datetime-picker v-model="formData.outDate" type="date" placeholder="请选择出货日期" />
          </wd-form-item>
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
        保存时需满足“合格数量 + 不合格数量 = 检测数量”。检验项和检测结果当前为只读展示，维护请进入检验单详情页。
      </view>
      <template v-if="currentId">
        <QcLineSection type="oqc" :order-id="currentId" :qc-type="MesQcTypeEnum.OQC" />
        <QcIndicatorResultSection :qc-id="currentId" :qc-type="MesQcTypeEnum.OQC" />
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

    <ClientSelector ref="clientSelectorRef" title="选择客户" :multiple="false" @confirm="handleClientConfirm" />
    <ItemSelector ref="itemSelectorRef" title="选择产品物料" :multiple="false" @confirm="handleItemConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdClientVO } from '@/api/mes/md/client'
import type { MdItemVO } from '@/api/mes/md/item'
import type { QcOqcCreateReqVO, QcOqcUpdateReqVO } from '@/api/mes/qc/oqc'
import ClientSelector from '@/pages-mes/md/client/components/client-selector.vue'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createOqc, getOqc, updateOqc } from '@/api/mes/qc/oqc'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import QcIndicatorResultSection from '../../components/qc-indicator-result-section.vue'
import QcLineSection from '../../components/qc-line-section.vue'

interface QcOqcFormData {
  id?: number
  code: string
  name: string
  sourceDocType?: number
  sourceDocId?: number
  sourceLineId?: number
  sourceDocCode: string
  clientId?: number
  clientNickname: string
  batchCode: string
  itemId?: number
  itemCode: string
  itemName: string
  itemSpecification: string
  unitName: string
  outQuantity?: number
  checkQuantity?: number
  qualifiedQuantity?: number
  unqualifiedQuantity?: number
  inspectorUserId?: number
  outDate?: string
  inspectDate?: string
  checkResult?: number
  remark: string
}

const props = defineProps<{
  id?: number | string
  name?: string
  sourceDocType?: number | string
  sourceDocId?: number | string
  sourceLineId?: number | string
  sourceDocCode?: string
  clientId?: number | string
  clientNickname?: string
  batchCode?: string
  itemId?: number | string
  itemCode?: string
  itemName?: string
  itemSpecification?: string
  unitName?: string
  quantity?: number | string
  recordTime?: string
}>()

const MesAutoCodeRuleCode = {
  QC_OQC_CODE: 'QC_OQC_CODE',
} as const
const MesQcTypeEnum = {
  OQC: 3,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/qc/oqc/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑出货检验单（OQC）' : '新增出货检验单（OQC）')
const formLoading = ref(false) // 表单提交状态
const clientSelectorRef = ref<InstanceType<typeof ClientSelector>>() // 客户选择器引用
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const formData = ref<QcOqcFormData>({
  code: '',
  name: '',
  sourceDocCode: '',
  clientNickname: '',
  batchCode: '',
  itemCode: '',
  itemName: '',
  itemSpecification: '',
  unitName: '',
  outQuantity: 0,
  checkQuantity: 0,
  qualifiedQuantity: 0,
  unqualifiedQuantity: 0,
  outDate: '',
  inspectDate: '',
  remark: '',
}) // 表单数据
const isFromPendingTask = computed(() => !currentId.value && formData.value.sourceDocId != null)
const selectedClientText = computed(() => {
  if (!formData.value.clientId) {
    return ''
  }
  return `${formData.value.clientNickname || ''}${formData.value.clientNickname ? ' / ' : ''}${formData.value.clientId}`
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
  clientId: [{ required: true, message: '客户不能为空' }],
  itemId: [{ required: true, message: '产品物料不能为空' }],
  outQuantity: [
    { required: true, message: '发货数量不能为空' },
    { validator: value => Number(value) >= 0 || '发货数量不能小于 0' },
  ],
  checkQuantity: [
    { required: true, message: '检测数量不能为空' },
    { validator: value => Number(value) >= 0 || '检测数量不能小于 0' },
    { validator: () => validateQuantitySum() },
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
  inspectorUserId: [{ required: true, message: '检测人员不能为空' }],
  outDate: [{ required: true, message: '出货日期不能为空' }],
  inspectDate: [{ required: true, message: '检测日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

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

/** 校验数量合计 */
function validateQuantitySum() {
  const checkQuantity = Number(formData.value.checkQuantity || 0)
  const qualifiedQuantity = Number(formData.value.qualifiedQuantity || 0)
  const unqualifiedQuantity = Number(formData.value.unqualifiedQuantity || 0)
  return checkQuantity === qualifiedQuantity + unqualifiedQuantity || '检测数量必须等于合格数量与不合格数量之和'
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/oqc/index')
}

/** 生成检验单编号 */
async function handleGenerateCode() {
  formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.QC_OQC_CODE)
}

/** 打开客户选择器 */
function openClientSelector() {
  if (isFromPendingTask.value) {
    return
  }
  clientSelectorRef.value?.open()
}

/** 确认客户 */
function handleClientConfirm(clients: MdClientVO[]) {
  const client = clients[0]
  formData.value.clientId = client?.id
  formData.value.clientNickname = client?.nickname || client?.name || ''
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
  formData.value.unitName = item?.unitName || ''
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const detail = await getOqc(currentId.value)
  formData.value = {
    ...formData.value,
    ...detail,
    sourceDocCode: detail.sourceDocCode || '',
    clientNickname: detail.clientNickname || '',
    batchCode: detail.batchCode || '',
    itemCode: detail.itemCode || '',
    itemName: detail.itemName || '',
    itemSpecification: detail.itemSpecification || '',
    unitName: detail.unitName || '',
    outDate: detail.outDate ? String(detail.outDate) : '',
    inspectDate: detail.inspectDate ? String(detail.inspectDate) : '',
    remark: detail.remark || '',
  }
}

/** 应用待检任务预填 */
function applyPendingInspectPreset() {
  if (currentId.value) {
    return
  }
  formData.value.name = decodeText(getRouteQueryValue('name') as string) || formData.value.name
  formData.value.sourceDocType = getRouteQueryNumber('sourceDocType')
  formData.value.sourceDocId = getRouteQueryNumber('sourceDocId')
  formData.value.sourceLineId = getRouteQueryNumber('sourceLineId')
  formData.value.sourceDocCode = decodeText(getRouteQueryValue('sourceDocCode') as string) || formData.value.sourceDocCode
  formData.value.clientId = getRouteQueryNumber('clientId')
  formData.value.clientNickname = decodeText(getRouteQueryValue('clientNickname') as string) || formData.value.clientNickname
  formData.value.batchCode = decodeText(getRouteQueryValue('batchCode') as string) || formData.value.batchCode
  formData.value.itemId = getRouteQueryNumber('itemId')
  formData.value.itemCode = decodeText(getRouteQueryValue('itemCode') as string) || formData.value.itemCode
  formData.value.itemName = decodeText(getRouteQueryValue('itemName') as string) || formData.value.itemName
  formData.value.itemSpecification = decodeText(getRouteQueryValue('itemSpecification') as string) || formData.value.itemSpecification
  formData.value.unitName = decodeText(getRouteQueryValue('unitName') as string) || formData.value.unitName
  formData.value.outQuantity = getRouteQueryNumber('quantity') ?? formData.value.outQuantity
  formData.value.checkQuantity = formData.value.outQuantity
  formData.value.outDate = decodeText(getRouteQueryValue('recordTime') as string) || formData.value.outDate
  formData.value.inspectDate = formData.value.outDate
}

/** 构造提交数据 */
function buildSubmitData(): QcOqcCreateReqVO | QcOqcUpdateReqVO {
  const data: QcOqcCreateReqVO = {
    code: formData.value.code,
    name: formData.value.name,
    sourceDocType: formData.value.sourceDocType,
    sourceDocId: formData.value.sourceDocId,
    sourceLineId: formData.value.sourceLineId,
    clientId: Number(formData.value.clientId),
    batchCode: formData.value.batchCode || undefined,
    itemId: Number(formData.value.itemId),
    outQuantity: Number(formData.value.outQuantity || 0),
    checkQuantity: Number(formData.value.checkQuantity || 0),
    qualifiedQuantity: Number(formData.value.qualifiedQuantity || 0),
    unqualifiedQuantity: Number(formData.value.unqualifiedQuantity || 0),
    inspectorUserId: Number(formData.value.inspectorUserId),
    outDate: dayjs(formData.value.outDate).format('YYYY-MM-DD HH:mm:ss'),
    inspectDate: dayjs(formData.value.inspectDate).format('YYYY-MM-DD HH:mm:ss'),
    checkResult: formData.value.checkResult,
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
      await updateOqc(data as QcOqcUpdateReqVO)
      toast.success('修改成功')
    } else {
      await createOqc(data as QcOqcCreateReqVO)
      toast.success('新增成功')
    }
    uni.$emit('mes:qc:oqc:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

watch(() => formData.value.outQuantity, (value) => {
  if (!currentId.value && formData.value.checkQuantity === 0 && value != null) {
    formData.value.checkQuantity = Number(value)
  }
})

/** 初始化 */
onMounted(() => {
  applyPendingInspectPreset()
  getDetail()
})
</script>
