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
          来源单据编号
        </view>
        <wd-input
          v-model="formData.sourceDocCode"
          placeholder="请输入来源单据编号"
          clearable
        />
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
          检验类型
        </view>
        <wd-radio-group v-model="formData.qcType" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_TYPE)" :key="dict.value" :value="dict.value">
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

  <ItemSelector ref="itemSelectorRef" title="选择产品物料" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——wd-radio-group 状态/类型筛选改 yd-search-picker（配 dict-kind + all-option）；业务选择器（Selector/MesSearchSelectorField）后续评估收敛为 yd-search-picker
import type { MdItemVO } from '@/api/mes/md/item'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'

const props = defineProps<{
  initialQuery?: {
    sourceDocCode?: string
    qcType?: number
    itemId?: number
  }
}>()

const emit = defineEmits<{
  search: [data: {
    sourceDocCode?: string
    qcType?: number
    itemId?: number
  }]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  sourceDocCode: props.initialQuery?.sourceDocCode,
  itemId: props.initialQuery?.itemId,
  qcType: props.initialQuery?.qcType,
}) // 搜索表单数据
const selectedItemName = ref('') // 已选物料展示名
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.sourceDocCode !== undefined && formData.sourceDocCode !== '') {
    conditions.push(`来源单据编号:${formData.sourceDocCode}`)
  }
  if (formData.itemId !== undefined) {
    conditions.push(`产品物料:${selectedItemName.value || formData.itemId}`)
  }
  if (formData.qcType !== undefined) {
    conditions.push(`检验类型:${getDictLabel(DICT_TYPE.MES_QC_TYPE, formData.qcType) || formData.qcType}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索待检任务'
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

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置按钮操作 */
function handleReset() {
  formData.sourceDocCode = undefined
  formData.itemId = undefined
  formData.qcType = undefined
  selectedItemName.value = ''
  visible.value = false
  emit('reset')
}
</script>
