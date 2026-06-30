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
          来源单据类型
        </view>
        <wd-radio-group v-model="formData.sourceDocType" type="button">
          <wd-radio v-for="dict in sourceDocTypeOptions" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          来源单据编号
        </view>
        <wd-input v-model="formData.sourceDocCode" placeholder="请输入来源单据编号" clearable />
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
          批次号
        </view>
        <wd-input v-model="formData.batchCode" placeholder="请输入批次号" clearable />
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
        <UserPicker v-model="formData.inspectorUserId" label="检测人员" type="radio" placeholder="请选择检测人员" />
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

  <ItemSelector ref="itemSelectorRef" title="选择产品物料" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——wd-radio-group 状态/类型筛选改 yd-search-picker（配 dict-kind + all-option）；业务选择器（Selector/MesSearchSelectorField）后续评估收敛为 yd-search-picker
import type { MdItemVO } from '@/api/mes/md/item'
import type { QcRqcPageParam } from '@/api/mes/qc/rqc'
import UserPicker from '@/components/system-select/user-picker.vue'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'

const emit = defineEmits<{
  search: [data: Partial<QcRqcPageParam>]
  reset: []
}>()

const MesQcSourceDocTypeEnum = {
  RETURN_ISSUE: 116,
  RETURN_SALES: 119,
} as const

const visible = ref(false) // 搜索弹窗显示状态
const selectedItemName = ref('') // 已选物料展示名
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const formData = reactive({
  code: '',
  sourceDocType: undefined as number | undefined,
  sourceDocCode: '',
  itemId: undefined as number | undefined,
  batchCode: '',
  checkResult: undefined as number | undefined,
  inspectorUserId: undefined as number | undefined,
}) // 搜索表单数据
const sourceDocTypeOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_QC_SOURCE_DOC_TYPE).filter(dict =>
  dict.value === MesQcSourceDocTypeEnum.RETURN_ISSUE || dict.value === MesQcSourceDocTypeEnum.RETURN_SALES,
))

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.sourceDocType != null) {
    conditions.push(`来源:${getDictLabel(DICT_TYPE.MES_QC_SOURCE_DOC_TYPE, formData.sourceDocType) || formData.sourceDocType}`)
  }
  if (formData.sourceDocCode) {
    conditions.push(`来源编号:${formData.sourceDocCode}`)
  }
  if (formData.itemId != null) {
    conditions.push(`物料:${selectedItemName.value || formData.itemId}`)
  }
  if (formData.batchCode) {
    conditions.push(`批次:${formData.batchCode}`)
  }
  if (formData.checkResult != null) {
    conditions.push(`结果:${getDictLabel(DICT_TYPE.MES_QC_CHECK_RESULT, formData.checkResult) || formData.checkResult}`)
  }
  if (formData.inspectorUserId != null) {
    conditions.push(`人员:${formData.inspectorUserId}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索退料检验单（RQC）'
})

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
function buildParams(): Partial<QcRqcPageParam> {
  const params: Partial<QcRqcPageParam> = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.sourceDocType != null) {
    params.sourceDocType = formData.sourceDocType
  }
  if (formData.sourceDocCode) {
    params.sourceDocCode = formData.sourceDocCode
  }
  if (formData.itemId != null) {
    params.itemId = formData.itemId
  }
  if (formData.batchCode) {
    params.batchCode = formData.batchCode
  }
  if (formData.checkResult != null) {
    params.checkResult = formData.checkResult
  }
  if (formData.inspectorUserId != null) {
    params.inspectorUserId = formData.inspectorUserId
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
  formData.sourceDocType = undefined
  formData.sourceDocCode = ''
  formData.itemId = undefined
  formData.batchCode = ''
  formData.checkResult = undefined
  formData.inspectorUserId = undefined
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
