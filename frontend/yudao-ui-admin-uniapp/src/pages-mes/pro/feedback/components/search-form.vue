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
          报工单号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入报工单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          报工类型
        </view>
        <wd-radio-group v-model="formData.type" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_FEEDBACK_TYPE)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          生产工单
        </view>
        <view class="rounded-8rpx bg-[#f7f8fa] px-20rpx py-18rpx text-28rpx text-[#333]" @click="workOrderSelectorRef?.open(formData.workOrderId)">
          {{ selectedWorkOrderName || '请选择工单' }}
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          产品物料
        </view>
        <view class="rounded-8rpx bg-[#f7f8fa] px-20rpx py-18rpx text-28rpx text-[#333]" @click="itemSelectorRef?.open()">
          {{ selectedItemName || '请选择产品物料' }}
        </view>
      </view>
      <UserPicker
        ref="feedbackUserPickerRef"
        v-model="formData.feedbackUserId"
        label="报工人"
        label-width="180rpx"
        type="radio"
        placeholder="请选择报工人"
      />
      <UserPicker
        ref="creatorPickerRef"
        v-model="formData.creator"
        label="记录人"
        label-width="180rpx"
        type="radio"
        placeholder="请选择记录人"
      />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_FEEDBACK_STATUS)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          报工时间
        </view>
        <wd-calendar v-model="formData.feedbackTime" type="daterange" />
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
// TODO @YunaiV：搜索风格对齐 system/infra——wd-radio-group 状态/类型筛选改 yd-search-picker（配 dict-kind + all-option）；wd-calendar 日期范围改全局 yd-search-date-range；业务选择器（Selector/MesSearchSelectorField）后续评估收敛为 yd-search-picker
import type { ProFeedbackQueryParams } from '@/api/mes/pro/feedback'
import type { MdItemVO } from '@/api/mes/md/item'
import type { ProWorkOrderVO } from '@/api/mes/pro/workorder'
import { computed, reactive, ref } from 'vue'
import UserPicker from '@/components/system-select/user-picker.vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'
import ItemSelector from '../../../md/item/components/item-selector.vue'
import WorkOrderSelector from '../../card/components/workorder-selector.vue'

const emit = defineEmits<{
  search: [data: Partial<ProFeedbackQueryParams>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Partial<ProFeedbackQueryParams>>({
  code: undefined,
  type: undefined,
  workOrderId: undefined,
  itemId: undefined,
  feedbackUserId: undefined,
  creator: undefined,
  status: undefined,
  feedbackTime: undefined,
}) // 搜索表单数据
const selectedWorkOrderName = ref('') // 已选工单展示
const selectedItemName = ref('') // 已选物料展示
const workOrderSelectorRef = ref<InstanceType<typeof WorkOrderSelector>>() // 工单选择器引用
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const feedbackUserPickerRef = ref<InstanceType<typeof UserPicker>>() // 报工人选择器引用
const creatorPickerRef = ref<InstanceType<typeof UserPicker>>() // 记录人选择器引用

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`单号:${formData.code}`)
  }
  if (formData.type != null) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_PRO_FEEDBACK_TYPE, formData.type) || formData.type}`)
  }
  if (formData.workOrderId) {
    conditions.push(`工单:${selectedWorkOrderName.value || formData.workOrderId}`)
  }
  if (formData.itemId) {
    conditions.push(`物料:${selectedItemName.value || formData.itemId}`)
  }
  if (formData.feedbackUserId) {
    const nickname = feedbackUserPickerRef.value?.getUserNickname(formData.feedbackUserId)
    conditions.push(`报工人:${nickname || formData.feedbackUserId}`)
  }
  if (formData.creator) {
    const nickname = creatorPickerRef.value?.getUserNickname(formData.creator)
    conditions.push(`记录人:${nickname || formData.creator}`)
  }
  if (formData.status != null) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_PRO_FEEDBACK_STATUS, formData.status) || formData.status}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索生产报工'
})

/** 确认工单 */
function handleWorkOrderConfirm(item: ProWorkOrderVO) {
  formData.workOrderId = item.id
  selectedWorkOrderName.value = item.code || item.name || `工单 #${item.id}`
}

/** 确认物料 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  formData.itemId = item?.id
  selectedItemName.value = item ? `${item.code || '-'} / ${item.name || '-'}` : ''
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    feedbackTime: formatDateRange(formData.feedbackTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.type = undefined
  formData.workOrderId = undefined
  formData.itemId = undefined
  formData.feedbackUserId = undefined
  formData.creator = undefined
  formData.status = undefined
  formData.feedbackTime = undefined
  selectedWorkOrderName.value = ''
  selectedItemName.value = ''
  visible.value = false
  emit('reset')
}
</script>
