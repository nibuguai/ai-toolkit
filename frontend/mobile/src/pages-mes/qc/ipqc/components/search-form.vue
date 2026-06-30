<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          检验单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入检验单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          检验类型
        </view>
        <wd-radio-group v-model="formData.type" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_IPQC_TYPE)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          生产工单
        </view>
        <view class="flex items-center gap-16rpx">
          <wd-input
            :model-value="selectedWorkOrderName"
            placeholder="请选择生产工单"
            clearable
            readonly
            class="min-w-0 flex-1"
            @click="openWorkOrderSelector"
            @clear="clearWorkOrder"
          />
          <wd-button size="small" @click="openWorkOrderSelector">
            选择
          </wd-button>
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          产品物料
        </view>
        <view class="flex items-center gap-16rpx">
          <wd-input
            :model-value="selectedItemName"
            placeholder="请选择产品物料"
            clearable
            readonly
            class="min-w-0 flex-1"
            @click="openItemSelector"
            @clear="clearItem"
          />
          <wd-button size="small" @click="openItemSelector">
            选择
          </wd-button>
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          检测结果
        </view>
        <wd-radio-group v-model="formData.checkResult" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_CHECK_RESULT)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>

  <WorkOrderSelector ref="workOrderSelectorRef" @confirm="handleWorkOrderConfirm" />
  <ItemSelector ref="itemSelectorRef" title="选择产品物料" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——wd-radio-group 状态/类型筛选改 yd-search-picker（配 dict-kind + all-option）；业务选择器（Selector/MesSearchSelectorField）后续评估收敛为 yd-search-picker
import type { MdItemVO } from '@/api/mes/md/item'
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import type { QcIpqcPageParam } from '@/api/mes/qc/ipqc'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import WorkOrderSelector from '@/pages-mes/pro/card/components/workorder-selector.vue'

const emit = defineEmits<{
  search: [data: Partial<QcIpqcPageParam>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const selectedWorkOrderName = ref('') // 已选工单展示名
const selectedItemName = ref('') // 已选物料展示名
const workOrderSelectorRef = ref<InstanceType<typeof WorkOrderSelector>>() // 工单选择器引用
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const formData = reactive({
  code: '',
  type: undefined as number | undefined,
  workOrderId: undefined as number | undefined,
  itemId: undefined as number | undefined,
  checkResult: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.type != null) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_IPQC_TYPE, formData.type) || formData.type}`)
  }
  if (formData.workOrderId != null) {
    conditions.push(`工单:${selectedWorkOrderName.value || formData.workOrderId}`)
  }
  if (formData.itemId != null) {
    conditions.push(`物料:${selectedItemName.value || formData.itemId}`)
  }
  if (formData.checkResult != null) {
    conditions.push(`结果:${getDictLabel(DICT_TYPE.MES_QC_CHECK_RESULT, formData.checkResult) || formData.checkResult}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索过程检验单（IPQC）'
})

/** 打开工单选择器 */
function openWorkOrderSelector() {
  workOrderSelectorRef.value?.open(formData.workOrderId)
}

/** 清空工单 */
function clearWorkOrder() {
  formData.workOrderId = undefined
  selectedWorkOrderName.value = ''
}

/** 确认工单 */
function handleWorkOrderConfirm(workOrder: ProWorkOrderVO) {
  formData.workOrderId = workOrder.id
  selectedWorkOrderName.value = `${workOrder.code || '-'} ${workOrder.name || ''}`.trim()
}

/** 打开物料选择器 */
function openItemSelector() {
  itemSelectorRef.value?.open()
}

/** 清空物料 */
function clearItem() {
  formData.itemId = undefined
  selectedItemName.value = ''
}

/** 确认物料 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  formData.itemId = item?.id
  selectedItemName.value = item ? `${item.code || '-'} ${item.name || ''}`.trim() : ''
}

/** 构造搜索参数 */
function buildParams(): Partial<QcIpqcPageParam> {
  const params: Partial<QcIpqcPageParam> = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.type != null) {
    params.type = formData.type
  }
  if (formData.workOrderId != null) {
    params.workOrderId = formData.workOrderId
  }
  if (formData.itemId != null) {
    params.itemId = formData.itemId
  }
  if (formData.checkResult != null) {
    params.checkResult = formData.checkResult
  }
  return params
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildParams())
}

/** 重置字段 */
function resetFields() {
  formData.code = ''
  formData.type = undefined
  formData.workOrderId = undefined
  formData.itemId = undefined
  formData.checkResult = undefined
  selectedWorkOrderName.value = ''
  selectedItemName.value = ''
}

/** 重置按钮操作 */
function handleReset() {
  resetFields()
  visible.value = false
  emit('reset')
}

defineExpose({ resetFields })
</script>
