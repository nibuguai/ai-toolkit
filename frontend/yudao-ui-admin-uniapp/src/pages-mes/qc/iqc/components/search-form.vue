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
          供应商
        </view>
        <view class="flex items-center gap-16rpx">
          <wd-input
            :model-value="selectedVendorName"
            placeholder="请选择供应商"
            clearable
            readonly
            class="min-w-0 flex-1"
            @click="openVendorSelector"
            @clear="clearVendor"
          />
          <wd-button size="small" @click="openVendorSelector">
            选择
          </wd-button>
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          供应商批次
        </view>
        <wd-input v-model="formData.vendorBatch" placeholder="请输入供应商批次号" clearable />
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
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          来料日期
        </view>
        <wd-calendar v-model="receiveDateRange" type="daterange" placeholder="请选择来料日期范围" />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          检测日期
        </view>
        <wd-calendar v-model="inspectDateRange" type="daterange" placeholder="请选择检测日期范围" />
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

  <VendorSelector ref="vendorSelectorRef" title="选择供应商" :multiple="false" @confirm="handleVendorConfirm" />
  <ItemSelector ref="itemSelectorRef" title="选择产品物料" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——wd-radio-group 状态/类型筛选改 yd-search-picker（配 dict-kind + all-option）；wd-calendar 日期范围改全局 yd-search-date-range；业务选择器（Selector/MesSearchSelectorField）后续评估收敛为 yd-search-picker
import type { MdItemVO } from '@/api/mes/md/item'
import type { MdVendorVO } from '@/api/mes/md/vendor'
import type { QcIqcPageParam } from '@/api/mes/qc/iqc'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'
import VendorSelector from '@/pages-mes/md/vendor/components/vendor-selector.vue'

const emit = defineEmits<{
  search: [data: Partial<QcIqcPageParam>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const receiveDateRange = ref<[string, string]>() // 来料日期范围
const inspectDateRange = ref<[string, string]>() // 检测日期范围
const selectedVendorName = ref('') // 已选供应商展示名
const selectedItemName = ref('') // 已选物料展示名
const vendorSelectorRef = ref<InstanceType<typeof VendorSelector>>() // 供应商选择器引用
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const formData = reactive({
  code: '',
  vendorId: undefined as number | undefined,
  vendorBatch: '',
  itemId: undefined as number | undefined,
  checkResult: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.vendorId != null) {
    conditions.push(`供应商:${selectedVendorName.value || formData.vendorId}`)
  }
  if (formData.vendorBatch) {
    conditions.push(`批次:${formData.vendorBatch}`)
  }
  if (formData.itemId != null) {
    conditions.push(`物料:${selectedItemName.value || formData.itemId}`)
  }
  if (formData.checkResult != null) {
    conditions.push(`结果:${getDictLabel(DICT_TYPE.MES_QC_CHECK_RESULT, formData.checkResult) || formData.checkResult}`)
  }
  if (receiveDateRange.value?.length === 2) {
    conditions.push('来料日期')
  }
  if (inspectDateRange.value?.length === 2) {
    conditions.push('检测日期')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索来料检验单（IQC）'
})

/** 打开供应商选择器 */
function openVendorSelector() {
  vendorSelectorRef.value?.open()
}

/** 清空供应商 */
function clearVendor() {
  formData.vendorId = undefined
  selectedVendorName.value = ''
}

/** 确认供应商 */
function handleVendorConfirm(vendors: MdVendorVO[]) {
  const vendor = vendors[0]
  formData.vendorId = vendor?.id
  selectedVendorName.value = vendor ? `${vendor.code || '-'} ${vendor.nickname || vendor.name || ''}`.trim() : ''
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
function buildParams(): Partial<QcIqcPageParam> {
  const params: Partial<QcIqcPageParam> = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.vendorId != null) {
    params.vendorId = formData.vendorId
  }
  if (formData.vendorBatch) {
    params.vendorBatch = formData.vendorBatch
  }
  if (formData.itemId != null) {
    params.itemId = formData.itemId
  }
  if (formData.checkResult != null) {
    params.checkResult = formData.checkResult
  }
  const receiveDate = formatDateRange(receiveDateRange.value)
  if (receiveDate) {
    params.receiveDate = receiveDate
  }
  const inspectDate = formatDateRange(inspectDateRange.value)
  if (inspectDate) {
    params.inspectDate = inspectDate
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
  formData.vendorId = undefined
  formData.vendorBatch = ''
  formData.itemId = undefined
  formData.checkResult = undefined
  receiveDateRange.value = undefined
  inspectDateRange.value = undefined
  selectedVendorName.value = ''
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
