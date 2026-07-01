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
          SN 码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入 SN 码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          物料
        </view>
        <MesSearchSelectorField
          :model-value="selectedItemText"
          placeholder="请选择物料"
          clearable
          @click="openItemSelector"
          @clear="clearItem"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          批次号
        </view>
        <wd-input
          v-model="formData.batchCode"
          placeholder="请输入批次号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          创建时间
        </view>
        <wd-calendar v-model="createTimeRange" type="daterange" placeholder="请选择创建时间范围" />
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

  <ItemSelector ref="itemSelectorRef" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——① wd-calendar 日期范围改全局 yd-search-date-range（createTime）；② 物料选择器 MesSearchSelectorField+ItemSelector 后续评估收敛为 yd-search-picker
import type { MdItemVO } from '@/api/mes/md/item'
import type { WmSnQueryParams } from '@/api/mes/wm/sn'
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDateRange } from '@/utils/date'
import MesSearchSelectorField from '@/pages-mes/components/mes-search-selector-field.vue'
import ItemSelector from '../../../md/item/components/item-selector.vue'

const emit = defineEmits<{
  search: [data: WmSnQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器
const selectedItem = ref<MdItemVO>() // 已选物料
const createTimeRange = ref<[string, string]>() // 创建时间范围
const formData = reactive<Pick<WmSnQueryParams, 'code' | 'itemId' | 'batchCode'>>({
  code: '',
  itemId: undefined,
  batchCode: '',
}) // 搜索表单数据
const selectedItemText = computed(() => selectedItem.value ? `${selectedItem.value.code || '-'} / ${selectedItem.value.name || '-'}` : '')

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`SN 码:${formData.code}`)
  }
  if (selectedItem.value) {
    conditions.push(`物料:${selectedItem.value.code}`)
  }
  if (formData.batchCode) {
    conditions.push(`批次号:${formData.batchCode}`)
  }
  if (createTimeRange.value?.length === 2) {
    conditions.push('创建时间')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索 SN 码'
})

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
  formData.itemId = item.id
}

/** 清空物料 */
function clearItem() {
  selectedItem.value = undefined
  formData.itemId = undefined
}

/** 构造搜索参数 */
function buildParams() {
  const params: WmSnQueryParams = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.itemId) {
    params.itemId = formData.itemId
  }
  if (formData.batchCode) {
    params.batchCode = formData.batchCode
  }
  const range = formatDateRange(createTimeRange.value)
  if (range) {
    params.createTime = range
  }
  return params
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildParams())
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.itemId = undefined
  formData.batchCode = ''
  selectedItem.value = undefined
  createTimeRange.value = undefined
  visible.value = false
  emit('reset')
}
</script>
