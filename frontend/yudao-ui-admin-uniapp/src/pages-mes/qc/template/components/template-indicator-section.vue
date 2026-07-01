<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        检测指标项
      </view>
      <wd-button
        v-if="hasAccessByCodes(['mes:qc-template:create'])"
        size="small"
        type="primary"
        variant="plain"
        @click="handleAdd"
      >
        新增
      </wd-button>
    </view>
    <view v-if="loading" class="p-24rpx text-28rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="p-24rpx text-28rpx text-[#999]">
      暂无检测指标项
    </view>
    <view v-else class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-20rpx rounded-12rpx bg-[#f8f9fb] p-20rpx last:mb-0"
      >
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333] font-semibold">
              {{ item.indicatorName || '-' }}
            </view>
            <view class="mt-6rpx truncate text-24rpx text-[#999]">
              {{ item.indicatorCode || '-' }}
            </view>
          </view>
          <dict-tag v-if="item.indicatorType != null" :type="DICT_TYPE.MES_INDICATOR_TYPE" :value="item.indicatorType" />
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">检测工具：</text>{{ item.indicatorTool || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">检测方法：</text>{{ item.checkMethod || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">标准值：</text>{{ formatNumber(item.standardValue) }} {{ item.unitMeasureName || '' }}
        </view>
        <view class="mb-16rpx text-26rpx text-[#666]">
          <text class="text-[#999]">误差范围：</text>{{ formatNumber(item.thresholdMin) }} ~ {{ formatNumber(item.thresholdMax) }}
        </view>
        <view v-if="hasAccessByCodes(['mes:qc-template:update'])" class="flex gap-16rpx">
          <wd-button class="flex-1" size="small" variant="plain" @click="handleEdit(item)">
            编辑
          </wd-button>
          <wd-button class="flex-1" size="small" type="danger" variant="plain" @click="handleDelete(item)">
            删除
          </wd-button>
        </view>
      </view>
    </view>

    <!-- 检测指标项表单 -->
    <wd-popup
      v-model="formVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 88vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <wd-button variant="plain" size="small" @click="formVisible = false">
            取消
          </wd-button>
          <view class="text-32rpx text-[#333] font-semibold">
            {{ editingId ? '编辑检测指标项' : '新增检测指标项' }}
          </view>
          <wd-button size="small" type="primary" :loading="saving" @click="handleSubmit">
            保存
          </wd-button>
        </view>

        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <wd-cell-group border>
              <wd-form-item title="质检指标" title-width="220rpx" prop="indicatorId">
                <view class="w-full" @click="indicatorSelectorRef?.open(formData.indicatorId)">
                  <wd-input :model-value="indicatorDisplay" placeholder="请选择质检指标" readonly />
                </view>
              </wd-form-item>
              <wd-form-item title="标准值" title-width="220rpx" prop="standardValue">
                <wd-input-number v-model="formData.standardValue" :min="-999999999" :max="999999999" :precision="4" />
              </wd-form-item>
              <wd-form-item title="计量单位" title-width="220rpx" prop="unitMeasureId">
                <view class="w-full" @click="unitSelectorRef?.open(formData.unitMeasureId)">
                  <wd-input :model-value="unitDisplay" placeholder="请选择计量单位" readonly />
                </view>
              </wd-form-item>
              <wd-form-item title="误差上限" title-width="220rpx" prop="thresholdMax">
                <wd-input-number v-model="formData.thresholdMax" :min="-999999999" :max="999999999" :precision="4" />
              </wd-form-item>
              <wd-form-item title="误差下限" title-width="220rpx" prop="thresholdMin">
                <wd-input-number v-model="formData.thresholdMin" :min="-999999999" :max="999999999" :precision="4" />
              </wd-form-item>
              <wd-form-item title="检测方法" title-width="220rpx" prop="checkMethod">
                <wd-textarea v-model="formData.checkMethod" placeholder="请输入检测方法" :maxlength="500" show-word-limit clearable />
              </wd-form-item>
              <wd-form-item title="说明图URL" title-width="220rpx" prop="docUrl">
                <wd-input v-model="formData.docUrl" placeholder="请输入说明图URL" clearable />
              </wd-form-item>
              <wd-form-item title="备注" title-width="220rpx" prop="remark">
                <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
          <view class="h-48rpx" />
        </scroll-view>
      </view>
    </wd-popup>

    <QcIndicatorSelector ref="indicatorSelectorRef" @confirm="handleIndicatorConfirm" />
    <UnitMeasureSelector ref="unitSelectorRef" @confirm="handleUnitConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdUnitMeasureVO } from '@/api/mes/md/unitmeasure'
import type { QcIndicatorVO } from '@/api/mes/qc/indicator'
import type {
  QcTemplateIndicatorCreateReqVO,
  QcTemplateIndicatorUpdateReqVO,
  QcTemplateIndicatorVO,
} from '@/api/mes/qc/template/indicator'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createTemplateIndicator,
  deleteTemplateIndicator,
  getTemplateIndicator,
  getTemplateIndicatorPage,
  updateTemplateIndicator,
} from '@/api/mes/qc/template/indicator'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import QcIndicatorSelector from './qc-indicator-selector.vue'
import UnitMeasureSelector from './unit-measure-selector.vue'

const props = defineProps<{ templateId: number }>()

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<QcTemplateIndicatorVO[]>([]) // 检测指标项
const loading = ref(false) // 列表加载状态
const formVisible = ref(false) // 表单弹层状态
const saving = ref(false) // 保存状态
const editingId = ref<number>() // 当前编辑编号
const formRef = ref<FormInstance>() // 表单组件引用
const indicatorSelectorRef = ref<InstanceType<typeof QcIndicatorSelector>>() // 指标选择器
const unitSelectorRef = ref<InstanceType<typeof UnitMeasureSelector>>() // 单位选择器
const selectedIndicator = ref<QcIndicatorVO>() // 当前选择指标
const selectedUnit = ref<MdUnitMeasureVO>() // 当前选择单位
const formData = ref<Partial<QcTemplateIndicatorVO>>({
  templateId: props.templateId,
  indicatorId: undefined,
  checkMethod: '',
  standardValue: undefined,
  unitMeasureId: undefined,
  thresholdMax: undefined,
  thresholdMin: undefined,
  docUrl: '',
  remark: '',
}) // 表单数据

const formSchema = createFormSchema({
  indicatorId: [{ required: true, message: '质检指标不能为空' }],
})

const indicatorDisplay = computed(() => {
  return selectedIndicator.value
    ? `${selectedIndicator.value.name}（${selectedIndicator.value.code}）`
    : formData.value.indicatorName
      ? `${formData.value.indicatorName}（${formData.value.indicatorCode || '-'}）`
      : ''
})

const unitDisplay = computed(() => {
  return selectedUnit.value?.name || formData.value.unitMeasureName || ''
})

/** 加载检测指标项 */
async function loadList() {
  if (!props.templateId) {
    return
  }
  loading.value = true
  try {
    const data = await getTemplateIndicatorPage({
      pageNo: 1,
      pageSize: 100,
      templateId: props.templateId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  editingId.value = undefined
  selectedIndicator.value = undefined
  selectedUnit.value = undefined
  formData.value = {
    templateId: props.templateId,
    indicatorId: undefined,
    checkMethod: '',
    standardValue: undefined,
    unitMeasureId: undefined,
    thresholdMax: undefined,
    thresholdMin: undefined,
    docUrl: '',
    remark: '',
  }
}

/** 新增检测指标项 */
function handleAdd() {
  resetForm()
  formVisible.value = true
}

/** 编辑检测指标项 */
async function handleEdit(item: QcTemplateIndicatorVO) {
  resetForm()
  formVisible.value = true
  const data = await getTemplateIndicator(item.id)
  editingId.value = data.id
  formData.value = { ...data }
}

/** 选择质检指标 */
function handleIndicatorConfirm(item: QcIndicatorVO) {
  selectedIndicator.value = item
  formData.value.indicatorId = item.id
  formData.value.indicatorCode = item.code
  formData.value.indicatorName = item.name
  formData.value.indicatorType = item.type
  formData.value.indicatorTool = item.tool || ''
}

/** 选择计量单位 */
function handleUnitConfirm(item: MdUnitMeasureVO) {
  if (!item.id) {
    return
  }
  selectedUnit.value = item
  formData.value.unitMeasureId = item.id
  formData.value.unitMeasureName = item.name
}

/** 构造提交数据 */
function buildSubmitData(): QcTemplateIndicatorCreateReqVO | QcTemplateIndicatorUpdateReqVO {
  const data = {
    templateId: props.templateId,
    indicatorId: Number(formData.value.indicatorId),
    checkMethod: formData.value.checkMethod || undefined,
    standardValue: formData.value.standardValue,
    unitMeasureId: formData.value.unitMeasureId,
    thresholdMax: formData.value.thresholdMax,
    thresholdMin: formData.value.thresholdMin,
    docUrl: formData.value.docUrl || undefined,
    remark: formData.value.remark || undefined,
  }
  if (editingId.value) {
    return { ...data, id: editingId.value }
  }
  return data
}

/** 提交检测指标项 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  saving.value = true
  try {
    const data = buildSubmitData()
    if (editingId.value) {
      await updateTemplateIndicator(data)
      toast.success('修改成功')
    } else {
      await createTemplateIndicator(data)
      toast.success('新增成功')
    }
    formVisible.value = false
    await loadList()
  } finally {
    saving.value = false
  }
}

/** 删除检测指标项 */
async function handleDelete(item: QcTemplateIndicatorVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除检测指标项「${item.indicatorName || item.indicatorCode || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteTemplateIndicator(item.id)
  toast.success('删除成功')
  await loadList()
}

/** 格式化数值 */
function formatNumber(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return String(value)
}

onMounted(() => {
  loadList()
})

defineExpose({ loadList })
</script>
