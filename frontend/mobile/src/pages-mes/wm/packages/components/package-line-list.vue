<template>
  <MesLineListShell
    title="装箱清单"
    :loading="loading"
    :empty="list.length === 0"
    empty-text="暂无装箱明细"
    :readonly="false"
    :show-add="editable"
    add-text="添加明细"
    content-class="mes-package-line-list__content"
    @add="openLineForm()"
  >
    <view
      v-for="item in list"
      :key="item.id"
      class="mb-20rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
    >
      <view class="p-24rpx">
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-30rpx text-[#333] font-semibold">
              {{ item.itemCode || `明细 #${item.id}` }}
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              {{ item.itemName || '-' }}
            </view>
          </view>
          <view class="shrink-0 text-26rpx text-[#1677ff]">
            {{ item.quantity ?? '-' }} {{ item.unitMeasureName || '' }}
          </view>
        </view>
        <view class="mb-10rpx text-26rpx text-[#666]">
          <text class="text-[#999]">规格：</text>{{ item.specification || '-' }}
        </view>
        <view class="mb-10rpx text-26rpx text-[#666]">
          <text class="text-[#999]">生产工单：</text>{{ item.workOrderCode || '-' }}
        </view>
        <view class="mb-10rpx text-26rpx text-[#666]">
          <text class="text-[#999]">批次号：</text>{{ item.batchCode || '-' }}
        </view>
        <view class="mb-10rpx text-26rpx text-[#666]">
          <text class="text-[#999]">有效期：</text>{{ formatDateTime(item.expireDate) || '-' }}
        </view>
        <view class="text-26rpx text-[#666]">
          <text class="text-[#999]">备注：</text>{{ item.remark || '-' }}
        </view>
      </view>
      <view v-if="editable" class="flex border-t border-t-[#f0f0f0] text-28rpx">
        <view class="flex-1 py-18rpx text-center text-[#1677ff]" @click="openLineForm(item)">
          编辑
        </view>
        <view class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDeleteLine(item)">
          删除
        </view>
      </view>
    </view>
  </MesLineListShell>

  <!-- 明细表单弹窗 -->
  <!-- TODO @YunaiV：本 wd-popup 去掉 transition="fade" :duration="0"，对齐 system/infra（基线不带这俩属性） -->
  <wd-popup
    v-model="lineFormVisible"
    position="top"
    transition="fade"
    :duration="0"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="lineFormVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ lineFormTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="lineFormLoading" @click="handleSubmitLine">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="lineFormRef" :model="lineFormData" :schema="lineFormSchema">
          <wd-cell-group border>
            <wd-form-item title="生产工单" title-width="220rpx" prop="workOrderId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click="openWorkOrderSelector">
                <text :class="workOrderDisplayValue ? 'text-[#333]' : 'text-[#999]'">
                  {{ workOrderDisplayValue || '请选择已确认工单' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="产品物料" title-width="220rpx" prop="itemId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click="openItemSelector">
                <text :class="itemDisplayValue ? 'text-[#333]' : 'text-[#999]'">
                  {{ itemDisplayValue || '请选择产品物料' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="装箱数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="lineFormData.quantity" :min="0.01" :precision="2" />
            </wd-form-item>
            <wd-form-item title="有效期" title-width="220rpx" prop="expireDate">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="expirePickerVisible = true">
                <text :class="formatDateTime(lineFormData.expireDate) ? 'text-[#333]' : 'text-[#999]'">
                  {{ formatDateTime(lineFormData.expireDate) || '请选择有效期' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx">
              <text>{{ lineFormData.batchCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="规格型号" title-width="220rpx">
              <text>{{ lineFormData.specification || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="单位" title-width="220rpx">
              <text>{{ lineFormData.unitMeasureName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea
                v-model="lineFormData.remark"
                placeholder="请输入备注"
                :maxlength="200"
                show-word-limit
                clearable
              />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <wd-datetime-picker
    v-model="lineFormData.expireDate"
    v-model:visible="expirePickerVisible"
    title="请选择有效期"
    type="date"
  />
  <WorkOrderSelector ref="workOrderSelectorRef" @confirm="handleWorkOrderConfirm" />
  <ItemSelector ref="itemSelectorRef" :multiple="false" title="选择产品物料" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
import type { MdItemVO } from '@/api/mes/md/item'
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import type {
  WmPackageLineCreateReqVO,
  WmPackageLineVO,
} from '@/api/mes/wm/packages/line'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import {
  createPackageLine,
  deletePackageLine,
  getPackageLine,
  getPackageLinePage,
  updatePackageLine,
} from '@/api/mes/wm/packages/line'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import MesLineListShell from '@/pages-mes/components/mes-line-list-shell.vue'
import ItemSelector from '../../../md/item/components/item-selector.vue'
import WorkOrderSelector from '../../../pro/card/components/workorder-selector.vue'

interface WmPackageLineFormData extends Partial<WmPackageLineCreateReqVO> {
  id?: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitMeasureName?: string
  workOrderCode?: string
  batchCode?: string
}

const props = withDefaults(defineProps<{
  packageId?: number
  editable?: boolean
}>(), {
  packageId: undefined,
  editable: false,
})

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<WmPackageLineVO[]>([]) // 装箱明细列表
const lineFormVisible = ref(false) // 明细表单显示
const lineFormLoading = ref(false) // 明细提交状态
const lineFormRef = ref<FormInstance>() // 明细表单引用
const lineFormData = ref<WmPackageLineFormData>(getDefaultLineFormData()) // 明细表单数据
const expirePickerVisible = ref(false) // 有效期选择器
const workOrderSelectorRef = ref<InstanceType<typeof WorkOrderSelector>>() // 工单选择器
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器
const selectedWorkOrder = ref<ProWorkOrderVO>() // 当前选择工单
const selectedItem = ref<MdItemVO>() // 当前选择物料
const lineFormTitle = computed(() => lineFormData.value.id ? '编辑装箱明细' : '添加装箱明细')
const workOrderDisplayValue = computed(() => {
  if (selectedWorkOrder.value) {
    return `${selectedWorkOrder.value.code || '-'} / ${selectedWorkOrder.value.name || '-'}`
  }
  return lineFormData.value.workOrderCode || ''
})
const itemDisplayValue = computed(() => {
  if (selectedItem.value) {
    return `${selectedItem.value.code || '-'} / ${selectedItem.value.name || '-'}`
  }
  const code = lineFormData.value.itemCode || ''
  const name = lineFormData.value.itemName || ''
  return [code, name].filter(Boolean).join(' / ')
})
const lineFormSchema = createFormSchema({
  workOrderId: [{ required: true, message: '生产工单不能为空' }],
  itemId: [{ required: true, message: '产品物料不能为空' }],
  quantity: [
    { required: true, message: '装箱数量不能为空' },
    { validator: value => Number(value) > 0 || '装箱数量必须大于 0' },
  ],
})

/** 默认明细表单数据 */
function getDefaultLineFormData(): WmPackageLineFormData {
  return {
    packageId: props.packageId,
    itemId: undefined,
    quantity: undefined,
    workOrderId: undefined,
    expireDate: undefined,
    remark: '',
  }
}

/** 查询装箱明细 */
async function getList() {
  if (!props.packageId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getPackageLinePage({
      pageNo: 1,
      pageSize: 100,
      packageId: props.packageId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 打开明细表单 */
async function openLineForm(item?: WmPackageLineVO) {
  lineFormVisible.value = true
  selectedWorkOrder.value = undefined
  selectedItem.value = undefined
  lineFormData.value = getDefaultLineFormData()
  if (!item?.id) {
    return
  }
  lineFormLoading.value = true
  try {
    const detail = await getPackageLine(item.id)
    lineFormData.value = {
      id: detail.id,
      packageId: detail.packageId,
      materialStockId: detail.materialStockId,
      itemId: detail.itemId,
      itemCode: detail.itemCode,
      itemName: detail.itemName,
      specification: detail.specification,
      unitMeasureName: detail.unitMeasureName,
      quantity: detail.quantity,
      workOrderId: detail.workOrderId,
      workOrderCode: detail.workOrderCode,
      batchCode: detail.batchCode,
      expireDate: detail.expireDate,
      remark: detail.remark || '',
    }
  } finally {
    lineFormLoading.value = false
  }
}

/** 打开工单选择器 */
function openWorkOrderSelector() {
  workOrderSelectorRef.value?.open(lineFormData.value.workOrderId)
}

/** 确认选择工单 */
function handleWorkOrderConfirm(item: ProWorkOrderVO) {
  selectedWorkOrder.value = item
  lineFormData.value.workOrderId = item.id
  lineFormData.value.workOrderCode = item.code
  lineFormData.value.batchCode = item.batchCode
}

/** 打开物料选择器 */
function openItemSelector() {
  itemSelectorRef.value?.open()
}

/** 确认选择物料 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  selectedItem.value = item
  lineFormData.value.itemId = item.id
  lineFormData.value.itemCode = item.code
  lineFormData.value.itemName = item.name
  lineFormData.value.specification = item.specification
  lineFormData.value.unitMeasureName = item.unitMeasureName
}

/** 构造提交数据 */
function buildSubmitData(): WmPackageLineCreateReqVO {
  if (!props.packageId || !lineFormData.value.itemId || !lineFormData.value.workOrderId || !lineFormData.value.quantity) {
    throw new Error('装箱明细参数不完整')
  }
  return {
    packageId: props.packageId,
    materialStockId: lineFormData.value.materialStockId,
    itemId: lineFormData.value.itemId,
    quantity: lineFormData.value.quantity,
    workOrderId: lineFormData.value.workOrderId,
    expireDate: lineFormData.value.expireDate,
    remark: lineFormData.value.remark || undefined,
  }
}

/** 提交明细 */
async function handleSubmitLine() {
  const result = await lineFormRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  lineFormLoading.value = true
  try {
    const data = buildSubmitData()
    if (lineFormData.value.id) {
      await updatePackageLine({ ...data, id: lineFormData.value.id })
      toast.success('修改成功')
    } else {
      await createPackageLine(data)
      toast.success('新增成功')
    }
    lineFormVisible.value = false
    await getList()
  } finally {
    lineFormLoading.value = false
  }
}

/** 删除明细 */
async function handleDeleteLine(item: WmPackageLineVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除装箱明细「${item.itemCode || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deletePackageLine(item.id)
  toast.success('删除成功')
  await getList()
}

onMounted(getList)

watch(() => props.packageId, getList)

defineExpose({ reload: getList })
</script>

<style lang="scss" scoped>
:deep(.mes-package-line-list__content) {
  background: #f5f5f5;
}
</style>
